begin;

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  event_type text not null check (event_type in ('order_confirmation','payment_update','order_update','support_reply')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_notifications_user_created_idx
  on public.customer_notifications (user_id, created_at desc);
create index if not exists customer_notifications_user_unread_idx
  on public.customer_notifications (user_id, created_at desc) where read_at is null;

alter table public.customer_notifications enable row level security;
revoke all on public.customer_notifications from public, anon;
grant select, update on public.customer_notifications to authenticated;
grant all on public.customer_notifications to service_role;

drop policy if exists "Customers read their own notifications" on public.customer_notifications;
create policy "Customers read their own notifications"
  on public.customer_notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Customers mark their own notifications read" on public.customer_notifications;
create policy "Customers mark their own notifications read"
  on public.customer_notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_customer_order_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is not null then
    insert into public.customer_notifications (user_id, order_id, event_type, metadata)
    values (new.user_id, new.id, 'order_confirmation',
      jsonb_build_object('order_number', new.order_number, 'status', new.status, 'payment_status', new.payment_status));
  end if;
  return new;
end;
$$;

create or replace function public.notify_customer_order_updated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is null then return new; end if;

  if new.payment_status is distinct from old.payment_status then
    insert into public.customer_notifications (user_id, order_id, event_type, metadata)
    values (new.user_id, new.id, 'payment_update',
      jsonb_build_object('order_number', new.order_number, 'payment_status', new.payment_status));
  end if;

  if new.status is distinct from old.status
     or new.tracking_number is distinct from old.tracking_number
     or new.tracking_url is distinct from old.tracking_url then
    insert into public.customer_notifications (user_id, order_id, event_type, metadata)
    values (new.user_id, new.id, 'order_update',
      jsonb_build_object('order_number', new.order_number, 'status', new.status,
        'tracking_number', new.tracking_number, 'tracking_url', new.tracking_url));
  end if;

  return new;
end;
$$;

create or replace function public.notify_customer_support_reply()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is not null
     and nullif(trim(new.admin_reply), '') is not null
     and new.admin_reply is distinct from old.admin_reply then
    insert into public.customer_notifications (user_id, order_id, ticket_id, event_type, metadata)
    values (new.user_id, new.order_id, new.id, 'support_reply',
      jsonb_build_object('ticket_number', new.ticket_number, 'subject', new.subject, 'reply', left(new.admin_reply, 2000)));
  end if;
  return new;
end;
$$;

drop trigger if exists customer_order_created_notification on public.orders;
create trigger customer_order_created_notification
  after insert on public.orders
  for each row execute function public.notify_customer_order_created();

drop trigger if exists customer_order_updated_notification on public.orders;
create trigger customer_order_updated_notification
  after update of status, payment_status, tracking_number, tracking_url on public.orders
  for each row execute function public.notify_customer_order_updated();

drop trigger if exists customer_support_reply_notification on public.support_tickets;
create trigger customer_support_reply_notification
  after update of admin_reply on public.support_tickets
  for each row execute function public.notify_customer_support_reply();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'customer_notifications'
     ) then
    alter publication supabase_realtime add table public.customer_notifications;
  end if;
end $$;

commit;
