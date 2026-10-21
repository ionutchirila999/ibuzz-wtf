import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = (name: string) =>
  readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8").toLowerCase();

describe("database security regression guards", () => {
  it("requires an authenticated user and validates stock in the authoritative checkout RPC", () => {
    const sql = migration("20261021100000_dashboard_operations.sql");
    const start = sql.indexOf("create or replace function public.create_customer_order");
    const end = sql.indexOf("$function$;", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("security definer");
    expect(rpc).toContain("set search_path = public");
    expect(rpc).toContain("auth.uid()");
    expect(rpc).toContain("if v_user_id is null");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("v_product.price * v_qty");
    expect(rpc).toContain("stock >= v_qty");
    expect(rpc).toContain("having count(*) > 1");
  });

  it("restricts support tickets to their owner or an admin and blocks ownership reassignment", () => {
    const schema = migration("20261021100000_dashboard_operations.sql");
    const ownership = migration("20261021160000_harden_support_ticket_ownership.sql");

    expect(schema).toContain("alter table public.support_tickets enable row level security");
    expect(ownership).toContain("user_id = auth.uid()");
    expect(ownership).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(ownership).toContain("and (");
    expect(ownership).toContain("o.user_id = auth.uid()");
    expect(ownership).toContain("new.user_id is distinct from old.user_id");
    expect(ownership).toContain("new.order_id is distinct from old.order_id");
    expect(ownership).toContain("using (public.has_role(auth.uid(), 'admin'::public.app_role))");
  });

  it("keeps trigger-only RPCs private and limits checkout RPC execution to authenticated users", () => {
    const grants = migration("20261021170000_review_privileged_function_permissions.sql");

    expect(grants).toContain("revoke all on function public.create_customer_order(text, text, jsonb) from public, anon");
    expect(grants).toContain("grant execute on function public.create_customer_order(text, text, jsonb) to authenticated");
    expect(grants).toContain("revoke all on function public.ibuzz_restore_stock_on_order_cancel() from public, anon, authenticated");
    expect(grants).toContain("revoke all on function public.ibuzz_prevent_support_ticket_reassignment() from public, anon, authenticated");
    expect(grants).toContain("revoke execute on functions from public, anon, authenticated");
  });

  it("prevents API roles from using TRUNCATE to bypass row-level security", () => {
    const sql = migration("20261021150000_restrict_truncate_privileges.sql");

    expect(sql).toContain("revoke truncate on all tables in schema public from public, anon, authenticated");
    expect(sql).toContain("revoke truncate on tables from public, anon, authenticated");
  });
});
