-- Review and restrict the callable surface of privileged PostgreSQL functions.
-- Trigger functions are invoked by their triggers; they are not public RPC endpoints.
begin;

-- Role checks must remain callable by signed-in users because RLS policies use them.
-- Callers cannot probe arbitrary role records as anon/public.
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Bootstrap and trigger-only functions must not be directly callable through the API.
revoke all on function public.handle_new_user_role() from public, anon, authenticated;
revoke all on function public.ibuzz_record_order_status() from public, anon, authenticated;
revoke all on function public.ibuzz_record_inventory_movement() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_order_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_repair_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_support_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_expense_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_touch_updated_at() from public, anon, authenticated;
revoke all on function public.ibuzz_restore_stock_on_order_cancel() from public, anon, authenticated;
revoke all on function public.ibuzz_set_support_customer_email() from public, anon, authenticated;
revoke all on function public.ibuzz_prevent_support_ticket_reassignment() from public, anon, authenticated;

-- Checkout is the only customer-facing privileged write RPC; it requires a session.
revoke all on function public.create_customer_order(text, text, jsonb) from public, anon;
grant execute on function public.create_customer_order(text, text, jsonb) to authenticated;

-- The onboarding UI needs this read-only boolean to decide whether to show sign-up.
-- It intentionally remains callable by anon and authenticated.
revoke all on function public.owner_exists() from public;
grant execute on function public.owner_exists() to anon, authenticated;

-- For functions created by the migration role in this schema, stop granting API
-- execution by default. Future RPCs must receive explicit grants in their migration.
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

commit;
