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
    public.has_role(auth.uid(), 'admin'::public.app_role) or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage inventory movements" on public.inventory_movements;
create policy "Admins read inventory movements" on public.inventory_movements
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins manage repair jobs" on public.repair_jobs;
create policy "Admins read repair jobs" on public.repair_jobs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins insert repair jobs" on public.repair_jobs
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins update repair jobs" on public.repair_jobs
  for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins delete repair jobs" on public.repair_jobs
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Customers and admins read support tickets" on public.support_tickets;
create policy "Customers and admins read support tickets" on public.support_tickets
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Customers create own support tickets" on public.support_tickets
  for insert to authenticated with check (user_id = auth.uid());
create policy "Admins update support tickets" on public.support_tickets
  for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));

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


-- Checkout is the authoritative stock reservation point. Lock products during
-- validation, reject duplicate product IDs, then decrement stock atomically.
create or replace function public.create_customer_order(p_buyer_name text, p_buyer_contact text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_total numeric(12,2) := 0;
  v_item record;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if v_user_id is null then raise exception 'Sign in to place an order'; end if;
  if length(trim(coalesce(p_buyer_name, ''))) not between 1 and 100 then raise exception 'Enter your name'; end if;
  if length(trim(coalesce(p_buyer_contact, ''))) not between 1 and 150 then raise exception 'Enter a valid contact'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order items'; end if;
  if exists (select value->>'id' from jsonb_array_elements(p_items) group by value->>'id' having count(*) > 1) then
    raise exception 'Duplicate product in order';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    if length(coalesce(v_item.value->>'id','')) <> 36 or coalesce(v_item.value->>'id','') ~* '[^0-9a-f-]' then raise exception 'Invalid product'; end if;
    if length(coalesce(v_item.value->>'quantity','')) not between 1 and 2 or coalesce(v_item.value->>'quantity','') ~ '[^0-9]' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item.value->>'quantity')::integer;
    if v_qty < 1 or v_qty > 99 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid for update;
    if not found or v_product.status <> 'available' or v_product.stock < v_qty then raise exception 'A product is no longer available'; end if;
    v_total := v_total + v_product.price * v_qty;
  end loop;
  insert into public.orders(user_id, buyer_name, buyer_contact, total)
  values (v_user_id, trim(p_buyer_name), trim(p_buyer_contact), v_total)
  returning id, order_number into v_order_id, v_order_number;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    v_qty := (v_item.value->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid;
    update public.products
      set stock = stock - v_qty,
          status = case when stock - v_qty = 0 then 'sold' else status end,
          updated_at = now()
      where id = v_product.id and status = 'available' and stock >= v_qty;
    if not found then raise exception 'A product is no longer available'; end if;
    insert into public.order_items(order_id, product_id, product_title, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, coalesce(nullif(v_product.title, ''), 'Product'), v_product.price, v_qty, v_product.price * v_qty);
  end loop;
  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$function$;

create or replace function public.ibuzz_audit_repair_changes()
returns trigger language plpgsql security definer set search_path = public as $repair_audit$
begin
  insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
  values (auth.uid(), case when tg_op = 'INSERT' then 'repair_created' else 'repair_updated' end,
    'repair_jobs', new.id::text,
    jsonb_build_object('job_number', new.job_number, 'status', new.status, 'quoted_price', new.quoted_price, 'final_price', new.final_price));
  return new;
end $repair_audit$;
drop trigger if exists ibuzz_repair_audit on public.repair_jobs;
create trigger ibuzz_repair_audit after insert or update on public.repair_jobs
for each row execute function public.ibuzz_audit_repair_changes();

create or replace function public.ibuzz_audit_support_changes()
returns trigger language plpgsql security definer set search_path = public as $support_audit$
begin
  if tg_op = 'UPDATE' and (old.status is distinct from new.status or old.admin_reply is distinct from new.admin_reply) then
    insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
    values (auth.uid(), 'support_ticket_updated', 'support_tickets', new.id::text,
      jsonb_build_object('status', new.status, 'reply_changed', old.admin_reply is distinct from new.admin_reply));
  end if;
  return new;
end $support_audit$;
drop trigger if exists ibuzz_support_audit on public.support_tickets;
create trigger ibuzz_support_audit after update on public.support_tickets
for each row execute function public.ibuzz_audit_support_changes();

commit;
