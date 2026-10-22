# iBuzz.wtf next-priority roadmap

This roadmap defines the next production-readiness checks. A code change or passing build does not by itself prove production security, payment correctness, Google indexing, or backup recoverability.

## 1. Security and access control — critical

- [ ] Confirm only the designated owner account has the admin role and can access `/ibuzz-dashboard`.
- [ ] Verify Supabase Row Level Security and grants enforce admin-only operations independently of client-side route guards.
- [ ] Verify customers can read and modify only their own orders, profiles, addresses, notifications, wishlists, and support requests.
- [ ] Review all SQL migrations, security-definer functions, function grants, and any duplicate/future-dated migration timestamps.
- [ ] Test account deletion, including authentication identity, profile/address cleanup, and retention of legally or operationally required order/audit records.

## 2. Complete routing and navigation — critical

- [ ] Keep route regression tests for `/shop`, `/checkout`, `/auth`, `/dashboard`, `/ibuzz-dashboard`, and legacy `/account` and `/admin` paths.
- [ ] Test login/logout, password reset, email confirmation, Google OAuth, protected routes, and redirect destinations.
- [ ] Test direct URL entry, browser refresh, back/forward navigation, and mobile navigation.
- [ ] Add integration tests for auth redirects where practical; route matching alone does not execute redirect guards or prove provider configuration works.

## 3. Reliable orders, payments and profit

- [ ] Verify checkout atomically validates stock and price and decrements inventory once.
- [ ] Verify cancellations restore inventory once and duplicate requests cannot double-restore stock.
- [ ] Track refunds with status, amount, timestamp, reference, and an audit trail.
- [ ] Distinguish confirmed receipts/refunds from estimates, pending payments, and manual entries in financial reporting.
- [ ] Make manual payment confirmation explicit and auditable; never trust a browser success redirect as payment evidence.
- [ ] Test failed checkout and concurrent purchases against staging data.

## 4. Mobile shopping experience

- [ ] Test the full customer journey on real Android devices and common mobile browsers.
- [ ] Check product images, image upload/editing, navigation, checkout, support, and LINE contact.
- [ ] Review Thai and Romanian text for wrapping, overflow, labels, and correct language persistence.
- [ ] Test install, launch, offline fallback, and update behavior for the PWA.
- [ ] Confirm production uses the approved logo and transparent assets, not generated replacements or stale cached assets.

## 5. SEO and customer acquisition

- [x] Add a scheduled public check for the homepage, robots file, and sitemap.
- [x] Improve product price/availability and social-sharing metadata; add configurable GA4 events and LINE conversion attribution.
- [ ] Configure `VITE_GA_MEASUREMENT_ID` in the production build environment if GA4 is intended; validate events in DebugView and confirm required consent/privacy handling.
- [ ] Inspect Google Search Console indexing, sitemap processing, canonical selection, and excluded URLs.
- [ ] Test representative product previews and canonical URLs after deployment.
- [ ] Verify the LINE contact link opens the correct account from Android and desktop.

## 6. Backups and operational monitoring

- [x] Add a scheduled GitHub Actions monitor for the public homepage, `robots.txt`, and sitemap.
- [ ] Restore a real production backup to an isolated staging project; record recovery point, duration, and integrity results.
- [ ] Compare local and remote migration history with an authorized Supabase CLI session; review pending SQL before applying it.
- [ ] Verify live RLS policies, grants, critical tables, and checkout/order RPCs against the migrations in Git.
- [ ] Monitor hosting/server and Supabase errors; investigate failed orders, missing orders, stock discrepancies, and refund delays.
- [ ] Reconcile order records, payment evidence, inventory movements, refunds, and audit history after releases.

## Acceptance rules

- Passing GitHub Actions confirms only the checks executed by those workflows.
- Production database access, Google Search Console, GA4, backup restore, and physical Android testing require their respective authorized environments.
- Do not commit credentials, service-role keys, customer data, or backup contents.
- Do not apply pending or future-dated migrations blindly.
