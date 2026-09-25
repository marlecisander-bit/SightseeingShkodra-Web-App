# Dynamic day planner

2026-09-25. Existing homepage information strip replaced with DayPlannerStrip; no new tables, pricing calculations or tracking algorithms.

## Sources

- Fare: homepage reader's existing one-adult availability quote. Per-departure passengerQuote.total includes Calendar & Pricing overrides/offers. Display the lowest remaining saleable quoted fare; no fallback to a fabricated or base price. Booking revalidates availability/pricing as before.
- Schedule: existing effective_schedule_times_v1, bounded to today's date for the configured published product, excluding cancelled inventory departures. Closed and finished days have distinct presentations. Public responses contain times only, no reservation/customer data. Schedule errors do not suppress route/price.
- Stops: shared read-only published map reader, deduplicated by objectId and ordered by stopNumber. Same helper used by destination associations. Added/removed/reordered published stops appear on page entry; no duplicate stored route.
- Tracking: the existing embedded live map's rendered public status, transmitted through an origin-checked parent handshake. Uses the map's parked/freshness presentation including its unavailable warning. No raw coordinates, new database subscriptions, ETA calculation or stop detection. ETA omitted. The bridge supports local website origins; a future hosted website origin must be explicitly added before deployment there.

## Interaction and refresh

Fare navigates to existing /book. Stops and today's full schedule open native accessible dialogs (bottom sheets on mobile). Map action goes to /live. Server page entry reuses React-cached getHomepage so the planner does not duplicate the initial fare query. Client clock advances every 30 seconds in Europe/Tirane, removing past times and fetching once when the local date changes. Route/pricing are not repeatedly polled. Map handshake/heartbeat uses the already embedded frame; no duplicate map or tracking connection. Until that lazy frame initializes, the useful View live van status link remains visible. Lost bridge heartbeat returns to that neutral link after 45 seconds, without diagnosing GPS loss.

## Authorized external release

User explicitly approved adding and publishing a read-only bridge. Netlify release 6ab63a9701d7ac2c166d59a4 changed only /js/live-map/public-presentation.js, appending the bridge to the exact current production file. All other manifest hashes/file count preserved. Previous deploy is recorded in private/map-bridge-published.json for rollback. Matching append retained in sibling map source; installable bridge source is docs/integrations/live-map-parent-bridge.js. No GPS logic or schema changed.

## Checks and limits

9 planner tests cover timezone/date rollover, before/between/after departures, closed day, effective/zero fares, independent failures and stop identity/order changes. 4 existing public-homepage tests and 6 calendar pricing tests passed. Bridge VM checks cover allowed/untrusted origins, parked/unavailable presentation and release syntax. Lint, TypeScript and isolated production build passed.

Actual API returned five stable published stops, today's four configured times, and remaining adult quotes. Actual browser received NEXT STOP: 2. Shiroka/ Lake Shkodra from the published bridge. Stops dialog and mobile schedule sheet verified; 1440/768/390px showed four/two/one columns and no overflow. No live bookings or content changes were made. Moving-to-parked transitions were not field-tested with the physical van; bridge tests verify forwarding rather than reimplementing those states.

Changed application areas: homepage.ts, day-planner.ts, day-planner-server.ts, map-stop-summary.ts, destination-stops-server.ts, public/day-planner API, homepage route/view, DayPlannerStrip, use-map-status, public.css and focused tests. Backend booking rules, existing holds/orders and map calculations unchanged.
