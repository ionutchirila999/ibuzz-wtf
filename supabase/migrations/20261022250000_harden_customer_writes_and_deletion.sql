-- Tighten customer-write boundaries and make the documented account-deletion
-- anonymization flow compatible with retained order history.
begin;

-- Account deletion anonymizes old orders before deleting auth.users. Allow the
-- anonymized order to remain for accounting instead of failing on NOT NULL.
alter table public.orders alter column user_id drop not null;

-- Customers may only create open order-support requests; they cannot submit a
-- pre-resolved/rejected request by bypassing the UI and calling PostgREST.
drop policy if exists "Customers create support requests for their own orders" on public.order_support_requests;
create policy "Customers create support requests for their own orders"
  on public.order_support_requests for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'open'
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- The only customer-editable notification field is read_at. Table-wide UPDATE
-- would otherwise allow edits to event metadata and associated IDs.
revoke update on public.customer_notifications from authenticated;
grant update (read_at) on public.customer_notifications to authenticated;

commit;
