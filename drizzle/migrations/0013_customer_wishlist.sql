-- Customer wishlist. Customer profile fields are stored in private auth.user_metadata.
create table if not exists public.customer_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists customer_wishlist_user_created_idx
  on public.customer_wishlist(user_id, created_at desc);

alter table public.customer_wishlist enable row level security;
grant select, insert, delete on public.customer_wishlist to authenticated;
grant all on public.customer_wishlist to service_role;

create policy "customers read own wishlist"
  on public.customer_wishlist for select to authenticated
  using (auth.uid() = user_id);
create policy "customers save own wishlist"
  on public.customer_wishlist for insert to authenticated
  with check (auth.uid() = user_id);
create policy "customers remove own wishlist"
  on public.customer_wishlist for delete to authenticated
  using (auth.uid() = user_id);
