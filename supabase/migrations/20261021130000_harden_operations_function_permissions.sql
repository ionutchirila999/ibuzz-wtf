-- Tighten callable surface for the iBuzz operations schema.
-- Trigger functions are invoked by their triggers; they do not need direct API execution grants.
begin;

revoke all on function public.create_customer_order(text, text, jsonb) from public;
revoke all on function public.create_customer_order(text, text, jsonb) from anon;
grant execute on function public.create_customer_order(text, text, jsonb) to authenticated;

revoke all on function public.ibuzz_record_order_status() from public, anon, authenticated;
revoke all on function public.ibuzz_record_inventory_movement() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_order_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_repair_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_support_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_audit_expense_changes() from public, anon, authenticated;
revoke all on function public.ibuzz_touch_updated_at() from public, anon, authenticated;

commit;
