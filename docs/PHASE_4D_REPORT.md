# Phase 4D - Expiring holds and pending checkout

Date: 2026-09-22. Scope: local/development booking flow. Result: implemented and verified. No payment processing, booking confirmation, production deployment or later phase work.

## Implementation

The selection button acquires a real transactional hold before displaying customer fields. A signed, server-issued, 24-hour HTTP-only SameSite=Strict cookie supplies the private session key; browser bodies cannot select an operator, product or session key. Cookie transport is Secure outside development or over HTTPS. The public POST endpoint checks Origin against Host, rejects cross-site requests, requires JSON and bounds the request body to 4KB. Next normalizes its listening URL, so the check deliberately uses the actual Host header rather than its internal request URL hostname.

`/api/public/checkout` supports session bootstrap, hold creation, hold read/release and validated pending-order creation. The fixed public-site binding selects a published product; the existing availability domain verifies departure membership. Allocation itself uses the existing transactional RPC rather than a frontend capacity decision. A request UUID and immutable terms survive uncertain responses and page reloads in sessionStorage; the signed capability and customer details are never stored there. Hold/order retries reuse existing domain idempotency. Customer validation and final price snapshot remain in the shared domain. Holds/orders have bounded upstream timeouts and safe error responses.

The customer page shows server-derived expiry using a monotonic local countdown. It does not mistake the customer's own hold for sold-out inventory. Releasing seats returns to selection; abandonment relies on the domain's expiry exclusion/reclamation. A pending order is explicitly not a ticket and has no payment action. The safe order recovery projection checks operator, hold and session before reading order/item summaries; it returns no customer contact details. Reload restores the hold/order without resubmitting personal information. In-flight double submission is guarded, and uncertain order retries keep the original customer values. Definitive validation errors allow correction.

## Configuration and files

`CHECKOUT_SESSION_SECRET` was generated privately in ignored `.env.local`; `.env.example` documents the new server-only setting. No migration or permission changes. New files are the checkout route, signing module, checkout UI, session tests and hosted verification script. Existing booking component delegates to the new flow; hold/order server modules gain request timeouts and order recovery. ESLint now excludes ignored `private/` scratch/build output, which previously caused generated code to be linted. Existing user edits remain separate.

## Verification evidence

- Lint and TypeScript passed. Complete final production build passed using temporary output `private/build-phase-4d-verified`; next config/tsconfig were restored afterward. The previously documented default `.next` Windows/OneDrive cleanup issue remains outside this change.
- All 17 integration tests passed, including signing uniqueness, tamper rejection, expiry and wrong-secret rejection. All 14 native PostgreSQL tests passed, covering expired/released checkout rejection, transactional checkout, last-seat contention, hold expiry/reclamation and replay.
- `scripts/verify-public-checkout.mjs` passed against the development Supabase project and a separate loopback build server: missing/foreign Origin rejection, cookie/session requirements, hold replay/conflict, cross-session read/release/order denial, invalid customer rejection, domain-priced pending order, exact order replay, conflicting retry, private recovery and restored capacity after release.
- Chrome acquired two test seats, displayed a countdown, saved a EUR25 pending order with fictional customer details, recovered the same order after reload, and released seats. Mobile 390px rendering had no horizontal overflow. The departure subsequently showed two available seats.
- Synthetic audit operator `58cf664d-ca1d-4387-89a8-9758c17cc918` retains immutable test orders/events and fictional customers. Its active holds were released, departure closed and product archived. An earlier failed Origin-check fixture was also retired by the script before any checkout. Owner data was not changed. No audit triggers were disabled and no financial history deleted.

## Limits and next step

The real catalog remains unpublished for manual entry. Use test details on localhost. No hold-expiry worker is scheduled yet: expired holds already cease consuming capacity through existing domain reads/allocation, while pending-order lifecycle cleanup remains a future operational concern. No automatic browser-unload mutation is used; holds expire without needing the browser to remain open. Multiple tabs can create distinct valid holds; production abuse controls/load testing remain required before launch. Session expiry or disabled browser storage can limit recovery, without granting access to another customer's reservation. The initial displayed quote may differ from the server's final saved order total; no payment occurs in this phase.

No roadmap deviation. Next: Phase 4E Explore/SEO; payments remain Phase 5. The local page is http://127.0.0.1:3000/book.
