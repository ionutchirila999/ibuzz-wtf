begin;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('new_order','payment_attention','order_cancelled','low_stock','out_of_stock')),
  order_id uuid references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_created_idx
  on public.admin_notifications (created_at desc) where read_at is null;
create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from public, anon, authenticated;
grant select, update on public.admin_notifications to authenticated;

drop policy if exists "Admins read admin notifications" on public.admin_notifications;
create policy "Admins read admin notifications"
  on public.admin_notifications for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins mark admin notifications read" on public.admin_notifications;
create policy "Admins mark admin notifications read"
  on public.admin_notifications for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.ibuzz_notify_admin_order_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_notifications (event_type, order_id, title, message, metadata)
    values (
      'new_order',
      new.id,
      'New order received',
      'Order ' || coalesce(new.order_number, new.id::text) || ' requires review.',
      jsonb_build_object('order_number', new.order_number, 'total', new.total, 'payment_status', new.payment_status)
    );
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
     and new.payment_status in ('submitted', 'failed') then
    insert into public.admin_notifications (event_type, order_id, title, message, metadata)
    values (
      'payment_attention',
      new.id,
      case when new.payment_status = 'failed' then 'Payment failed' else 'Payment proof submitted' end,
      'Order ' || coalesce(new.order_number, new.id::text) || ' needs payment review.',
      jsonb_build_object('order_number', new.order_number, 'total', new.total, 'payment_status', new.payment_status)
    );
  end if;

  if new.status is distinct from old.status and new.status = 'cancelled' then
    insert into public.admin_notifications (event_type, order_id, title, message, metadata)
    values (
      'order_cancelled',
      new.id,
      'Order cancelled',
      'Order ' || coalesce(new.order_number, new.id::text) || ' was cancelled. Check stock and any payment/refund follow-up.',
      jsonb_build_object('order_number', new.order_number, 'total', new.total, 'payment_status', new.payment_status)
    );
  end if;

  return new;
end;
$function$;

revoke all on function public.ibuzz_notify_admin_order_events() from public, anon, authenticated;
drop trigger if exists admin_notifications_order_insert on public.orders;
create trigger admin_notifications_order_insert
  after insert on public.orders
  for each row execute function public.ibuzz_notify_admin_order_events();
drop trigger if exists admin_notifications_order_update on public.orders;
create trigger admin_notifications_order_update
  after update of status, payment_status on public.orders
  for each row execute function public.ibuzz_notify_admin_order_events();

create or replace function public.ibuzz_notify_admin_stock_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_threshold integer := greatest(0, coalesce(new.low_stock_threshold, 2));
begin
  if new.stock is not distinct from old.stock then return new; end if;

  if old.stock > 0 and new.stock = 0 then
    insert into public.admin_notifications (event_type, product_id, title, message, metadata)
    values ('out_of_stock', new.id, 'Product out of stock', coalesce(nullif(new.title, ''), 'A product') || ' is now out of stock.',
      jsonb_build_object('product_id', new.id, 'title', new.title, 'stock', new.stock));
  elsif old.stock > v_threshold and new.stock <= v_threshold then
    insert into public.admin_notifications (event_type, product_id, title, message, metadata)
    values ('low_stock', new.id, 'Low stock alert', coalesce(nullif(new.title, ''), 'A product') || ' has ' || new.stock::text || ' unit(s) remaining.',
      jsonb_build_object('product_id', new.id, 'title', new.title, 'stock', new.stock, 'threshold', v_threshold));
  end if;

  return new;
end;
$function$;

revoke all on function public.ibuzz_notify_admin_stock_events() from public, anon, authenticated;
drop trigger if exists admin_notifications_product_stock_update on public.products;
create trigger admin_notifications_product_stock_update
  after update of stock on public.products
  for each row execute function public.ibuzz_notify_admin_stock_events();

commit;
