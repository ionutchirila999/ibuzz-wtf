begin;

alter table public.products
  add column if not exists low_stock_threshold integer not null default 2
  check (low_stock_threshold between 0 and 10000);

create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  reason text not null check (length(trim(reason)) between 3 and 1000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_refunds_order_created_idx
  on public.order_refunds(order_id, created_at desc);
alter table public.order_refunds enable row level security;
drop policy if exists "Admins read order refunds" on public.order_refunds;
create policy "Admins read order refunds" on public.order_refunds
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
revoke all on public.order_refunds from anon, authenticated;
grant select on public.order_refunds to authenticated;

create or replace function public.ibuzz_adjust_inventory(
  p_product_id uuid,
  p_new_stock integer,
  p_reason text,
  p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  current_product public.products%rowtype;
  movement_id uuid;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Admin access required';
  end if;
  if p_new_stock is null or p_new_stock < 0 then raise exception 'Stock cannot be negative'; end if;
  if p_reason not in ('restock','damaged','stocktake','correction') then raise exception 'Invalid stock adjustment reason'; end if;
  select * into current_product from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;

  update public.products set stock = p_new_stock where id = p_product_id;

  select id into movement_id from public.inventory_movements
  where product_id = p_product_id and changed_by = auth.uid() and created_at >= transaction_timestamp()
  order by created_at desc limit 1;
  if movement_id is not null then
    update public.inventory_movements
      set reason = p_reason, note = nullif(trim(coalesce(p_note,'')), '')
      where id = movement_id;
  else
    insert into public.inventory_movements(product_id, quantity_delta, stock_after, reason, note, changed_by)
    values (p_product_id, p_new_stock-current_product.stock, p_new_stock, p_reason, nullif(trim(coalesce(p_note,'')), ''), auth.uid())
    returning id into movement_id;
  end if;

  insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
  values (auth.uid(), 'inventory_adjusted', 'products', p_product_id::text,
    jsonb_build_object('previous_stock', current_product.stock, 'new_stock', p_new_stock, 'reason', p_reason, 'note', nullif(trim(coalesce(p_note,'')),'')));
  return movement_id;
end;
$$;

create or replace function public.record_order_refund(
  p_order_id uuid,
  p_amount numeric,
  p_reason text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  order_row public.orders%rowtype;
  refund_id uuid;
  refunded_total numeric(12,2);
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Admin access required';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be greater than zero'; end if;
  if length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Please provide a refund reason'; end if;
  select * into order_row from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  select coalesce(sum(amount),0) into refunded_total from public.order_refunds where order_id = p_order_id;
  if refunded_total + p_amount > order_row.total then raise exception 'Total refunds cannot exceed the order total'; end if;

  insert into public.order_refunds(order_id, amount, reason, created_by)
  values (p_order_id, p_amount, trim(p_reason), auth.uid())
  returning id into refund_id;

  refunded_total := refunded_total + p_amount;
  if refunded_total >= order_row.total then
    update public.orders set payment_status = 'refunded', updated_at = now() where id = p_order_id;
  end if;

  insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
  values (auth.uid(), 'refund_recorded', 'orders', p_order_id::text,
    jsonb_build_object('refund_id', refund_id, 'amount', p_amount, 'cumulative_refund', refunded_total, 'order_total', order_row.total, 'reason', trim(p_reason)));
  return refund_id;
end;
$$;

revoke all on function public.ibuzz_adjust_inventory(uuid, integer, text, text) from public, anon;
grant execute on function public.ibuzz_adjust_inventory(uuid, integer, text, text) to authenticated;
revoke all on function public.record_order_refund(uuid, numeric, text) from public, anon;
grant execute on function public.record_order_refund(uuid, numeric, text) to authenticated;

commit;