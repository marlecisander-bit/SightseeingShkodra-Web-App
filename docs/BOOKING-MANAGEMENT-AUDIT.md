# Booking management audit (before implementation)

Authoritative paths: ensure_schedule_date_v1 / effective_schedule_times_v1 materialize Calendar & Pricing service dates. read_availability_v1 delegates read_dated_availability_v1; read_passenger_availability_v1 attaches passenger_quote_v1 snapshots. create_passenger_hold_v1 serializes request IDs and locks dated departures. create_pending_order_v1 and create_meeting_point_booking_v1 confirm under the same departure lock. cancel_order_v1 currently requires staff and releases allocations transactionally. Booking events are written in the same transaction, consumed by existing Resend worker.

Before this amendment quantity means total passengers everywhere, so infants consume inventory. Active unexpired holds plus confirmed items consume seats, pending items do not duplicate holds; cancelled/expired allocations do not. Departure eligibility uses operator timezone and departure time, without a 15-minute cutoff. Configured dated capacity is authoritative (admin supports explicit overrides). Pricing is SQL passenger_quote_v1 with immutable snapshots. Payments are due at the meeting point; paid adjustments/refunds are not automated. Staff cancellation requests refund review where necessary.

No customer management endpoint exists. Existing QR credential is a boarding credential, not management authorization. New management access must use a distinct random bearer credential. Modification must retain booking reference/QR identity, atomically replace allocations, and reject paid/checked-in/unsupported multi-item bookings. Existing cancellation must be extended rather than duplicated. Security and locking must be revalidated after lock waits. No hosted data/configuration changes or deployment authorized in this task.

## Implementation result

- Existing admin-configured departure capacity remains authoritative under the brief's explicit exception; standard van schedules use eight. No silent rewrite of existing capacity overrides.
- Generated occupied_seats columns on inventory_holds and booking_items equal total quantity minus infant count. Historical rows without category snapshots remain adults. Existing availability, hold, confirmation, capacity-edit and operations-calendar routines now aggregate occupied seats.
- booking_cutoff_v1 is departure in Europe/Tirane minus 15 minutes. At equality eligibility closes. Holds expire no later than the cutoff. Pending checkout and confirmation also recheck eligibility. Existing idempotent confirmation retries return their already-committed result.
- Availability hides cutoff-closed departures, shows seat availability/sold-out independently, and provides the next operational calendar date when empty. Schedule search is bounded to 366 days; manually dated future inventory is also considered. No fabricated tomorrow.
- Distinct random management_token on bookings (two UUIDv4 values, 244 random bits), separate from QR boarding token. No predictable ID authorization. Customer URL is /booking/manage#token=...; fragments keep credentials out of HTTP request URLs/referrers. Requests POST the credential over the existing site, with origin checks, bounded body, no-store responses and server-only Supabase credentials.
- Service-only read/quote/modify/cancel ports reuse existing SQL availability/pricing and cancel_order_v1. Confirmed single-item unpaid meeting-point bookings can change. Paid/payment-in-progress, checked-in and unsupported bookings require staff. No additional collection/refund engine.
- Atomic modification locks old/target departures in UUID order, then order/booking/item; revalidates version, deadlines, target capacity excluding own allocation and expected price. Audit preserves old/new snapshots. Hold history stays immutable; only the service mutation may update the booking snapshot. Failure rolls back the original allocation and price. Request IDs reuse the existing event ledger for safe retries and conflict detection.
- Cancellation is a two-step UI confirmation and delegates the existing cancellation routine, extended with verified customer access/cutoff checks. Staff cancellation/refund review remains intact. Cancelled allocations stop consuming seats; cutoff filtering still applies after release.
- booking.confirmed, booking.modified and order.cancelled remain the email events. Existing customer creation/modification templates receive the private management link; cancellation omits it. No real email sent, provider enabled or parallel notification system created.

## Verification

Full suite passed: 15 identity + 84 integration + 125 database + 22 real embedded PostgreSQL concurrency = 246 tests. Five subsequently added focused cases also passed (251 unique tests across those runs). The focused management/API/template suite passes 12/12. Lint, TypeScript and production build passed.

Coverage: 8 adults + 2 infants; infant-only edits; own 3 + other 4 can grow to 4; own 3 + other 5 cannot; failed target move preserves original; simultaneous last one/two seats have one winner; move-vs-new-booking races both lock order outcomes; exact :44:59/:45:00/:45:01 cutoffs; target already closed; pre-cutoff hold cannot confirm after cutoff; stale versions/prices; direct anonymous/authenticated RPC denied; token/CSRF checks; paid restrictions; idempotency and one modification email event; full clock schedule matrix; DST and UTC/UK/USA/Australia database timezones; next date skips a closed calendar day.

Existing calendar tests were amended for zero infant seats and the 15-minute boundary. Two previously stale public API test expectations were corrected to match the existing passenger field and pricing-error response; the API error behavior was not changed to satisfy them.

Public management UI flow tested at 320, 360, 375, 390, 430, 768 and 1440px, including view, passenger change, review, confirmation, keep-booking and cancellation. Browser availability/mutations were mocked; no hosted booking created/cancelled. Database behavior was tested separately against local real PostgreSQL/PGlite. Responsive screenshots retained under ignored private/manage-*.png. Real mobile hardware/browser keyboards and email inbox delivery are not claimed.

## Remaining business content / release work

Owner supplied https://maps.app.goo.gl/rssrPnaBYZVWp316A (resolves to coordinates 42.067722, 19.512861). Shared src/modules/booking/meeting-point.ts supplies this link to confirmation, management and non-cancellation email templates. No unverified street address or operational map stop was invented. The live map remains independent. Production migrations, deployment, Resend activation and real-user end-to-end verification are NOT performed. Apply reviewed database changes before releasing dependent code; existing database connections alone do not activate these local RPCs.

## Files in this task

- supabase/migrations/20260925000600_booking_seats_and_cutoff.sql
- supabase/migrations/20260925000700_customer_booking_management.sql
- supabase/migrations/20260925000800_booking_calendar_guidance.sql
- src/modules/booking/availability.ts, contracts.ts, orders-server.ts, customer-management-server.ts
- src/app/api/public/booking-management/route.ts
- src/app/(public)/booking/manage/page.tsx
- src/components/public/customer-booking.tsx, customer-booking.module.css, booking.tsx, booking-pass.tsx
- src/modules/integrations/booking-email-template.ts
- tests/database/customer-booking-management.test.mjs, availability-clock.test.mjs, calendar-pricing.test.mjs
- tests/integrations/customer-management.test.mjs, public-availability.test.mjs
- tests/postgres/concurrency.test.mjs
- docs/DECISIONS.md, PHASE_STATUS.md, this report

Previously pending email admin/scheduler/heartbeat work remains local and preserved, not part of this booking feature's deployment claim.

LOCAL ONLY — NOTHING DEPLOYED

## Publication follow-up
User authorized publication on 25 September 2026. Three booking migrations applied together and recorded in migration history. Existing business fields verified unchanged. Website publication in progress; email activation remains excluded.

Publication verified: GitHub main commit 9269b19390b1afe2ef654795ee8e3a29096aab97, Netlify deployment 6ab683509124bc000772b363 ready and published at https://sightseeingapp.netlify.app. Exact isolated release passed lint/typecheck/build and 236 tests (15 identity, 71 integration, 128 database, 22 PostgreSQL concurrency). Homepage, /book and /booking/manage returned HTTP 200. Production management endpoint read an existing booking with matching reference and no-store; malformed token rejected with 404. No production booking mutation or email send tested. Separate email-admin/scheduler work remains unpublished.
