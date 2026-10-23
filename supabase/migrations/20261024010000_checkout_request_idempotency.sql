-- Make order creation safe to retry when the browser loses the RPC response.
-- The idempotency key and order are committed in the same transaction.
begin;

create table if not exists public.checkout_request_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  request_payload jsonb not null check (jsonb_typeof(request_payload) = 'object'),
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, request_key)
);

alter table public.checkout_request_keys enable row level security;
revoke all on public.checkout_request_keys from public, anon, authenticated;
grant all on public.checkout_request_keys to service_role;

create or replace function public.create_customer_order(
  p_buyer_name text,
  p_buyer_contact text,
  p_items jsonb,
  p_shipping_address text,
  p_discount_code text,
  p_request_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
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
  v_payload jsonb;
  v_claimed integer;
  v_existing_payload jsonb;
begin
  if v_user_id is null then raise exception 'Sign in to place an order'; end if;
  if p_request_key is null then raise exception 'Missing checkout request key'; end if;
  if length(trim(coalesce(p_buyer_name, ''))) not between 1 and 100 then raise exception 'Enter your name'; end if;
  if length(trim(coalesce(p_buyer_contact, ''))) not between 1 and 150 then raise exception 'Enter a valid contact'; end if;
  if length(trim(coalesce(p_shipping_address, ''))) not between 10 and 1000 then raise exception 'Enter a complete delivery address'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid order items'; end if;
  if exists (select value->>'id' from jsonb_array_elements(p_items) group by value->>'id' having count(*) > 1) then raise exception 'Duplicate product in order'; end if;

  v_payload := jsonb_build_object(
    'buyer_name', trim(p_buyer_name),
    'buyer_contact', trim(p_buyer_contact),
    'shipping_address', trim(p_shipping_address),
    'items', p_items,
    'discount_code', nullif(upper(trim(coalesce(p_discount_code,''))), '')
  );

  insert into public.checkout_request_keys(user_id, request_key, request_payload)
  values (v_user_id, p_request_key, v_payload)
  on conflict (user_id, request_key) do nothing;
  get diagnostics v_claimed = row_count;

  if v_claimed = 0 then
    select request_payload, order_id
      into v_existing_payload, v_order_id
      from public.checkout_request_keys
      where user_id = v_user_id and request_key = p_request_key
      for update;
    if v_existing_payload is distinct from v_payload then
      raise exception 'Checkout request key was already used with different order details';
    end if;
    if v_order_id is null then
      raise exception 'Checkout request is already being processed; please retry shortly';
    end if;
    select order_number, total into v_order_number, v_total
      from public.orders where id = v_order_id and user_id = v_user_id;
    if not found then raise exception 'Previous checkout order is no longer available'; end if;
    return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total, 'replayed', true);
  end if;

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

  update public.checkout_request_keys set order_id = v_order_id
    where user_id = v_user_id and request_key = p_request_key;
  return jsonb_build_object('id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'discount_code',nullif(upper(trim(coalesce(p_discount_code,''))),''),'discount_amount',v_discount_amount,'total',v_total,'replayed',false);
end;
$function$;

-- Remove API access to the older non-idempotent overload. New clients must send a key.
revoke all on function public.create_customer_order(text, text, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.create_customer_order(text, text, jsonb, text, text, uuid) from public, anon;
grant execute on function public.create_customer_order(text, text, jsonb, text, text, uuid) to authenticated;

commit;
