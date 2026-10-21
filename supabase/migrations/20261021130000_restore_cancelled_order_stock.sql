begin;
create or replace function public.ibuzz_restore_stock_on_order_cancel()
returns trigger language plpgsql security definer set search_path = public as $restore_stock$
declare
  item record;
begin
  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and old.status not in ('completed','shipped','ready_for_pickup') then
    for item in
      select product_id, quantity
      from public.order_items
      where order_id = new.id and product_id is not null
      order by product_id
    loop
      update public.products
      set stock = stock + item.quantity,
          status = case when status = 'sold' then 'available' else status end,
          updated_at = now()
      where id = item.product_id;
    end loop;
  end if;
  return new;
end $restore_stock$;
drop trigger if exists ibuzz_restore_cancelled_stock on public.orders;
create trigger ibuzz_restore_cancelled_stock after update of status on public.orders
for each row execute function public.ibuzz_restore_stock_on_order_cancel();
commit;