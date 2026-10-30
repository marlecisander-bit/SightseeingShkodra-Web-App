# Shared van products and seat reservation — 30 October 2026

Feature release on `feature/shared-van-products-20261030`, based on production/main `4f8637cb07c05f47386b39be7f3811a6be3d6356`. The owner subsequently explicitly authorized publishing the shared product development, including its required migration. Existing publication receipts are preserved separately. No bookings, emails, GPS, delivery settings or independent map changes were made.

## Behavior and ownership

A purchased product can reference one inventory-owning van product. One schedule materializes the same dated departure IDs for both offers. Products retain their own names, standard passenger prices and purchased identity. The existing allocator, checkout, meeting-point confirmation, customer management, QR, events, notifications and payment handling remain authoritative.

- Selected departure: default 120 minutes, with half-open time windows so a seat is released at the end of its reserved period.
- Whole operating day: local service-date midnight to the next local midnight. This covers every applicable slot, including slots added later; it correctly follows 23/25-hour Tirane daylight-saving days.
- Adults and children occupy seats; infants do not. Existing cutoff and ten-minute checkout-hold rules remain.
- Reservation snapshots are immutable outside the existing atomic customer modification routine. A modified booking retains its original policy/duration. Pending holds also retain their original policy when later confirmed.
- Capacity is checked at peak concurrency in intersecting physical slots, rather than summing non-overlapping morning and afternoon bookings. Overlapping offers and departures share occupancy. Existing explicit departure capacity stays authoritative.
- A whole-day offer requires one consistent assigned van for the service date. Vehicle swaps that would invalidate whole-day reservations fail closed. Linked offers cannot create a second schedule; link chains and cross-tenant links are rejected.

Calendar & Pricing owns inventory links, reservation policy/duration and passenger prices. Products & suppliers owns product identity/publication. Website → Product booking cards owns uploaded photo, alternative text, introduction, display order and homepage visibility, with draft/publish permissions and stale-edit checks. One offer appears once in the additional-card section; the primary configured product retains the existing hero card. Disabled, unpublished and archived offers cannot produce additional public cards. All cards reuse the existing booking controls and checkout; separate product UI state/storage prevents cross-product selection contamination. Legacy primary-product checkout storage remains compatible.

## Owner workflow after a separately approved release

1. Products & suppliers → Add product. Enter “Sightseeing Loop Tour”, choose **Van tour**, and keep it Draft while configuring.
2. Tours → Calendar / Calendar & Pricing → Product seat reservations. Select **Share [existing Hop On Hop Off product]**, **Selected departure**, **120 minutes**, then save. No new van or schedule is needed.
3. Tours → Prices. Configure adult, child and infant prices for the new product. Explicit zero is supported; existing passenger age/category rules apply.
4. Publish the product in Products & suppliers.
5. Website → Product booking cards. Upload a photo, enter alternative text/introduction/order, enable the homepage card, save draft or Publish card. Draft saves do not change the public card.
6. Later, switch the Hop On Hop Off product to **Whole operating day** in Product seat reservations when that policy is wanted. Existing bookings keep their confirmed period.

No Loop Tour product or commercial prices were invented or inserted into a hosted database. All test products are disposable synthetic fixtures.

## Implementation and release boundaries

Migration `20261030000100_shared_van_products.sql` adds product inventory/policy/editorial fields and immutable hold/item reservation snapshots. The purchased-product FK remains tenant-scoped; the former product-equals-inventory FK becomes an explicit tenant-scoped inventory-owner/departure FK. Existing rows are backfilled to the approved 120-minute policy without changing prices, IDs, references, QR/management tokens or domain events. Public RPC grants remain service-only; no client receives service credentials or inventory-resource identifiers.

Allocation and operational mutation RPCs acquire an operator advisory lock before existing departure/hold/order locks. This intentionally serializes the small van workload, preserving a simple ordering across multi-slot reservations. Status/expiry still determines which allocations count. Shared occupancy also feeds legacy availability, passenger availability, customer self-service and admin calendar projections. Capacity edits and closures see allocations anchored to other departures.

Public API product selection is bounded and validated, with the operator still fixed by server configuration. Explicit product IDs must resolve to published offers under that operator. Checkout validates departure membership through the same quote/allocator. Staff creation can select either offer over the same departure.

Publication must be **migration first, application second**, with a read-only occupancy preflight and existing booking/hold review before applying the new two-hour overlap semantics. Do not blindly drop/reverse this migration after new shared-product bookings exist. Prefer an application rollback retaining the forward-compatible schema, with new-offer sales paused through authorized owner actions if required. No dependency or environment variable is added. The primary-product environment binding remains the compatibility/default selection, not a per-product setup requirement.

## Limits

This scope supports van offers using the existing seat/departure model, one product per checkout. Boat/admission inventory, reseller stock, multi-product carts and repeated-boarding entitlement/QR policy are separate work. Linked offers have independent standard passenger prices; dated schedule price overrides/promotions remain owned by the inventory product and are not silently copied to different offers. Shared operating dates/times, closures and capacity continue to come from the source schedule.

Chrome inventory again reports “The browser access host is unavailable”. No responsive screenshot, physical touch or authenticated hosted-admin acceptance is claimed. Existing jsdom/SSR tests establish DOM behavior, not visual geometry. Local/public functional acceptance against isolated configured services and hosted migration preflight remain release gates.

## Verification

621 unique tests pass across the current suites: 148 component, 23 identity, 219 integration, 197 disposable SQL, 27 real PostgreSQL, and 7 CMS verification. Lint, Next type generation/TypeScript and optimized production build pass. Production dependency audit reports zero vulnerabilities; whitespace checks pass. Generated Next type-import paths were restored to the original baseline after the build.

Focused coverage includes published/unpublished and cross-tenant product resolution; malformed selectors; independent product UI selection/storage and inherited meeting-point settings; unique accessible dialog title IDs; shared departure IDs and purchased-product identity; independent prices; overlapping and non-overlapping trips; all-day cancellation/expiry; immutable existing/pending reservation policies; staff creation; snapshot-based customer modification even after future policy changes; calendar projection/closure/capacity checks; newly added slots; vehicle reassignment; DST; role enforcement and card draft/publication. Real PostgreSQL verifies competing products and departure times cannot both take the last seats, including commit and rollback cases. An upgrade test applies the migration over an existing confirmed booking and verifies retained reference, QR, management token, total, passenger snapshot and event count. The read-only preflight SQL is exercised before that upgrade.

One default-parallel local PGlite worker exited without test diagnostics. Its eight tests passed independently; the full 197-test SQL suite passed with file concurrency limited to two. `test:db` now explicitly uses that limit for predictable resource use. This does not reduce the actual multi-connection race scenarios in the separate PostgreSQL suite. The complete standard `npm test` also passed all 621 tests with this setting.

Logs: `/tmp/shared-products-final-{components,identity,integrations,database,postgres,cms,check,audit}.log`, `/tmp/shared-products-standard-tests.log`, `/tmp/shared-products-worker-recheck.log` and focused `/tmp/shared-products-{scenarios,upgrade,cards}.log`. No test uses production data or sends customer communications.

Release authorization received. Production migration applied before application publication; CI and hosted acceptance are recorded below. No isolated hosted Preview was available; disposable SQL/integration/concurrency tests provide behavioral coverage, with production checks limited to read-only browsing and schema verification.


## Changed files

- `docs/CMS-RECONCILIATION.md`
- `docs/DECISIONS.md`
- `docs/PHASE_STATUS.md`
- `docs/SHARED-VAN-PRODUCTS-2026-10-30.md`
- `docs/SHARED-VAN-PRODUCTS-PREFLIGHT.sql`
- `package.json`
- `scripts/cms-verification/client.mjs`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/product-cards/page.tsx`
- `src/app/admin/admin-shell.tsx`
- `src/app/admin/booking-actions.ts`
- `src/app/admin/bookings-panel.tsx`
- `src/app/admin/calendar-panel.tsx`
- `src/app/admin/catalog-panel.tsx`
- `src/app/admin/product-booking-actions.ts`
- `src/app/admin/product-booking-settings.tsx`
- `src/app/admin/product-card-actions.ts`
- `src/app/admin/product-card-editor.tsx`
- `src/app/admin/staff-passengers.tsx`
- `src/app/admin/website-home.tsx`
- `src/app/api/public/availability/route.ts`
- `src/app/api/public/checkout/route.ts`
- `src/components/public/booking-controls.tsx`
- `src/components/public/booking-pass.tsx`
- `src/components/public/booking.tsx`
- `src/components/public/checkout-flow.tsx`
- `src/components/public/customer-booking.tsx`
- `src/components/public/hero-booking-widget.tsx`
- `src/components/public/homepage-hero.module.css`
- `src/components/public/homepage-view.tsx`
- `src/components/public/product-booking-cards.module.css`
- `src/components/public/product-booking-cards.tsx`
- `src/components/public/use-availability.ts`
- `src/modules/booking/checkout-browser-state.ts`
- `src/modules/booking/contracts.ts`
- `src/modules/booking/holds-server.ts`
- `src/modules/booking/orders-server.ts`
- `src/modules/booking/products-server.ts`
- `src/modules/booking/products.ts`
- `src/modules/booking/public-availability.ts`
- `src/modules/booking/staff-booking-server.ts`
- `src/modules/public-preview/contracts.ts`
- `supabase/migrations/20261030000100_shared_van_products.sql`
- `tests/components/product-booking-cards.test.mjs`
- `tests/database/availability.test.mjs`
- `tests/database/core-schema.test.mjs`
- `tests/database/shared-products-upgrade.test.mjs`
- `tests/database/shared-products.test.mjs`
- `tests/integrations/bookings-v2.test.mjs`
- `tests/integrations/product-selection.test.mjs`
- `tests/postgres/concurrency.test.mjs`


## Retirement release synchronization

The owner separately requested removal/publication of Local notebook and Final booking invitation. Scoped PR #39 published only that retirement as main `4f8637cb07c05f47386b39be7f3811a6be3d6356`; no shared-product application code or migration was published. This feature branch was advanced to that main and the preserved development restored, resolving only documentation overlaps. All 148 combined component tests, 7 CMS verification tests and typecheck passed. Booking-domain/API files and all untracked feature files were verified against a local safety checkpoint. The retired sections remain absent in this local candidate. Existing safety stash and private temporary copies remain available.

## Authorized publication — 30 October 2026

Production project `ybngoppqqiohcduojfyg` (sightseeing-shkodra-webapp), operator `9185510e-0e82-4027-ab1c-8604dad5c92e`, was verified in the existing authenticated Supabase dashboard. Read-only preflight found zero current allocations, zero overlap conflicts and zero unassigned reserved slots; all 24 affected existing booking function fingerprints matched the tested baseline.

Migration `20261030000100_shared_van_products` committed through a locally exercised transactional wrapper with lock/statement timeouts, fresh allocation/function guards and before/after integrity fingerprints. The transaction retained product identities/pricing, existing order totals/status, booking references/QR/management tokens, passenger snapshots, hold details and domain-event count. Stored migration source MD5 `754641645ebe70770e8366d559550dc1` matches the exact source; SHA-256 `9b78ea1340137108646a5802e1125ca3971f0acaec4e6d7ea94d9db6ffcc1253`. Dashboard last backup was observed as 15 hours old; a restore was not exercised.

The owner's existing published `Sightseeing Tour Loop` and `Hop On Hop Off - Daily Ticket` remain unchanged in identity and price. Both default to selected departure/120 minutes; no inventory link, card content or pricing was invented. The owner can configure the Loop's shared inventory source in Calendar & Pricing and publish its card under Website → Product booking cards. Anonymous callers cannot execute the card-write or server-only product-read functions. No actual bookings or communications were created during acceptance.

All 621 tests, lint/typecheck/production build and zero-vulnerability production dependency audit passed again for this candidate. Application release follows through a reviewed PR, CI and Vercel main integration. Rollback application baseline is `4f8637cb07c05f47386b39be7f3811a6be3d6356`; retain the forward-compatible schema on rollback.
