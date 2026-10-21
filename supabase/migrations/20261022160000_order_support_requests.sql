begin;

create table if not exists public.order_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  request_type text not null check (request_type in ('question','issue','cancellation')),
  subject text not null check (char_length(trim(subject)) between 3 and 160),
  message text not null check (char_length(trim(message)) between 10 and 4000),
  status text not null default 'open' check (status in ('open','in_review','waiting_for_customer','resolved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_support_requests_user_created_idx
  on public.order_support_requests (user_id, created_at desc);
create index if not exists order_support_requests_order_created_idx
  on public.order_support_requests (order_id, created_at desc);

alter table public.order_support_requests enable row level security;
revoke all on public.order_support_requests from public, anon;
grant select, insert on public.order_support_requests to authenticated;
grant all on public.order_support_requests to service_role;

drop policy if exists "Customers read their own order support requests" on public.order_support_requests;
create policy "Customers read their own order support requests"
  on public.order_support_requests for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Customers create support requests for their own orders" on public.order_support_requests;
create policy "Customers create support requests for their own orders"
  on public.order_support_requests for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

commit;
