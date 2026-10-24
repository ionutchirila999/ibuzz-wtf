begin;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(trim(title)) between 3 and 120),
  body text not null check (char_length(trim(body)) between 10 and 3000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index if not exists product_reviews_visible_product_created_idx
  on public.product_reviews (product_id, created_at desc)
  where is_visible = true;

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from public, anon, authenticated;
grant select on public.product_reviews to anon, authenticated;
grant insert on public.product_reviews to authenticated;

drop policy if exists "Anyone can read visible product reviews" on public.product_reviews;
create policy "Anyone can read visible product reviews"
  on public.product_reviews for select to anon, authenticated
  using (is_visible = true);

drop policy if exists "Customers review completed purchases once" on public.product_reviews;
create policy "Customers review completed purchases once"
  on public.product_reviews for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.payment_status = 'paid'
        and o.status = 'completed'
        and oi.product_id = product_id
    )
  );

commit;
