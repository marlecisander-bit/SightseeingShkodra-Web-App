# Live Journey Tracker — local review, 23 October 2026

Status: frontend implementation ready for visual review; full acceptance and release remain pending. No push, merge, deployment, database migration, cloud configuration change or tracking-engine modification was performed.

## Initial architecture and component audit

The worktree was already extensively modified on `main`, including Route, shared stops, CMS and map presentation. Existing work was retained. This report describes this task's changes, not the entire diff from HEAD.

- `/route` loads published Website content, day-planner operational stops/schedule, and published destination records. `RouteJourney` owns page presentation and the existing schedule refresh. Destination records join operational stops by `stopId`; ambiguous matches remain unmapped.
- The independent Netlify `live-map.html` iframe remains the single map/tracking consumer. Find Me, Find Van, Route, Stops, map markers, geometry, attribution, GPS collection, Supabase processing and update cadence remain upstream.
- `LiveMapEmbed` already has an origin/source-checked version-1 `shkodra:journey` bridge and existing `shkodra:select-stop` command. Its handshake and 45-second stale handling are unchanged. No new message type, subscription, database read/write or polling timer was introduced.
- The authoritative projection exposes only `current`, `next`, `departed`, `upcoming`, ETA text and unavailable. It does not expose a separate skipped, parked, awaiting-departure, speed or timestamp field. Frontend code must not infer these from order or selection.
- Follow-up correction: the requested van is the live tracking app’s `assets/brand/sightseeing-van.svg`, referenced by its shared `vehicle-icon.js`. Copied byte-for-byte to `public/brand/sightseeing-van.svg` and reused by the Route tracker at its original 640:300 aspect ratio. No recoloring or artwork edits. The simpler website icon was initially used in error and has been replaced in the new tracker. The external map remains untouched.
- Homepage and Route previously consumed the shared photographic tracker. A dedicated Route presentation now consumes the same mapper and the original tracking-app SVG; the homepage's component, layout and styles are retained.
- Existing brand tokens own burgundy, cream, typography, spacing, borders, focus and completed green. Next-stop blue is scoped locally. Desktop uses five columns; mobile switches to a vertical rail at 700px. Image dimensions reserve space; reduced-motion disables the new fade/transition.
- CMS destination names, photos, alt text, tag/subtitle, description and guide links remain authoritative. There are no structured visit-duration or highlights fields in the current destination DTO; none were invented. Operational stop count/order remain authoritative instead of hardcoding a fictional five-stop fallback. Current public language is English with the existing “more languages coming soon” architecture; no second translation system was added.

## Implemented behavior

A compact status panel and numbered live progression precede the photographic destination timeline. Confirmed departures receive green checks, current receives burgundy and the original van, next receives blue, and future/unconfirmed stops remain neutral. Selection gets a separate cream highlight. No motion animation implies that a stopped van is moving.

Five equal desktop nodes become a vertical mobile timeline. Clicking or keyboard-activating a node opens its landscape image, CMS description and destination link. Repeating the selection collapses it. Next stop advances browsing selection, wrapping after the last stop, without changing vehicle state. Escape/Close returns focus to the selected trigger. View on map calls the existing Route callback and supported iframe command.

Stale/unavailable projections remove all completion/current/next claims and ETA while retaining editorial destinations. A current stop suppresses ETA for the next stop. Between stops, the panel says “Next destination”, without asserting motion. Loop reset is rendered directly from the next snapshot; no completion state is cached locally.

The existing departures source, local Tirane clock, refresh, availability and booking cutoff behavior are unchanged. Its cards now use four equal columns, becoming two at narrow phone widths. The configured 09:00/11:00/13:00/15:00 slots are never fabricated if schedule data is unavailable.

## Task-specific modified files

- `src/components/public/live-journey-tracker.tsx` — new Route presentation and selection interactions.
- `src/components/public/live-journey-tracker.module.css` — scoped desktop/mobile design and reduced motion.
- `src/components/public/route-journey.tsx` — replace only the tracker component import/render from the starting worktree.
- `src/components/public/route-journey.module.css` — append compact schedule-card grid.
- `public/brand/sightseeing-van.svg` — exact original asset from the sibling live tracking app. Shared homepage component remains unchanged.
- `src/app/dev/stops-preview/page.tsx` — live fixtures exercise the new component, discover fixtures retain the homepage component.
- `tests/components/live-journey-tracker.test.mjs` — four state/presentation regression tests.
- `docs/PHASE_STATUS.md` — evidence-based task entry.
- This report and `docs/review/live-journey-2026-10-23/` — desktop/mobile screenshots and responsive measurements.

No package, environment, backend, migration, external map source or integration contract changes.

## Verification evidence

| Check | Actual result |
|---|---|
| ESLint, TypeScript, production build | PASS |
| Existing full `npm test` | 407 passed: 52 component, 17 identity, 143 integration, 171 database/domain, 24 PostgreSQL concurrency |
| New tracker tests | 4 passed separately; CMS content/ETA, stale/unavailable neutralization, arrival/loop reset, later-next without inferred completion |
| Browser widths | 320, 375, 390, 430, 768, 1024, 1440px: no document overflow, broken images or main button targets under 44px |
| Browser interactions | Stop click/Enter, description update, Close/focus return, Next selection with unchanged van status verified |
| Browser state fixtures | Stale, unavailable, loop reset and later-next neutral stops verified; arrival fixture shows van at stop without movement or ETA |
| Actual local iframe | Loaded live map and attribution; Route checked, Stops panel opened/closed, Find Van checked |
| Find Me | Control present; requesting actual geolocation not tested |
| View on map | Existing callback/command wiring retained; complete parent-to-frame focus acceptance pending populated isolated content |
| Diff whitespace | `git diff --check` passed |

The initial sandboxed `npm test` could not start tsx's IPC pipe. A direct-loader run reached the PostgreSQL tests but local port binding was blocked. The complete existing npm suite subsequently passed with local-server permission; these were environment restrictions, not unresolved test failures.

Review images use clearly labeled fictional editorial/tracking fixtures and existing project photographs. They do not claim to show production journey state. The full seven-width screenshot set is also available in `/tmp/journey-redesign/`; retained desktop/mobile images and measurements are beside this report under `review/live-journey-2026-10-23/`.

## Limitations, performance and release recommendation

The actual local `/route` response hides Route/departures under its existing content state; no CMS publication or visibility change was made to force them visible. Therefore a populated, isolated end-to-end acceptance check remains necessary for CMS-to-tracker content, map focusing and the configured schedule display. A physical van journey, stop-recognition recovery and production transitions were not exercised. The deployed map's own parked status was visible; the parent projection only permits the less specific “Van at …” wording.

Skipped stops cannot receive a truthful explicit skipped badge with this version of the bridge. They remain neutral when upstream reports upcoming, and only explicit departed gets a check. Parked/awaiting-first-departure cannot be distinguished independently. Any richer bridge proposal requires separate approval; none was implemented.

No approved mockup image was attached, so exact visual matching cannot be certified. The supplied written layout/palette requirements guide this local implementation. Durations/highlights and new translations require an authoritative configured source before display.

No dependencies, map mounts or background listeners were added. Five mapped nodes render on the existing journey updates; selection only updates React presentation. Images use Next Image with explicit dimensions and responsive sizes. Field Core Web Vitals, screen-reader testing, automated axe scanning and a measured before/after performance benchmark were not performed; this repository has no configured axe check. Booking regression suites pass, and booking code is untouched.

Recommendation: REVIEW LOCALLY; NOT YET APPROVED FOR DEPLOYMENT. Review the fixture screenshots, supply the approved mockup if exact comparison is required, and verify populated isolated Route content, map focus, schedule and physical-device behavior. Before any later push, reverify actual Vercel Git behavior: the checked-out branch is `main`, documented as the production branch. Existing deployment documentation is not a fresh cloud integration audit. No push or release action is authorized by this report.

## Van asset follow-up

User clarified that the icon must match the independent live tracking app. The Route status panel, compact progression and current-stop marker now all use the exact original colorful van SVG copied from `../live-tracking-app-master/assets/brand/sightseeing-van.svg`. SHA-256 equality verified. This supersedes the initial website-icon reuse claim.

Sticker follow-up: removed the van wrappers’ white/cream backgrounds and outline borders in all three Route positions. Original SVG transparency and proportions retained; current-stop van image explicitly avoids the destination-photo circular crop.
