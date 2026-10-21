begin;

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_product_unique unique (user_id, product_id)
);

create index if not exists wishlist_items_user_created_idx
  on public.wishlist_items (user_id, created_at desc);

alter table public.wishlist_items enable row level security;
revoke all on public.wishlist_items from public, anon;
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;

drop policy if exists "Customers read their own wishlist" on public.wishlist_items;
create policy "Customers read their own wishlist"
  on public.wishlist_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Customers add to their own wishlist" on public.wishlist_items;
create policy "Customers add to their own wishlist"
  on public.wishlist_items for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Customers remove from their own wishlist" on public.wishlist_items;
create policy "Customers remove from their own wishlist"
  on public.wishlist_items for delete to authenticated
  using (auth.uid() = user_id);

commit;
