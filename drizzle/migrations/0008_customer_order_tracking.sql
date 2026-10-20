-- Customer order tracking
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('IB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete cascade,
  buyer_name text not null check (char_length(buyer_name) between 1 and 100),
  buyer_contact text not null check (char_length(buyer_contact) between 1 and 150),
  total numeric(12,2) not null check (total >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','submitted','paid','failed','refunded')),
  status text not null default 'received' check (status in ('received','confirmed','processing','shipped','ready_for_pickup','completed','cancelled')),
  tracking_number text,
  tracking_url text,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(12,2) not null check (line_total >= 0)
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
grant select on public.orders, public.order_items to authenticated;
grant all on public.orders, public.order_items to service_role;
create policy "customers read own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "admins read all orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "customers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admins read all order items" on public.order_items for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.create_customer_order(p_buyer_name text, p_buyer_contact text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
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
  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_item.value->>'id','') !~* '^[0-9a-f-]{36}$' then raise exception 'Invalid product'; end if;
    if coalesce(v_item.value->>'quantity','') !~ '^[0-9]{1,2}$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item.value->>'quantity')::integer;
    if v_qty < 1 or v_qty > 99 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid for share;
    if not found or v_product.status <> 'available' or v_product.stock < v_qty then raise exception 'A product is no longer available'; end if;
    v_total := v_total + v_product.price * v_qty;
  end loop;
  insert into public.orders(user_id, buyer_name, buyer_contact, total)
  values (v_user_id, trim(p_buyer_name), trim(p_buyer_contact), v_total)
  returning id, order_number into v_order_id, v_order_number;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item.value->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid;
    insert into public.order_items(order_id, product_id, product_title, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, coalesce(nullif(v_product.title, ''), 'Product'), v_product.price, v_qty, v_product.price * v_qty);
  end loop;
  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$$;
revoke all on function public.create_customer_order(text, text, jsonb) from public;
grant execute on function public.create_customer_order(text, text, jsonb) to authenticated;
