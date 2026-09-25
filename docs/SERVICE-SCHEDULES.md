# Recurring service schedules

Implemented 2026-09-23 in the local app and sightseeing-shkodra-dev. No production deployment or independent map change.

## Architecture and ticket semantics

Before implementation, inspected products, departure management, availability, holds, booking items, checkout, staff booking and confirmation SQL. Existing bookings reserve a particular departure ID (option B in the request). There is no all-day entitlement or repeated-boarding model. The Daily Ticket title alone does not change those rules. Current semantics are preserved and explained in admin; all-day boarding rights need a separate business decision.

## Database/schema changes

- `20260923000200_service_schedules.sql` adds operator-scoped service_schedules and schedule_exceptions, departure linkage and unique schedule/date/time inventory, validated schedule/exception mutation RPCs, transactional reconciliation and requested-day materialization. Existing availability and departure mutation entry points are wrapped.
- `20260923000300_schedule_inventory_identity.sql` enforces matching operator and product on linked departures and serializes legacy moves with schedule adoption for both products.
- Both applied to development and recorded in migration history with their SQL. New tables have RLS, scoped staff reads, no anonymous access or authenticated direct writes. Mutations use existing verified server authorization, audit events and stale-edit protection. No existing table or historical record was deleted.

## Schedule, departure-time and exception models

One current schedule per product stores inclusive start/end dates, ISO weekdays, active/paused status, positive default capacity and optional vehicle. Sorted, unique HH:mm time rows support optional capacity/vehicle overrides; blank values inherit defaults.

An exception closes the day or supplies that date's complete replacement time list. Remove a row to cancel; remove/add to change a time; add rows for extra departures. Capacity and vehicle overrides apply only on that date. Restore normal schedule removes the override. Exception dates must be within the operating period and cannot be past dates.

Saving a season does not generate the season. Only a requested day is materialized, at most 24 rows, reusing stable departure IDs. Explicit rows are necessary for existing holds, confirmations, cancellations and historical order references. Future materialized rows are reconciled transactionally; removed times are cancelled, never deleted. Past instances remain unchanged.

## Capacity and booking engine

The existing availability snapshot counts confirmed items and active unexpired holds per departure; the shared quote computes max(0, capacity - confirmed - held). Existing hold allocation locks the same departure row. No second seat ledger or frontend capacity calculator was added.

Schedule reconciliation reuses the original capacity-edit guard. Closing, pausing or reducing below reserved quantities fails atomically. Staff must resolve affected holds/bookings first. Concurrent date reads serialize on a product advisory lock and a unique inventory key; schedule edits and holds serialize on departure locks. Prices, hold expiry, session ownership, idempotency and meeting-point payment remain unchanged.

## Public and admin changes

The public date selector, checkout recheck and homepage timetable already call the shared read_availability_v1 entry point; it now ensures the requested schedule date before returning the existing snapshot. DTOs and public rendering remain unchanged. Local PUBLIC_HOMEPAGE_PRODUCT_SLUG was corrected from shkodra-day-tour to hop-on-hop-off-daily-ticket. No credentials changed.

Departures now prioritizes service schedules, weekdays, sorted multiple times, defaults and exceptions. Dated inventory/history remains inspectable. Legacy unlinked rows can still be reconciled; schedule-linked rows use exceptions. Staff booking date browsing prepares the same requested day and filters choices to that day.

Changed application files: departures-panel.tsx, bookings-panel.tsx; new schedule-editor.tsx, schedule-actions.ts, schedule.module.css and modules/booking/schedules-server.ts. Reused MutationForm, SubmitButton, permission checks and existing booking functions.

## Existing development data and example

Before migration: one draft product, one departure, zero booking items and zero holds. The existing product had no pricing/capacity configuration. Publication state and price were preserved.

Created through the browser: Hop On Hop Off - Daily Ticket, 24 September through 31 October 2026, all seven weekdays, active, eight seats, unassigned vehicle, 09:00/11:00/13:00/15:00. Saved the requested 25 September exception without 09:00; it remains available to restore in admin.

The existing 24 September 09:00 departure retained ID 30ff15af-21b8-4467-b745-fd8d8ecc3adc. Browsing three dates produced 11 inventory rows: four on the 24th, three on the 25th, four on the 26th. The remainder of the season is not generated.

General adoption only accepts exact, unambiguous future manual instances. Conflicting capacity, vehicle, status or duplicate slots block creation and roll back. Past records stay untouched. There was no hosted booking history to migrate; preservation/conflict behavior was tested with fixtures.

## Verification

- 15 identity, 32 integration, 82 database and 19 real PostgreSQL tests passed: 148 total.
- New tests cover exact requested dates, lazy generation/stable IDs, isolated cancellation/restoration, closed days, changed/extra times, capacity overrides, weekdays, pause/resume, confirmed plus held inventory, oversell rejection, unsafe-edit rollback, stale/unauthorized writes and historical/manual adoption.
- PostgreSQL concurrency tests verify one row under concurrent date reads and capacity-edit versus hold serialization in both lock orders.
- Browser saved the schedule with out-of-order time entry; sorted output and duplicate prevention verified. Saved exception and browsed 24/25/26 September with expected lists. Visually inspected schedule and override fields; screenshot: screenshots/service-schedule.jpg.
- ESLint, TypeScript and isolated optimized Next.js build passed. Final staff date-choice query adjustment passed lint/typecheck.
- Initial parallel database run exhausted machine memory; sequential execution passed all 82 tests. The schema inventory test was updated to cover both new RLS tables.

## Limitations and next operator actions

- Actual product remains draft without a price. Enter price and required publishing fields in Products & suppliers, then publish to enable public booking. Published-product fixtures verified shared availability/booking; the actual unpublished product remains unavailable publicly.
- One current period per product, at most 730 days between endpoints and 24 times per day. Multiple independent seasons are not supported; existing exceptions must remain within edited period bounds.
- Pausing/closing never silently cancels existing reservations or sends notifications. Resolve conflicting reserved inventory first.
- No all-day reboarding entitlement, cross-product vehicle collision detection or GPS/route changes. The independent map remains authoritative.
- No destructive inventory cleanup or production deployment.
