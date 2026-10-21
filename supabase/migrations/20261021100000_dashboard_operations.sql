-- iBuzz operations dashboard: additive schema for order history, inventory audit,
-- repair jobs, support tickets, and auditable owner actions.
begin;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  payment_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_created_idx
  on public.order_status_history(order_id, created_at);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_delta integer not null,
  stock_after integer not null check (stock_after >= 0),
  reason text not null default 'adjustment',
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements(product_id, created_at desc);

create table if not exists public.repair_jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique default ('RPR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  enquiry_id uuid references public.service_enquiries(id) on delete set null,
  customer_name text not null,
  customer_contact text not null,
  device text not null,
  issue_description text not null,
  diagnosis text,
  status text not null default 'received' check (status in ('received','diagnosing','awaiting_approval','awaiting_parts','repairing','testing','ready_for_collection','completed','cancelled')),
  quoted_price numeric(12,2) not null default 0 check (quoted_price >= 0),
  final_price numeric(12,2) not null default 0 check (final_price >= 0),
  parts_cost numeric(12,2) not null default 0 check (parts_cost >= 0),
  labour_cost numeric(12,2) not null default 0 check (labour_cost >= 0),
  warranty_until date,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists repair_jobs_status_created_idx on public.repair_jobs(status, created_at desc);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  subject text not null check (length(trim(subject)) between 3 and 160),
  message text not null check (length(trim(message)) between 5 and 5000),
  status text not null default 'open' check (status in ('open','in_progress','waiting_customer','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_user_created_idx on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_status_created_idx on public.support_tickets(status, created_at desc);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

-- A database constraint protects against negative stock even when concurrent writes race.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_stock_nonnegative') then
    alter table public.products add constraint products_stock_nonnegative check (stock >= 0);
  end if;
end $$;

alter table public.order_status_history enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.repair_jobs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Customers and admins read order status history" on public.order_status_history;
create policy "Customers and admins read order status history" on public.order_status_history
  for select to authenticated using (
    public.has_role('admin', auth.uid()) or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage inventory movements" on public.inventory_movements;
create policy "Admins read inventory movements" on public.inventory_movements
  for select to authenticated using (public.has_role('admin', auth.uid()));

drop policy if exists "Admins manage repair jobs" on public.repair_jobs;
create policy "Admins read repair jobs" on public.repair_jobs
  for select to authenticated using (public.has_role('admin', auth.uid()));
create policy "Admins insert repair jobs" on public.repair_jobs
  for insert to authenticated with check (public.has_role('admin', auth.uid()));
create policy "Admins update repair jobs" on public.repair_jobs
  for update to authenticated using (public.has_role('admin', auth.uid())) with check (public.has_role('admin', auth.uid()));
create policy "Admins delete repair jobs" on public.repair_jobs
  for delete to authenticated using (public.has_role('admin', auth.uid()));

drop policy if exists "Customers and admins read support tickets" on public.support_tickets;
create policy "Customers and admins read support tickets" on public.support_tickets
  for select to authenticated using (user_id = auth.uid() or public.has_role('admin', auth.uid()));
create policy "Customers create own support tickets" on public.support_tickets
  for insert to authenticated with check (user_id = auth.uid());
create policy "Admins update support tickets" on public.support_tickets
  for update to authenticated using (public.has_role('admin', auth.uid())) with check (public.has_role('admin', auth.uid()));

drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log
  for select to authenticated using (public.has_role('admin', auth.uid()));

create or replace function public.ibuzz_record_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history(order_id, status, payment_status, note, changed_by)
    values (new.id, new.status, new.payment_status, 'Order created', auth.uid());
  elsif old.status is distinct from new.status or old.payment_status is distinct from new.payment_status then
    insert into public.order_status_history(order_id, status, payment_status, note, changed_by)
    values (new.id, new.status, new.payment_status, 'Order status updated', auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists ibuzz_order_status_history on public.orders;
create trigger ibuzz_order_status_history after insert or update of status, payment_status on public.orders
for each row execute function public.ibuzz_record_order_status();

create or replace function public.ibuzz_record_inventory_movement()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  delta integer;
  why text;
begin
  if tg_op = 'INSERT' then
    delta := coalesce(new.stock, 0);
    why := 'initial_stock';
  else
    delta := coalesce(new.stock, 0) - coalesce(old.stock, 0);
    why := case when new.status = 'sold' and old.status is distinct from 'sold' then 'marked_sold' else 'stock_adjustment' end;
  end if;
  if delta <> 0 then
    insert into public.inventory_movements(product_id, quantity_delta, stock_after, reason, changed_by)
    values (new.id, delta, new.stock, why, auth.uid());
    insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
    values (auth.uid(), 'inventory_changed', 'products', new.id::text,
      jsonb_build_object('delta', delta, 'stock_after', new.stock, 'reason', why));
  end if;
  return new;
end $$;

drop trigger if exists ibuzz_inventory_history on public.products;
create trigger ibuzz_inventory_history after insert or update of stock on public.products
for each row execute function public.ibuzz_record_inventory_movement();

create or replace function public.ibuzz_audit_order_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
    values (auth.uid(), 'order_created', 'orders', new.id::text,
      jsonb_build_object('status', new.status, 'payment_status', new.payment_status, 'total', new.total));
  elsif old.status is distinct from new.status or old.payment_status is distinct from new.payment_status
     or old.tracking_number is distinct from new.tracking_number or old.tracking_url is distinct from new.tracking_url then
    insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
    values (auth.uid(), 'order_updated', 'orders', new.id::text,
      jsonb_build_object('status', new.status, 'payment_status', new.payment_status,
        'tracking_number_changed', old.tracking_number is distinct from new.tracking_number,
        'tracking_url_changed', old.tracking_url is distinct from new.tracking_url));
  end if;
  return new;
end $$;

drop trigger if exists ibuzz_order_audit on public.orders;
create trigger ibuzz_order_audit after insert or update on public.orders
for each row execute function public.ibuzz_audit_order_changes();

create or replace function public.ibuzz_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists repair_jobs_touch_updated_at on public.repair_jobs;
create trigger repair_jobs_touch_updated_at before update on public.repair_jobs
for each row execute function public.ibuzz_touch_updated_at();
drop trigger if exists support_tickets_touch_updated_at on public.support_tickets;
create trigger support_tickets_touch_updated_at before update on public.support_tickets
for each row execute function public.ibuzz_touch_updated_at();

commit;
