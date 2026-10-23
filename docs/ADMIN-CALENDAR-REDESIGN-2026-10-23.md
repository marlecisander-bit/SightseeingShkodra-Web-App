# Admin booking calendar redesign — 23 October 2026

Status: local implementation ready for owner review; not approved for production release. No push, merge, deployment, migration or production write performed for this task. The earlier test-booking permanent deletion remains unexecuted and unconfirmed.

## Inspection and data ownership

The existing CalendarPanel loads service_schedules, products, vehicles and the operator timezone, then calls read_operations_calendar_v1 once per schedule/month. That SQL projection is read-only: it reads effective schedule times, confirmed booking_items and unexpired active inventory_holds without materializing departures. Later seat-consumption migrations retain the existing authoritative seat rules. Cancelled items do not contribute to booked totals. The UI reuses supplied capacity/booked/held/remaining values; it never calls the mutation-capable public availability reader.

Existing saveCalendar/savePassengerPricing actions, optimistic timestamps, transactional seat guards, closure confirmation and server permissions remain unchanged. Owner/admin have pricing permissions; operations staff retain scheduling-only access. Standard Schedule, Standard Pricing, saved ranges, weekday selection, offers, capacity, closing/reopening and advanced history remain available. Historical dates can be inspected, with the date editor disabled for past dates.

## UI and status

Seven-column calendar now fills available width, with a daily panel beside it at desktop widths and below it on smaller screens. Cells have labels, status colors, selected outlines, focus indicators and arrow/Home/End keyboard movement. Today uses the existing server-calculated operator-local date, not browser timezone, with a separate blue border. Selection stays local; month navigation uses the App Router without forcing page scroll. Daily totals distinguish booked seats, temporary holds and remaining inventory. Occupancy meters use loaded departure times. The legacy editor remains below the overview.

Precedence: outside service period or inactive/no service; past; explicit whole-day or all individually configured closures; full/mixed unavailable; today cutoff uncertainty; missing price; limited; available. Explicit closures remain identifiable when SQL produces no projected slots. Mixed closed/zero-remaining dates say Unavailable rather than claiming every departure is sold out. Limited means at most 25% of priced open capacity remains, solely as a visual cue, with no change to reservation eligibility. Grey historical text is darkened to #64748B for readable contrast on the requested grey background.

## Data limitations deliberately retained

The read-only projection does not include cutoff eligibility, full departure status/reasons, or complete configured capacities for unmaterialized closed dates. Today therefore says Check cutoff when inventory remains. Totals say Projected seats and Remaining inventory, not guaranteed bookable seats. Closed slots without explicit closure evidence say Unavailable / closed rather than claiming a manual closure. No service/capacity values are invented. A calendar snapshot can become stale as bookings/holds change; existing refresh/save/month-navigation reloads remain, without new polling. Fully accurate live cutoff/reason presentation requires a separately scoped backend read-model change; this task makes none.

## Verification

- TypeScript, ESLint and production build passed; git diff --check passed.
- 17 focused calendar presentation/editing tests passed, including 11 new overview tests.
- Component suite: 71 passed, 1 failed because the pre-existing stop-publication-form test imports missing jsdom. No dependencies or unrelated files were changed to mask it.
- Remaining existing suites run independently: identity 18/18, integrations 143/143, database 172/172, local PostgreSQL concurrency 24/24. Combined: 428 passed, 1 unrelated dependency failure. npm test itself stops at that component failure.
- Local synthetic development preview: 320, 393, 768, 1024 and 1440px had no horizontal overflow. Date cells were at least 62px high. ArrowRight selected the next date and updated the daily heading. Historical editing disabled. Multi-date editor exposed From/To/weekday controls. Month navigation and Today returned correctly; February 2028 rendered 29 dates. No save/restore action was submitted during browser verification.
- Screenshots: /private/tmp/shkodra-calendar-desktop.png and /private/tmp/shkodra-calendar-mobile.png. Local preview: /dev/calendar-preview, inaccessible outside development.

## Files

src/app/admin/calendar-presentation.ts; src/app/admin/calendar.module.css; src/app/admin/operations-calendar.tsx; src/app/dev/calendar-preview/page.tsx; tests/components/calendar-overview.test.mjs; this report; docs/PHASE_STATUS.md.

Release readiness: owner review ready, production release NO. Resolve the existing missing test dependency and review the explicitly limited status semantics before any separately authorized release. Authenticated hosted saves, physical mobile devices and a post-deployment smoke test were not exercised. Existing reservations, prices, capacities, permissions, migrations and database structures were preserved.
