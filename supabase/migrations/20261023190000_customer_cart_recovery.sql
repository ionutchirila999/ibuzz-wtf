-- Persist signed-in customer carts so they can be recovered across devices.
create table if not exists public.customer_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint customer_carts_items_array check (jsonb_typeof(items) = 'array')
);

alter table public.customer_carts enable row level security;

drop policy if exists "Customers manage their own cart" on public.customer_carts;
create policy "Customers manage their own cart"
  on public.customer_carts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.customer_carts to authenticated;
revoke all on public.customer_carts from anon;
