-- TRUNCATE bypasses row-level security, so API roles must not receive it.
-- Apply to all existing public-schema tables, including tables added since
-- the targeted hardening migration. Keep service_role/owner privileges intact.
begin;

revoke truncate on all tables in schema public from public, anon, authenticated;

-- Keep the restriction in place for future tables created by this migration role.
alter default privileges in schema public
  revoke truncate on tables from public, anon, authenticated;

commit;
