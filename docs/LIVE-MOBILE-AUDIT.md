# Live page mobile audit — 25 September 2026

LOCAL ONLY — NOTHING DEPLOYED. No database migrations or data writes.

## Inventory and ownership

| Surface | Actual source | Data / reuse |
|---|---|---|
| Public route and metadata | src/app/(public)/live/page.tsx | Published website CMS, published editorial destinations |
| Page introduction / editorial route | src/components/public/editorial-pages.tsx, route-preview.tsx | Shared CMS copy, shared destination presentation; illustrative destinations are not operational stops |
| Header, menu, booking dialog | src/components/public/booking.tsx | Shared BookingProvider, BookingFields, BookButton and Header |
| Map and recovery controls | src/components/public/live-map-embed.tsx, live-map.module.css | One iframe to independently deployed Map App |
| Marker, GPS, ETA, stops, bottom controls | Sibling Sightseeing Shkodra Map App: live-map.html; js/live-map/track-bus.js, public-presentation.js, marker-motion.js, segment-eta.js; css/live-map/ | Existing standalone Supabase/Scorpion implementation. No local tracking implementation activated or added |
| Schedule and fare | day-planner-strip.tsx; modules/content/day-planner-server.ts, day-planner.ts; api/public/day-planner | Existing effective schedule RPC, cancellation exclusion and booking-derived adult fares; no hardcoded times/prices |
| Booking availability / checkout | use-availability.ts, checkout-flow.tsx, booking-pass.tsx; api/public/availability, checkout | Existing passenger pricing, seat holds, confirmation and meeting-point collection |
| Footer | Shared public layout / footer components and public.css | Existing CMS and photographic footer |

No charts or analytics tables exist on this page. No new component, API, database table, tracking subscription or booking engine was added.

## Baseline findings and changes

- Large marketing heading delayed access to the map. Scoped responsive heading, introduction spacing and map height to /live. Existing CMS copy retained.
- Fixed mobile booking strip occupied screen space over the map while header already offered booking. Suppressed that duplicate strip only on /live; shared header booking remains.
- No departures or fare section on /live. Reused DayPlannerStrip in compact mode, showing fare and today's schedule plus existing booking dialog CTA. Operational stop/status UI stays in the iframe.
- Planner only fetched on initial load/date changes. Added 60-second visible-page refresh, resume refresh, request timeout, abort cleanup and concurrent-request guard. Failure clears stale displayed data rather than presenting it as current.
- Schedule previously claimed 'Departed' based solely on time. It now says 'Scheduled earlier'; cancellations remain excluded by the existing server implementation.
- Above-fold map used lazy loading. Added optional priority loading for /live while other consumers retain lazy loading.
- Iframe had no initial loading announcement. Added loading / slow-load feedback and reset on retry. Loaded iframe does not imply all tiles loaded; existing grey-background recovery guidance remains.
- Compact planner does not subscribe to parent map status messages; the existing optional hook is preserved for other consumers.

## Verification

Browser: local headless Microsoft Edge (desktop browser resized; not physical iOS/Android hardware).
Widths/heights: 320x740, 360x800, 375x812, 390x844, 412x915, 430x932, 768x1024, 1024x768, 1280x800, 1440x900, 1920x1080, 844x390 landscape. No document horizontal overflow in the matrix. Exactly one iframe retained. Screenshots at the five requested sizes were opened and visually inspected, including a second pass after compact planner changes.

Map: observed live moving/approaching and AT STOP presentation, green stop marker, van marker and ETA. Find Van, Route, Stops panel and iframe reload exercised. At 390px the iframe inner width was 356px, control group 336px, horizontal center error 0px, buttons 50px high. No tracking algorithms changed. Live observations are not a simulation of every GPS/network state.

Booking: at 360 and 390px exercised date selection, departure selection, adult/child/infant steppers, child-only rejection, category total, review selection, seat-hold UI, customer name/email, meeting-point confirmation and availability API failure. All mutating checkout requests intercepted with synthetic responses; no real reservations or messages created. This verifies UI wiring, not a fresh end-to-end production transaction. Existing passenger availability/session/planner regression tests passed (17 targeted tests including legacy prototype tests; prototype tests are not evidence about the iframe engine).

Automated browser reproduction: scripts/verify-live-mobile.mjs. Requires running local server and Playwright, defaulting to existing sibling test runtime; PLAYWRIGHT_MODULE can override the module URL. It asserts the responsive matrix and synthetic booking journey. Private screenshots: private/live-{360,390,430,768,1440}.png, private/live-booking.png, private/booking-confirm-{360,390}.png, private/live-stops.png. These are ignored by Git.

Production build, TypeScript and ESLint passed. No Lighthouse score claimed. No new font/image/map bundles; eager map loading reduces delayed initialization. Planner refresh adds one existing API request per visible minute, with cleanup and no overlapping fetches.

## Limits / remaining issues

- Physical touch gestures, native mobile date pickers, software keyboard and real-device geolocation permission flows require device testing. Find Me was not granted fabricated location data.
- Cross-origin tile failures cannot be reliably detected by iframe onLoad; retry/open-map actions remain available. No second tile loader or tracking engine added.
- Hosted map ETA ranges render a question mark separator in observed text (e.g. ~4?6 min). This is in the independent map application; this web-only patch does not change its deployed assets.
- Timetable indicates scheduled service, not confirmed actual departure or seat availability. The booking engine remains authoritative for availability and adult/child/infant fare totals. The strip presents an existing adult starting fare only.
- No full assistive-technology certification or performance benchmark claimed; retained semantic labels, focus styling, native dialogs, loading announcements, mobile input types and readable responsive layout.

## Changed files

- src/app/(public)/public.css
- src/components/public/booking.tsx
- src/components/public/day-planner-strip.tsx
- src/components/public/editorial-pages.tsx
- src/components/public/live-map-embed.tsx
- src/components/public/use-map-status.ts
- scripts/verify-live-mobile.mjs
- docs/LIVE-MOBILE-AUDIT.md
- docs/PHASE_STATUS.md

Additional failure checks: intercepted schedule HTTP 503 and indefinitely pending iframe navigation produced schedule-unavailable and slow-map feedback. Mobile menu opened and Escape closed it. Final combined responsive/booking browser script passed. Full-page screenshots taken after scrolling can show fixed headers at the capture scroll position; viewport screenshots were also checked for the booking dialog.
