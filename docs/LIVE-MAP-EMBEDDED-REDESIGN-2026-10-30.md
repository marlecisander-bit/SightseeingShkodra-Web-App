> Historical report. The current website-only continuation and authoritative companion handoff are in `LIVE-MAP-WEBSITE-HANDOFF.md`. The admin migration described below as pending has since been released separately. This report is retained as prior evidence, not current release authorization.

# Website embedded Live Map — local implementation, 30 October 2026

Scope: website map presentation and a small, explicitly opt-in companion compatibility patch. No commit, push, deployment, hosted migration, tracking transport, GPS processing, persistence, CMS or database change. Pending admin work and its unexecuted booking-search migration remain intact and unpublished.

## Inspection and implementation

The website already has one `shkodra:journey` v1 message bridge. The map owns tracking, parking/freshness decisions, ETA and stop progress in `tourist-state.js`, then projects the actual visible card through `touristView.project`. There was no supported external-status display mode. The current candidate source is the sibling `live-tracking-app-release/frontend` checkout, as recorded by its latest README amendment and pinned runtime manifest; its worktree was clean before this task.

The website now renders an opaque, responsive status panel above the iframe in normal document flow. Desktop uses a horizontal arrangement; narrow containers stack text/timing/progress. Long labels wrap, stop buttons have accessible names, visible focus and a single current step. The map retains its original route, coordinates, stop assets, original van graphic, permissions, toolbar and attribution. Full Route embeds reserve more map height, including short viewports. Compact embeds retain their existing interaction/scroll gate and smaller map height. The Route page keeps its editorial destination rail but suppresses its redundant status summary; the homepage summary remains unchanged. No removed homepage service section is reintroduced.

The parent loading overlay was removed; loading and expired status live above the map. There is no parent access to the cross-origin DOM, status masking, map cropping or new tracking poll/subscription. The existing compact scroll surface only gates map interaction, as before.

## Message contract and companion patch

Iframe URL opts in with `embed=1&websiteStatus=external-v1` plus the existing `presentation` parameter. The existing handshake adds `embeddedDisplayVersion: 1` to `{type:'shkodra:request-journey', version:1}`. Only a framed map with both query parameters AND a version-1 handshake from an existing approved parent origin enables the mode. The child checks `event.source === parent`, allowlisted exact origin and contract version. A copied opt-in URL opened standalone does not hide the card.

On that existing journey message only, the child adds:

```
embeddedDisplay: {
  version: 1,
  label, destination, activity, eta, nextStop, // strings
  live,                                    // boolean
  stops: [{id, number, name, label, state}]
}
state = unknown | current | approaching | next | completed | upcoming
```

This is a cached projection from the same render that fills the existing map card. It does not recalculate tracking status. No coordinates, tracking history, speed or provider identifiers are added. The parent's existing journey parser bounds strings/arrays, rejects malformed or duplicate stop IDs and unknown versions/states, and validates exact source window/origin. React escapes text. All posts use explicit target origins. Existing journey lifetime rules are retained: no more than 45 seconds between valid presentations, bounded additionally by upstream `statusValidUntil` for recognized phases (including the existing parked grace). Reload clears the parent panel and restarts the handshake; unmount disposes listeners/timers.

Companion changed files, in `/Users/aleksandermarleci/Desktop/Projects Dev/live-tracking-app-release`:

- `frontend/js/live-map/public-presentation.js`: opt-in handshake and shared display projection.
- `frontend/css/live-map/responsive-presentation.css`: internal card hidden only under the activated mode attribute.
- `frontend/js/live-map/journey-framing.js`: external mode no longer reserves space for a hidden card; default framing unchanged.
- `runtime/current-release.json`: explicit hashes for the three reviewed local frontend overrides; baseline manifest untouched.
- `tests/test-tourist-presentation.cjs`: default and top-level opt-in URL safety, origin/source/version rejection, exact projection parity and no-coordinate payload assertions.

**Dependency:** both local changes are implemented, but the production iframe URL still serves the currently hosted map. It will not supply `embeddedDisplay` or hide its internal card until the companion patch is separately released. The website deliberately shows a neutral parent status if the old child does not support the capability. Hosted end-to-end acceptance is not claimed. No release is authorized by this task.

## Website changed files

- `src/components/public/embedded-map-status.tsx` — new display-only panel.
- `src/components/public/live-map-embed.tsx` — above-map panel, opt-in URL, reload lifecycle and fixed development-only loopback fixture binding.
- `src/components/public/live-map.module.css` — responsive status layout, focus/progress styling and full map heights.
- `src/components/public/live-journey-tracker.tsx`, `route-journey.tsx` — preserve destination browsing without duplicate Route status.
- `src/modules/tracking/journey-contract.ts`, `journey-bridge.ts` — validated additive contract and capability request on the existing bridge.
- `src/app/dev/live-map-preview/page.tsx`, `scripts/preview-live-map.cjs` — controlled local iframe harness, real website header/public styles, real companion map UI/route/assets. The dev page is unavailable in production; the server binds only loopback. Backend/GPS startup scripts are excluded. Public tiles/photos can load. Simulated status is explicitly labeled.
- `tests/components/embedded-map-status.test.mjs`, `tests/components/live-journey-tracker.test.mjs`, `tests/integrations/embedded-map-display.test.mjs` — display states, accessible controls, escaping, duplicate-summary suppression and contract/expiry rejection.
- This report, evidence PNGs, and appended decision/phase notes. The generated `next-env.d.ts` build-path change was restored to its initial development-path version.

## Reproduce local browser review

1. From this website checkout: `node scripts/preview-live-map.cjs` (optional positional path to the companion checkout).
2. Run Next development on port 3011.
3. Open `http://localhost:3011/dev/live-map-preview`; append `?presentation=compact` for the compact integration.
4. Use the clearly labeled child fixture selector for parked, moving, unknown, out-of-service, error, long labels or stopped updates. For stale, stop updates and wait for the last upstream presentation deadline. Initial loading/unavailable copy is also covered by server-render and lifecycle tests; the fixture's loading selector pauses updates rather than fabricating a live loading snapshot.
5. Open `http://127.0.0.1:4199/live-map.html` to inspect unchanged default standalone presentation with the same controlled fixture. The production application binding and production origin allowlist are unchanged.

## Browser evidence and limits

Native Chrome responsive UI testing, not Playwright or physical-device testing. The actual website component and companion iframe run on separate loopback origins and communicate through the real bridge. This is an isolated development route with the real public CSS/header; it is not a hosted acceptance run or a full CMS-backed Route/homepage traversal.

Reviewed widths: 320, 360, 375, 390, 430, 768, 1024 and 1440px, plus 844x390 landscape and 390x500 short viewport. The panel and toolbar remain readable; no map-container horizontal overflow or duplicate internal card was visible. Tablet wraps progress onto another row; desktop stays horizontal. Repeated resizes preserve usable map controls. Full-page Chrome captures can omit an entirely offscreen iframe or place the fixed header at its current scroll offset; the landscape viewport capture confirms the map while scrolled into view.

Observed through the fixture: parked, moving, unknown, out-of-service, error, long labels and expired parent data. On expiry, location/ETA/progress claims disappear and neutral status appears. Tests cover initial loading, unavailable text, bad payloads/origins/sources, TTL, reset and listener cleanup. Parent stop selection opens the matching real popup, and Tab advances to the next parent progress button. Stops opens/closes within the iframe; Route activates. Compact interaction toggles correctly.

Limits:

- **Existing website header clips at 320px** (logo/booking/menu crowding). This is outside the requested Live Map-only scope and was preserved. Therefore a blanket whole-page no-clipping acceptance is not claimed.
- Fixture Find Me/Find Van/Route transport actions are controlled substitutes; real geolocation permission/GPS, physical pan/pinch gestures, iOS safe-area behavior and Safari are unverified. Existing implementations and iframe geolocation permission are untouched.
- The current map has Find Me, Find Van, Route and Stops, with no existing Expand/fullscreen control. No new Expand control was invented; expansion acceptance is not applicable to this current implementation.
- Standalone default appearance was browser-inspected at 390px and protected by mode/default tests; comprehensive standalone device regression remains unverified.
- Status semantics come from controlled projections plus existing upstream model tests, not observations of a moving production vehicle.

Representative screenshots (all simulated status): [mobile](evidence/live-map-embedded-2026-10-30/mobile-390.png), [desktop](evidence/live-map-embedded-2026-10-30/desktop-1440.png), [320px](evidence/live-map-embedded-2026-10-30/mobile-320.png), [landscape](evidence/live-map-embedded-2026-10-30/landscape-844x390.png), [standalone default](evidence/live-map-embedded-2026-10-30/standalone-390.png). Other evidence in the same directory records intermediate isolated-widget states and responsive widths.

## Checks

- Website `npm test`: **649 passed, 0 failed** (158 component, 24 identity, 224 integration, 209 database, 27 Postgres, 7 CMS verification tests).
- Website `npm run check`: lint, Next type generation/TypeScript and production build passed. The final rerun includes the development-harness compact query option.
- Both worktrees `git diff --check`: passed.
- Companion `npm test`: frontend, RC1, backend contract, integration and inspection suites passed. Its final frontend rerun also covers a top-level copied opt-in URL retaining the card.
- Companion `npm run lint`, `npm run typecheck`, `npm run build`: passed. Build verifies the pinned 123-file source plus 15 explicit local override hashes. No browser automation script was run; native Chrome was used for this task.
- The new expiry test initially exposed a one-millisecond fixture-clock race; the fixture now uses its own observation timestamp consistently. The full suite rerun passed.

No production requests/mutations were needed by the test suites. The unrelated pending admin migration was not applied to a hosted database.
