# Phase 4B - Server-rendered tour page

Date: 2026-09-22. Scope: `/tour` product facts and existing section integration. No later booking-flow phase or external deployment.

The tour page now reuses the Phase 4A server-only published product projection and shared booking availability quote. Title, description, page metadata, price card, ordered boarding stops, today's upcoming departures and booking-bar facts derive from the same configured operator/product as the homepage. No duplicate pricing or capacity calculations were introduced. Reads remain request-time and uncached across requests; `/tour` is now dynamic server-rendered HTML.

The route section uses published coordinates when available. Its empty state explicitly labels the illustrative destinations. The timetable gives the service date and operator timezone; the price card states that its quote is for one guest today, not the selected booking date. The boarding FAQ links to actual published locations when present. Missing publication and upstream failure have distinct messages. The live-map shell, inclusions, how-it-works, genuine-review empty state and FAQ remain in their existing section order. Booking controls remain previews without holds or payments.

## Verification

- Lint, TypeScript and production build passed; `/tour` is dynamic.
- 15 identity and 11 integration tests passed. The initial parallel database run crashed in Node under local resource pressure; rerunning database tests with `node --import tsx --test --test-concurrency=1 tests/database/*.test.mjs` passed all 67. All 14 native PostgreSQL tests passed separately: 107 passing tests across the completed runs.
- Extended `scripts/verify-public-homepage.mjs` checks actual production-build HTTP responses for both homepage and tour: published title, stop, shared price, departure/timezone, private/draft exclusion, page-copy separation, noindex and withdrawal on the next request after archiving. Hosted execution passed; all synthetic records were removed.
- Chrome checked the real empty workspace and synthetic populated tour. At 390px the timetable and boarding link were usable without horizontal overflow; at 1280px the published title and price card rendered correctly. A final display correction reuses the existing departure-pill class and adds machine-readable date/time markup. Browser sizes are emulation, not physical-device testing.

## Configuration, content and limitations

No migration, permission, dependency or environment change. The existing `PUBLIC_OPERATOR_ID` and `PUBLIC_HOMEPAGE_PRODUCT_SLUG` binding is shared deliberately. The owner workspace stays empty, as requested. Approved operational details and prices can be entered later; no values were imported from the old site. Inclusions, accessibility, fees and reviews remain pending rather than invented; dedicated structured tour editorial fields are not introduced here. Current price configuration and age-band limitations remain as recorded in Phase 4A. Search indexing remains disabled before launch. No performance benchmark or full Phase 4 acceptance is claimed.

Changed files: tour page, existing hosted verification script, this report and phase status. No roadmap deviation. Ready for Phase 4C date/guest/departure selection using the shared Booking API. The local tour preview is http://127.0.0.1:3000/tour.
