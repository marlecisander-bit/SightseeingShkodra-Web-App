# Missing 09:00 departure: root cause and verification

Investigated and corrected on 2026-09-24.

## Actual cause

The owner's active service schedule 242602ef-f9ce-40e1-b1d2-6b72bd47e37c configures 09:00, 11:00, 13:00 and 15:00, all weekdays, 24 September through 31 October, with default capacity 8. The operator timezone is Europe/Tirane.

A persisted schedule_exceptions row for 2026-09-25 replaced that date's times with 11:00, 13:00 and 15:00. Its staff note was: "Requested test: 09:00 cancelled for this date only." There was no 09:00 dated inventory row, so no missing/zero capacity or held seats caused the omission.

The exact excluding condition is effective_schedule_times_v1's CASE WHEN e.id IS NOT NULL THEN e.departure_times ELSE s.departure_times END. Because an exception existed, the normal 09:00 time never reached ensure_schedule_date_v1 or the availability result. This was a leftover database configuration exception, not a frontend/backend date-comparison defect.

## Trace

Admin schedule and date exceptions -> effective_schedule_times_v1 -> ensure_schedule_date_v1 -> read_dated_availability_v1 -> getAvailability -> quoteAvailability -> BookingFields options.

Both materialization and snapshot filtering compare the full service_date + start_time AT TIME ZONE operator.timezone against the current timestamp. There is no time-only comparison and no additional advance booking cutoff in this implementation. quoteAvailability preserves returned times and computes remaining seats; the frontend displays options and disables insufficient capacity.

Reasons remain distinct: paused schedules / outside operating days produce no effective times; closed or custom exceptions override that date; cancelled inventory is excluded; departed instances fail the complete timestamp predicate; full or group-insufficient inventory remains in the quote as unavailable.

## Correction

Restored the normal schedule for 25 September through save_schedule_exception_v1 with p_restore=true, using the existing owner authorization checks, optimistic timestamp and domain audit event. No direct table deletion or hard-coded UI times. The existing materializer then created 09:00 with inherited capacity 8. Existing IDs for 11:00, 13:00 and 15:00 were preserved. Existing three committed seats at 15:00 were unchanged.

Verified hosted availability after correction: 09:00=8, 11:00=8, 13:00=8, 15:00=5 seats remaining. Public booking dropdown rendered the same four options. No reservation was submitted by this investigation.

## Code and tests

No production scheduling algorithm, migration, price, capacity rule or booking flow needed changing.

- tests/helpers/database.mjs: optional clock seam confined to disposable PGlite databases. Applies clock substitutions to in-memory migration SQL only; checked-in production migrations are untouched. Default callers continue using the actual clock.
- tests/database/service-schedules.test.mjs: freezes the fixture era before the configured season, eliminating failures after hard-coded 24 September departures elapsed.
- tests/database/availability-clock.test.mjs: regression tests against real SQL functions for A-G, midnight, spring/autumn DST, exact departure cutoff, exception restoration and full inventory.

Results: 16 focused tests passed; full database suite 92/92 passed; ESLint passed. Tests cover before 09:00, 10:15 and 12:00 today; tomorrow and later dates; past dates; UTC/Los Angeles/Tokyo database sessions; Tirane midnight; 29 March and 25 October DST changes; restoring an omitted time; preserving existing IDs and inherited capacity; and sold-out inventory remaining visible but disabled.

Future legitimate date exceptions must still be respected. Tests and QA data for these scenarios should stay in isolated fixtures rather than the owner's operational schedule.
