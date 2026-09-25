# Cancellation to new booking — local fix

## Root cause
Checkout restored `shkodra-checkout-v1` from sessionStorage even when the server returned a cancelled order. The completed-order branch rendered the old pass and had no restart action. The management page had no Book Again action and did not reset the persistent public BookingProvider or invalidate its quote. No localStorage booking state exists; the signed session cookie authorizes holds and is not a completed-booking flag.

## Changes
- `src/modules/booking/checkout-browser-state.ts`: shared storage key, booking-only removal and current Europe/Tirane date with one adult and no departure selected.
- `src/components/public/booking.tsx`: shared reset action clears selection and increments a generation, remounting dialog/checkout state and resetting steps, customer fields, hold attempt, request ID, countdown and completion state.
- `src/components/public/use-availability.ts`: generation invalidates the quote even if date/passengers are unchanged; existing no-store fetch and abort cleanup prevent stale results.
- `src/components/public/customer-booking.tsx`: cancellation confirmation, Book Again and homepage actions; reset after successful cancellation or loading a cancelled booking; clear modification state; synchronous request guard prevents repeated submissions.
- `src/components/public/checkout-flow.tsx`: discard server-confirmed cancelled restores; Book Again for a displayed cancelled order. New attempts use the existing random request ID generation and normal checkout endpoint.

The management token remains only in its historical management URL; navigating to /book drops that fragment. Only the checkout sessionStorage entry is removed; language/preferences and authentication cookies are preserved. No frontend arithmetic adds seats back.

## Existing server guarantees retained
cancel_customer_booking_v1 delegates cancel_order_v1. It locks departures/order, cancels pending/confirmed items and the booking/order, releases active holds, and retains history. Consumed holds remain historical and do not count; occupancy sums confirmed items plus active unexpired holds. Cancelled/expired allocations consume zero. Repeat cancellation returns the existing result and the order.cancelled event key is stable. The existing email queue handles customer/owner events; new bookings use their own normal confirmation event. Email delivery remains inactive and no messages were sent.

booking_cutoff_v1 remains authoritative for confirmation, modification and cancellation: closed at departure minus 15 minutes in Europe/Tirane. Public availability omits closed departures, and confirmation rechecks after locking. Standard eight-seat fixtures retain adult/child=1 and infant=0; no configured capacity or pricing was changed.

## Verification
Lint, TypeScript and production build passed. Identity 15, integrations 86, database 129 passed; corrected the new concurrency fixture's too-short session identifier and reran all PostgreSQL concurrency tests: 23 passed. One additional focused browser-state test passed (254 unique passing tests across runs).

New database coverage: 2 adults, 2 adults+2 children, adults+child+infant, exact occupied-seat release, duplicate cancellation, historical cancelled records, new references/tokens and immediate same-departure rebooking. Real PostgreSQL tests cover cancellation racing allocation in both lock orders. Existing tests cover cutoff equality/closed cancellation, DST/timezones, stale quote/capacity and rollback.

Six local browser scenarios at 390px and 1440px completed a new mocked booking: cancel + reload management + Book Again; cancel + homepage + open/close Book Now + normal /book; stale cancelled checkout restored after page load. Verified fresh availability, distinct request ID, reset party/departure, preserved language and no horizontal overflow. Browser API responses were mocked; database tests run separately locally. No hosted customer booking changed; no physical-device claim.

No database migration. No second booking system or unrelated backend redesign. LOCAL ONLY — NOT DEPLOYED.

Publication authorized by user on 25 September 2026. Releasing the tested UI fix through GitHub main and Netlify; no migration or email activation.

Published and verified: 7e21f01 / Netlify 6ab68878787ac500083c826a. Live page/API read checks passed; published mobile Book Again and cancelled restoration flows passed with mocked mutations. No customer reservation changed during verification.
