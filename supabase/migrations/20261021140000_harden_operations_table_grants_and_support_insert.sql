-- Restrict non-admin SQL roles to the operations supported by RLS policies.
-- TRUNCATE is not governed by row-level security, so remove it explicitly.
-- Keep the existing SELECT/INSERT/UPDATE/DELETE grants where RLS policies are the authorization boundary.

begin;

revoke truncate on table
  public.order_status_history,
  public.inventory_movements,
  public.repair_jobs,
  public.support_tickets,
  public.admin_audit_log,
  public.expense_entries,
  public.orders,
  public.products,
  public.order_items
from anon, authenticated;

-- A customer may create a ticket only for their own account/order and may not
-- pre-populate administrative response fields or set an elevated workflow state.
drop policy if exists "Customers create own support tickets" on public.support_tickets;
create policy "Customers create own support tickets" on public.support_tickets
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'open'
    and priority = 'normal'
    and admin_reply is null
    and replied_at is null
    and (
      order_id is null
      or exists (
        select 1
        from public.orders o
        where o.id = support_tickets.order_id
          and o.user_id = auth.uid()
      )
    )
  );

commit;
