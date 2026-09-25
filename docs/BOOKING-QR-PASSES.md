# Booking QR passes - 24 September 2026

## Architecture and security
The existing order/hold/booking flow remains authoritative. A database trigger issues a credential inside the existing confirmed-booking transaction, including manual bookings. Capacity, payment-at-meeting-point rules, prices, guest counts and the human SS reference are preserved.

Migration `20260924000100_booking_qr_pass.sql` extends `bookings` with `qr_token`, `qr_created_at`, `checked_in_at`, and tenant-scoped `checked_in_by`. The token concatenates two cryptographically generated UUIDs without separators (244 random bits). It is opaque and contains no personal information, booking reference or URL. A UNIQUE constraint prevents duplicates; the trigger prevents credential replacement. Protected booking rows store the token so the identical QR can be regenerated.

Existing confirmed and previously confirmed bookings are backfilled, including cancelled bookings. The migration was applied to the connected development project; its one existing confirmed booking has one distinct credential and none remain missing. Cancellation retains the relationship and lookup returns CANCELLED.

Public recovery uses the existing signed checkout session and matching hold; arbitrary public lookup is not added. Staff access remains operator-scoped. `resolveBookingPass` and service-role-only `resolve_booking_pass_v1` support VALID, INVALID, CANCELLED and ALREADY_CHECKED_IN results. Check-in locks the booking row, stores timestamp and verified staff actor, and emits one activity event. Concurrent attempts cannot both succeed. A camera scanner UI is intentionally deferred.

## Rendering and layout
`qrcode` creates a matrix dynamically; shared `BookingQr` renders SVG with black modules, white background and four-module quiet zone. No image files are stored per booking. Desktop is 205px; mobile is 185px. The pass shows confirmation, service date/time/guests/total, QR, boarding instruction, original reference, payment status and instructions. Admin expanded booking details show QR and check-in status without crowding the list.

Renderer reference: https://github.com/soldair/node-qrcode

## Verification
- Database suite: 97 passed, including backfill, uniqueness, immutable credentials, cancellation, role/tenant isolation, rollback and unchanged capacity/price/guest data.
- Real PostgreSQL suite: 20 passed, including simultaneous check-in attempts with one successful check-in/event.
- Integration suite: 39 passed, including stored-token recovery, wrong-session rejection and three distinct QR payloads decoded at both supported sizes.
- Identity suite: 15 passed.
- Typecheck, lint and isolated production build passed.
- Actual browser screenshot QR images decoded to the stored synthetic booking token at 205px and 185px.
- Browser layout checks at 320, 375, 390, 768 and 1440px showed no horizontal overflow. Reload restored the same pass. Existing hosted booking admin QR and Issued / Not checked in status verified read-only.
- SVG and print CSS support a static printable pass. Physical phone-camera and paper scans were not performed; browser print emulation could not be verified due to tool timeouts.

## Files changed for this feature
- Migration: `supabase/migrations/20260924000100_booking_qr_pass.sql`
- Booking domain: `src/modules/booking/contracts.ts`, `orders-server.ts`, new `pass-server.ts`, `qr-matrix.ts`
- UI: new `src/components/public/booking-pass.tsx`, `booking-pass.module.css`; updated `checkout-flow.tsx`, `src/app/(public)/public.css`, `src/app/admin/bookings-panel.tsx`
- Local preview: `scripts/preview-booking-pass.mjs`, `src/app/dev/booking-pass-preview/page.tsx` (disabled in production)
- Tests: `tests/database/booking-pass.test.mjs`, `tests/integrations/booking-qr.test.mjs`, `booking-pass-recovery.test.mjs`, `tests/postgres/concurrency.test.mjs`
- Dependencies: `package.json`, `package-lock.json`; documentation and two preview screenshots.

Preview: http://127.0.0.1:3000/dev/booking-pass-preview
Synthetic preview data comes from a real isolated database confirmation, not a hosted reservation or valid travel ticket.

![Desktop pass](screenshots/booking-pass-desktop.png)
![Mobile pass](screenshots/booking-pass-mobile.png)
