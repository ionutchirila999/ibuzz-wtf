# iBuzz.wtf operations runbook

This repository can verify the deployed public site, but it cannot prove that a database backup is restorable or that production migrations match the database. Those checks require the production Supabase project and an isolated restore target.

## Search visibility and conversion measurement

- Public site: https://ibuzz.wtf
- Sitemap: https://ibuzz.wtf/sitemap.xml
- Crawler rules: https://ibuzz.wtf/robots.txt
- Google Search Console: inspect indexing reports, sitemap processing, canonical selection, and product URL exclusions after each release.
- Product pages provide product-specific title/description, canonical URL, Open Graph and Twitter preview metadata. Check representative URLs with Google's Rich Results Test and the Facebook Sharing Debugger after deployment.
- Optional GA4 measurement is configured with the build-time `VITE_GA_MEASUREMENT_ID` environment variable. Without it, analytics does not load. Events include page_view, view_item, search, add_to_cart, remove_from_cart, begin_checkout, order_request_created, and contact_line. Search tracking records query length rather than raw search text to reduce the risk of collecting personal information. Checkout/order-request events include aggregate item counts and value only; they do not include customer names, contact details, addresses, or order numbers. `order_request_created` means the order request was saved before the customer continues to LINE; it is not proof of payment and must not be reported as a completed purchase. Validate events in GA4 DebugView before using them for business decisions.
- Confirm GA4 consent/privacy configuration and the site's privacy notice before enabling analytics for visitors in any jurisdiction where consent is required.
- LINE contact link is maintained in `src/lib/shop.ts`; verify it opens the correct business account on Android and desktop.

## Production health and failed orders

- GitHub Actions runs the public-site monitor every six hours and can be run manually. A failure means the homepage, robots file, or sitemap failed the public checks; inspect the workflow log and hosting logs.
- Review hosting/server error logs and Supabase logs after deployments and whenever a customer reports a failed checkout, missing order, or support issue.
- Reconcile new orders against payment evidence and stock movements. Never mark an order paid solely because a browser returned to a success page.
- Check that cancelled orders restore stock once, refunds have an auditable status/reference, and failed checkout attempts do not leave partial orders or reserve stock indefinitely.

## Supabase migration consistency

Run the checks using an authorized Supabase CLI session and the correct production project reference. Never paste service-role keys into source code or GitHub logs.

1. Inspect migration files and timestamps in `supabase/migrations/`; resolve duplicate timestamps and review future-dated migrations before applying them.
2. Compare local and remote migration history with `supabase migration list --linked` (or the equivalent command for the installed CLI version).
3. Review every pending migration SQL and backup/restore implications before applying it. Do not blindly apply migrations simply because they exist in Git.
4. After applying a migration, re-run migration history checks and the application's database security regression tests.
5. Verify critical tables, RLS policies, function grants, and checkout/order RPCs in the live project. A successful build does not verify live database policy state.

## Backup restore drill

Schedule this at least quarterly and before high-risk schema changes.

1. Confirm the production project's configured backup/PITR retention and record the latest available recovery point.
2. Restore a backup to a separate staging project or isolated database, never over production.
3. Confirm expected tables and recent orders, order items, inventory movements, refunds, support tickets, and audit records are present.
4. Run read-only integrity checks and a staging checkout/cancellation/refund test using test data only.
5. Record the backup timestamp, restore duration, missing data (if any), test results, and operator. A backup is not verified until an actual restore succeeds.
6. Keep secrets and customer data out of the repository and workflow artifacts.

## Release checklist

- [ ] GitHub Actions build and tests pass.
- [ ] Public-site monitor passes after deployment.
- [ ] Search Console sitemap/indexing checked for significant SEO changes.
- [ ] Test product title, price, image, canonical and social preview.
- [ ] Verify GA4 events in DebugView if measurement is enabled.
- [ ] Verify LINE contact from a real mobile device.
- [ ] Confirm migration history and RLS changes against production.
- [ ] Confirm latest backup status; perform restore drill on schedule.
