-- Snapshot the customer's delivery address on each order.
begin;

alter table public.orders
  add column if not exists shipping_address text;

alter table public.orders
  drop constraint if exists orders_shipping_address_length;
alter table public.orders
  add constraint orders_shipping_address_length
  check (shipping_address is null or char_length(trim(shipping_address)) between 10 and 1000);

create or replace function public.create_customer_order(
  p_buyer_name text,
  p_buyer_contact text,
  p_items jsonb,
  p_shipping_address text
)
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
  if length(trim(coalesce(p_shipping_address, ''))) not between 10 and 1000 then raise exception 'Enter a complete delivery address'; end if;
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
  insert into public.orders(user_id, buyer_name, buyer_contact, shipping_address, total)
  values (v_user_id, trim(p_buyer_name), trim(p_buyer_contact), trim(p_shipping_address), v_total)
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

revoke all on function public.create_customer_order(text, text, jsonb, text) from public, anon;
grant execute on function public.create_customer_order(text, text, jsonb, text) to authenticated;

commit;
