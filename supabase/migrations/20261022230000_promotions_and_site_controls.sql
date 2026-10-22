begin;

alter table public.products
  add column if not exists is_featured boolean not null default false,
  add column if not exists sold_out_label_en text not null default 'Sold out',
  add column if not exists sold_out_label_th text not null default 'สินค้าหมด',
  add column if not exists sold_out_label_ro text not null default 'Stoc epuizat';

alter table public.orders
  add column if not exists discount_code text,
  add column if not exists discount_amount numeric(12,2) not null default 0
  check (discount_amount >= 0);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(trim(code)) and length(code) between 3 and 40),
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at),
  check (discount_type <> 'percent' or discount_value <= 100)
);
create index if not exists discount_codes_active_code_idx on public.discount_codes(code) where is_active;
alter table public.discount_codes enable row level security;
grant select, insert, update, delete on public.discount_codes to authenticated;
drop policy if exists "Admins manage discount codes" on public.discount_codes;
create policy "Admins read discount codes" on public.discount_codes for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins insert discount codes" on public.discount_codes for insert to authenticated with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins update discount codes" on public.discount_codes for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins delete discount codes" on public.discount_codes for delete to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  code text not null,
  discount_amount numeric(12,2) not null check (discount_amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists discount_redemptions_code_created_idx on public.discount_redemptions(discount_code_id, created_at desc);
alter table public.discount_redemptions enable row level security;
create policy "Admins read discount redemptions" on public.discount_redemptions for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
revoke all on public.discount_redemptions from anon, authenticated;
grant select on public.discount_redemptions to authenticated;

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 180),
  body text,
  image_url text,
  link_url text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (image_url is null or image_url ~* '^https://'),
  check (link_url is null or link_url ~* '^https://'),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists site_banners_active_order_idx on public.site_banners(is_active, sort_order);
alter table public.site_banners enable row level security;
drop policy if exists "Public read active site banners" on public.site_banners;
create policy "Public read active site banners" on public.site_banners for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Admins manage site banners" on public.site_banners for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
revoke all on public.site_banners from anon, authenticated;
grant select on public.site_banners to anon, authenticated;
grant insert, update, delete on public.site_banners to authenticated;

create or replace function public.validate_discount_code(p_code text, p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  discount_row public.discount_codes%rowtype;
  amount numeric(12,2);
begin
  if p_subtotal is null or p_subtotal <= 0 then
    return jsonb_build_object('valid',false,'message','Add products to the cart first');
  end if;
  select * into discount_row from public.discount_codes where code = upper(trim(coalesce(p_code,''))) and is_active;
  if not found then return jsonb_build_object('valid',false,'message','Code is invalid or inactive'); end if;
  if discount_row.starts_at > now() then return jsonb_build_object('valid',false,'message','Code is not active yet'); end if;
  if discount_row.expires_at is not null and discount_row.expires_at <= now() then return jsonb_build_object('valid',false,'message','Code has expired'); end if;
  if discount_row.max_redemptions is not null and discount_row.redemption_count >= discount_row.max_redemptions then return jsonb_build_object('valid',false,'message','Code redemption limit reached'); end if;
  if p_subtotal < discount_row.min_order_amount then return jsonb_build_object('valid',false,'message','Order does not meet the minimum amount'); end if;
  amount := case when discount_row.discount_type = 'percent' then round(p_subtotal * discount_row.discount_value / 100, 2) else least(p_subtotal, discount_row.discount_value) end;
  return jsonb_build_object('valid',true,'code',discount_row.code,'discount_amount',amount,'discount_type',discount_row.discount_type,'discount_value',discount_row.discount_value);
end;
$$;
revoke all on function public.validate_discount_code(text, numeric) from public, anon;
grant execute on function public.validate_discount_code(text, numeric) to authenticated;

create or replace function public.create_customer_order(
  p_buyer_name text,
  p_buyer_contact text,
  p_items jsonb,
  p_shipping_address text,
  p_discount_code text
) returns jsonb
language plpgsql security definer set search_path = public as $function$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_discount_amount numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_item record;
  v_product public.products%rowtype;
  v_discount public.discount_codes%rowtype;
  v_qty integer;
begin
  if v_user_id is null then raise exception 'Sign in to place an order'; end if;
  if length(trim(coalesce(p_buyer_name, ''))) not between 1 and 100 then raise exception 'Enter your name'; end if;
  if length(trim(coalesce(p_buyer_contact, ''))) not between 1 and 150 then raise exception 'Enter a valid contact'; end if;
  if length(trim(coalesce(p_shipping_address, ''))) not between 10 and 1000 then raise exception 'Enter a complete delivery address'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order items'; end if;
  if exists (select value->>'id' from jsonb_array_elements(p_items) group by value->>'id' having count(*) > 1) then raise exception 'Duplicate product in order'; end if;

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    if length(coalesce(v_item.value->>'id','')) <> 36 or coalesce(v_item.value->>'id','') ~* '[^0-9a-f-]' then raise exception 'Invalid product'; end if;
    if length(coalesce(v_item.value->>'quantity','')) not between 1 and 2 or coalesce(v_item.value->>'quantity','') ~ '[^0-9]' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item.value->>'quantity')::integer;
    if v_qty < 1 or v_qty > 99 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid for update;
    if not found or v_product.status <> 'available' or v_product.stock < v_qty then raise exception 'A product is no longer available'; end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if nullif(trim(coalesce(p_discount_code,'')),'') is not null then
    select * into v_discount from public.discount_codes where code = upper(trim(p_discount_code)) for update;
    if not found or not v_discount.is_active then raise exception 'Discount code is invalid or inactive'; end if;
    if v_discount.starts_at > now() then raise exception 'Discount code is not active yet'; end if;
    if v_discount.expires_at is not null and v_discount.expires_at <= now() then raise exception 'Discount code has expired'; end if;
    if v_discount.max_redemptions is not null and v_discount.redemption_count >= v_discount.max_redemptions then raise exception 'Discount code redemption limit reached'; end if;
    if v_subtotal < v_discount.min_order_amount then raise exception 'Order does not meet the discount minimum'; end if;
    v_discount_amount := case when v_discount.discount_type='percent' then round(v_subtotal*v_discount.discount_value/100,2) else least(v_subtotal,v_discount.discount_value) end;
  end if;
  v_total := greatest(0,v_subtotal-v_discount_amount);

  insert into public.orders(user_id,buyer_name,buyer_contact,shipping_address,total,discount_code,discount_amount)
  values(v_user_id,trim(p_buyer_name),trim(p_buyer_contact),trim(p_shipping_address),v_total,nullif(upper(trim(coalesce(p_discount_code,''))),''),v_discount_amount)
  returning id,order_number into v_order_id,v_order_number;

  for v_item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    v_qty := (v_item.value->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item.value->>'id')::uuid;
    update public.products set stock=stock-v_qty,status=case when stock-v_qty=0 then 'sold' else status end,updated_at=now()
    where id=v_product.id and status='available' and stock>=v_qty;
    if not found then raise exception 'A product is no longer available'; end if;
    insert into public.order_items(order_id,product_id,product_title,unit_price,quantity,line_total)
    values(v_order_id,v_product.id,coalesce(nullif(v_product.title,''),'Product'),v_product.price,v_qty,v_product.price*v_qty);
  end loop;

  if v_discount_amount > 0 then
    update public.discount_codes set redemption_count=redemption_count+1 where id=v_discount.id;
    insert into public.discount_redemptions(discount_code_id,order_id,code,discount_amount)
    values(v_discount.id,v_order_id,v_discount.code,v_discount_amount);
  end if;
  return jsonb_build_object('id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'discount_code',nullif(upper(trim(coalesce(p_discount_code,''))),''),'discount_amount',v_discount_amount,'total',v_total);
end;
$function$;

revoke all on function public.create_customer_order(text,text,jsonb,text) from public, anon, authenticated;
revoke all on function public.create_customer_order(text,text,jsonb,text,text) from public, anon;
grant execute on function public.create_customer_order(text,text,jsonb,text,text) to authenticated;

commit;