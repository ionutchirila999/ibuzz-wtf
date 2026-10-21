begin;
create or replace function public.ibuzz_audit_expense_changes()
returns trigger language plpgsql security definer set search_path = public as $expense_audit$
begin
  insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
  values (auth.uid(),
    case when tg_op = 'INSERT' then 'expense_created' when tg_op = 'DELETE' then 'expense_deleted' else 'expense_updated' end,
    'expense_entries', case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    jsonb_build_object(
      'category', case when tg_op = 'DELETE' then old.category else new.category end,
      'amount', case when tg_op = 'DELETE' then old.amount else new.amount end
    ));
  if tg_op = 'DELETE' then return old; else return new; end if;
end $expense_audit$;
insert into public.order_status_history(order_id, status, payment_status, note, created_at)
select o.id, o.status, o.payment_status, 'Order status at dashboard launch', o.created_at
from public.orders o
where not exists (select 1 from public.order_status_history h where h.order_id = o.id);
commit;