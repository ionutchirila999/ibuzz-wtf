# iBuzz.wtf production-readiness roadmap

This roadmap tracks the requested work in priority order. Checklist items are not complete until implemented and verified. A code change or passing build alone does not prove production security, payment correctness, indexing, or backup recoverability.

## 1. Security and regression testing — highest priority

- [ ] Verify admin permissions and customer data isolation.
- [ ] Test sign-in, Google OAuth, redirects, and password recovery.
- [ ] Ensure customers cannot view or change another customer's orders.
- [ ] Test account deletion and database access rules.
- [ ] Review Supabase RLS policies, grants, migrations, security-definer functions, and function permissions.
- [ ] Run regression tests to ensure existing features have not broken.

**Goal:** Fix vulnerabilities and broken existing functionality before adding new features.

## 2. Orders, payments, and refunds

- [ ] Verify checkout totals, payment confirmation, and order creation.
- [ ] Prevent duplicate orders and duplicate payment processing.
- [ ] Test stock reduction, cancellations, and refund status updates.
- [ ] Ensure receipts match the actual order and payment.
- [ ] Test failed, pending, and successful payments.
- [ ] Verify stock and cancellation operations are atomic and idempotent.
- [ ] Keep refund amount, status, timestamp, reference, and audit history traceable.

**Goal:** Every transaction must be traceable and financially accurate.

## 3. Complete the customer experience

- [ ] Finish address collection wherever delivery requires it.
- [ ] Verify customer details appear correctly in orders and receipts.
- [ ] Test order history, tracking, account settings, and email changes.
- [ ] Verify Google login on the published site.
- [ ] Make empty states, errors, and confirmation messages clear.
- [ ] Test direct URL entry, refresh, back/forward navigation, and legacy redirects.

**Goal:** Customers can manage their entire purchase without needing manual assistance.

## 4. Business automation

- [ ] Automate order confirmation and payment notifications.
- [ ] Notify customers when orders are shipped, delivered, or refunded.
- [ ] Alert the administrator to failed payments and problematic orders.
- [ ] Reduce manual stock updates and repetitive order processing.
- [ ] Ensure notifications and automated actions are not duplicated.
- [ ] Test retries and failures without creating duplicate orders, stock movements, or messages.

**Goal:** Save time while keeping customers informed.

## 5. Trust, policies, and customer support

- [ ] Review shipping, returns, cancellations, and refund policies.
- [ ] Publish clear privacy and terms pages.
- [ ] Make contact and support information easy to find.
- [ ] Add an order-related support process so customers can report problems.
- [ ] Verify all policy links and support forms work.
- [ ] Confirm customer support records are protected by ownership rules and admin permissions.

**Goal:** Make customers comfortable buying from iBuzz.wtf.

## 6. Mobile and visual quality

- [ ] Test the complete shopping journey on Android.
- [ ] Check every page, menu, form, button, and checkout step.
- [ ] Verify the approved official logo remains correct after publishing.
- [ ] Check product images, cropping, loading, and broken image links.
- [ ] Test different screen sizes and slow connections.
- [ ] Review Thai and Romanian text for wrapping, overflow, and correct language persistence.
- [ ] Test PWA install, launch, offline fallback, and update behavior where applicable.

**Goal:** The published site looks professional and works consistently across devices.

## 7. SEO, accessibility, and performance

- [ ] Give every important page a proper title and meta description.
- [ ] Verify sitemap, robots.txt, canonical URLs, and indexing.
- [ ] Add appropriate product structured data.
- [ ] Improve image optimization, page speed, and Core Web Vitals.
- [ ] Check keyboard navigation, form labels, contrast, and accessibility.
- [ ] Verify social-sharing previews and published branding.
- [ ] Inspect Search Console indexing and validate representative product URLs after deployment.

**Goal:** Make the store discoverable, fast, and accessible.

## 8. Analytics and growth

- [ ] Verify the existing funnel and privacy analytics work correctly.
- [ ] Track product views, add-to-cart events, checkout completion, and purchases.
- [ ] Measure actual profit rather than estimated profit alone.
- [ ] Track abandoned checkouts and repeat purchases.
- [ ] Use consent and privacy controls appropriate to the analytics setup.
- [ ] Validate event accuracy and avoid counting duplicate purchases.
- [ ] Configure and verify production analytics settings when analytics are enabled.

**Goal:** Understand where sales are lost and which improvements increase revenue.

## Verification and release rules

- Passing automated checks confirms only the checks that actually ran.
- Production database policies, payment provider behavior, Google OAuth configuration, Search Console, analytics dashboards, backup restore, and physical Android testing require their authorized environments.
- Test with staging/test data wherever possible; do not create real charges or modify customer records during tests.
- Do not commit credentials, service-role keys, customer data, or backup contents.
- Review migrations and their ordering before applying them; never apply pending or future-dated migrations blindly.
- Keep changes isolated, verify each change, and do not deploy or publish without explicit permission.
