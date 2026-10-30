# Live Map website integration — companion handoff

Status: WEBSITE SIDE LOCAL ONLY. Public activation is OFF. No commit, push, deployment, hosted database update or companion workspace modification in this continuation. The earlier companion patch may already exist locally: inspect and reuse it before editing. Historical evidence is in LIVE-MAP-EMBEDDED-REDESIGN-2026-10-30.md; this document is the current integration handoff.

Absolute path:
`/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App-canonical/docs/LIVE-MAP-WEBSITE-HANDOFF.md`

## Website files and ownership

Existing implementation reused:
- `src/components/public/embedded-map-status.tsx`: display-only status, next stop, contextual ETA, accessible stop progress above the iframe; now guarantees one current step even with multiple next hints.
- `src/components/public/live-map-embed.tsx`: same iframe, permissions, full/compact behavior and explicit-origin bridge; now gates external mode, resets stale claims on reload and restarts slow-load timing on every iframe load.
- `src/components/public/live-map.module.css`: existing responsive external panel in normal flow, full-width iframe and compact/full/short viewport heights. Reused unchanged this continuation.
- `src/components/public/route-journey.tsx`: preserves editorial destination rail and scheduled information. Its redundant rail status is suppressed only when the public external-status gate is enabled; while disabled the existing Route summary stays available.
- `src/components/public/live-journey-tracker.tsx`: existing optional `showStatus` support. Reused unchanged this continuation. Homepage status behavior remains intact.
- `src/modules/tracking/journey-contract.ts`: existing additive v1 display parser and existing lifetime semantics. Reused unchanged this continuation.
- `src/modules/tracking/journey-bridge.ts`: existing sender/source/schema validation, retry, expiry and disposal; capability request is now explicit opt-in. A valid but already expired replacement clears previous claims immediately.
- `src/modules/tracking/public-map-binding.ts`: new hard-coded `websiteExternalStatusEnabled = false` release gate. No CMS/env override. Production never binds to the fixture, even if `localPreview` is supplied.
- `src/app/dev/live-map-preview/page.tsx`: existing dev-only wrapper with actual website branding, Header and public CSS. Reused unchanged. Returns notFound outside development.
- `scripts/preview-live-map.cjs`: now serves a self-contained website-owned mock, no sibling checkout/GPS/database dependency. Old harness source retained locally at `private/live-map-before/preview-live-map.cjs`.
- `scripts/fixtures/live-map-frame.html`: new controlled mock sender and schematic iframe canvas. Uses website van asset; its toolbar responses are simulated, not the real map implementation.
- `tests/components/embedded-map-status.test.mjs`, `tests/integrations/embedded-map-display.test.mjs`, `tests/integrations/journey-bridge-lifecycle.test.mjs`: display, public gate, security, expiry/reload/cleanup tests. Fixture timestamps now use one clock observation to avoid millisecond races.
- `tests/components/live-journey-tracker.test.mjs`: previous status-suppression test retained.
- This handoff, historical-report clarification, evidence and appended docs/DECISIONS.md and docs/PHASE_STATUS.md notes.

No admin source, booking schema, tracking processing or provider connection is changed by this continuation. Existing dirty admin files and prior published admin release evidence are preserved.

## URL and activation

Canonical child origin: `https://sightseeingshkodralivetrackingapp.netlify.app`.

Proposed paired mode, using the EXISTING approved parameters:
```
/live-map.html?project=sightseeing-shkodra&embed=1&websiteStatus=external-v1&presentation=full
/live-map.html?project=sightseeing-shkodra&embed=1&websiteStatus=external-v1&presentation=compact
```
`presentation` remains full or compact; preserve the app's existing meanings. `project` remains the existing route/data binding.

Website public gate remains false: actual public URLs omit `websiteStatus`, do not request `embeddedDisplayVersion`, and render no external panel. The hosted/default map keeps its internal panel. The new panel and opt-in URL are enabled only on the development preview, on fixed loopback child origin `http://127.0.0.1:4199`. Do not enable publicly until paired acceptance and explicit release authorization.

The child must require ALL: framed (`self !== parent`), `embed=1`, `websiteStatus=external-v1`, valid version-1 capability handshake from an approved parent origin AND `event.source === parent`. A copied URL opened as a top-level page must retain the original standalone card and framing.

## Existing version-1 message contract — do not invent another

Parent → child, immediately after mounting and on each iframe load:
```json
{"type":"shkodra:request-journey","version":1,"embeddedDisplayVersion":1}
```
`type` exact literal; `version` literal number1. `embeddedDisplayVersion` optional literal number1, present ONLY in the opted-in external mode. Legacy requests omit it.

Child → parent: existing `shkodra:journey` v1, ADDING the existing approved `embeddedDisplay` projection. This is also the readiness response; no separate ready/ack message is needed.

Illustrative payload only (never show these sample values as live data):
```json
{
  "type":"shkodra:journey",
  "version":1,
  "unavailable":false,
  "movement":"Parked at Shiroka / Lake Shkodra",
  "phase":"PARKED",
  "lastObservationAt":"2026-10-30T12:00:00.000Z",
  "statusValidUntil":"2026-10-30T12:00:30.000Z",
  "confidence":{"position":"delayed"},
  "stops":[
    {"id":"actual-stop-id","number":"2","label":"Shiroka / Lake Shkodra","state":"current","eta":""}
  ],
  "embeddedDisplay":{
    "version":1,
    "label":"PARKED AT",
    "destination":"Shiroka / Lake Shkodra",
    "activity":"Departure not confirmed",
    "eta":"About 12 min after departure",
    "nextStop":"Rozafa Castle",
    "live":false,
    "stops":[
      {"id":"actual-stop-id","number":"2","name":"Shiroka / Lake Shkodra","label":"Current stop","state":"current"}
    ]
  }
}
```

Authoritative schema is `src/modules/tracking/journey-contract.ts`:

| Field | Type / limits |
| --- | --- |
| type / version | literal `shkodra:journey` / number1 |
| unavailable | required boolean; preserve current upstream meaning |
| stops | required array, 0–100, unique nonempty IDs |
| stops[].id | string, 1–180 chars |
| stops[].number | optional string, max30 |
| stops[].label / eta | required string, max180 / max80 |
| stops[].state | current, next, departed, upcoming |
| movement | optional string, max180 |
| phase | optional ARRIVING, PARKED, LEAVING, EN_ROUTE, UNKNOWN |
| lastObservationAt / statusValidUntil | optional nullable parseable timestamp strings, max40; use ISO UTC |
| confidence | optional object, position = live, delayed, unavailable |
| embeddedDisplay | optional for backward compatibility; required for new external panel |
| embeddedDisplay.version / live | literal number1 / required boolean |
| label, destination, activity, eta, nextStop | required strings, each max240; empty string allowed |
| embeddedDisplay.stops | required array, 0–100, unique nonempty IDs |
| display stops[].id, number, name, label | required strings, max180; id nonempty |
| display stops[].state | unknown, current, approaching, next, completed, upcoming |

IDs must match the real map's existing IDs, not example IDs. Stop selection stays:
```json
{"type":"shkodra:select-stop","version":1,"id":"actual-stop-id"}
```
Use existing selection validation and behavior. No new raw coordinates, history, speeds, provider IDs or subscription endpoints are required. Do not project GPS independently in the website. React escapes strings; messages must be plain display data.

## Readiness, updates, expiry and security

1. Parent installs one message listener and requests current journey with explicit target origin (the configured child origin). Retries the presentation handshake every3s only while disconnected. This is not a GPS poll.
2. Child validates exact source, allowed origin, query mode and versions, then activates embedded-only layout and sends its current computed projection through the existing journey response. Derive `embeddedDisplay` from the same render/model as the current internal card, not from a new tracking state machine. Cache and share that projection; never scrape DOM text as the authoritative data source.
3. Subsequent existing render/status changes send the same message. Ensure delivery stays within the parent's45s message lifetime (reuse existing cadence; a presentation heartbeat may replay current cached projection but MUST NOT refresh observation/valid-until timestamps or make stale data appear fresh).
4. Parent accepts only `event.origin === configuredChildOrigin` AND `event.source === iframe.contentWindow`, then validates full version/schema. Unknown/malformed messages are ignored and never extend the last valid snapshot's lifetime.
5. Existing freshness contract: UNKNOWN or absent phase gets a45s transport lifetime. Recognized phases require valid movement, observation and validity timestamps. Observation may be at most60s in the future. Recognized observation age and validity span are at most90s, except PARKED180s. Lifetime is `min(45000, statusValidUntil - now)`. No local parking/ETA calculations occur. Invalid/expired replacement clears existing recognized claims; expiry clears displayed stop/ETA/progress claims and shows neutral unavailable text, then requests current presentation.
6. Parent displays neutral connecting copy before a valid display; after20s, unavailable copy. Iframe reload resets snapshot, bridge state, load timeout and readiness. Reload button also clears claims immediately. Unmount removes listener, retry and expiry timers. Stop selection is resent after readiness/reload when applicable.
7. Child must post ONLY to the validated parent's explicit origin. Never `*`. Validate its `event.source === parent`, exact allowed origin and request/selection versions. No cross-origin DOM access, masks or cropping. Internal toolbar, attribution, gestures and map bounds remain child-owned.

## Origin configuration

Website production receiver allows only the canonical child origin above. The fixed dev preview receiver allows only `http://127.0.0.1:4199`. It does not trust port4200 (the malicious sender fixture), `null`, prefix matches, arbitrary URL parameters or sibling frames.

Child parent allowlist: reuse existing approved configuration; preserve other authorized consumers. Approved website domains to support explicitly: `https://sightseeingshkodra.app`, `https://sightseeingshkodra.com`, `https://www.sightseeingshkodra.com`. Keep exact origins (scheme+host+port), no path or wildcard. Verify canonical redirects before release. Vercel preview hosts must not be broadly wildcard-allowed.

Local parent origins in the website fixture are exactly `http://localhost:3011` and `http://127.0.0.1:3011`. Add these only in the companion's supported local/development config; do not weaken production allowlisting. Real companion local origin may differ: paired testing must deliberately update the website's development-only fixed binding (currently4199) or serve the real local child there; do not change production binding to a local/mock URL.

## Exact companion work required later

Inspect AGENTS/project instructions, Git status, any previous local patch and canonical frontend/runtime manifest before edits. The previous report identifies `frontend/js/live-map/public-presentation.js`, `frontend/css/live-map/responsive-presentation.css`, `frontend/js/live-map/journey-framing.js`, `runtime/current-release.json` and `tests/test-tourist-presentation.cjs` as likely already patched. Paths may vary: inspect instead of duplicating work. This website session has not read/modified/deployed that checkout and does not certify its current contents.

- Add/finish only the opt-in mode specified above, using existing handshake/origin config.
- Send existing computed card fields as `embeddedDisplay` on the EXISTING journey message and updates. Preserve UNKNOWN/stale, parking grace, contextual ETA, service finished/error and stop progress decisions exactly.
- Hide only the internal status card, and remove only the hidden card's reserved framing space, after opt-in activation. Preserve the actual map route/coordinates, stop assets, original van, controls/attribution, geolocation permissions and resizing logic. Keep toolbar inside iframe bounds, including safe areas.
- Default/standalone, invalid origins/versions, missing query parameters and top-level opt-in URLs must retain appearance and behavior. No global CSS changes.
- No GPS processing, database, persistence, new provider/polling/subscription, or new communication contract.
- Add tests for copied opt-in URLs, default standalone parity, origin/source/version rejection, projection equality, no-coordinate payload, expired state and reload/remount. Respect any pinned runtime/source hashes using that project's established process.
- Implement locally only. Separate authorization is required to commit/push/deploy either app.

## Website local verification and paired release order

Run `node scripts/preview-live-map.cjs` and `npm run dev -- --port 3011`. Open `http://localhost:3011/dev/live-map-preview`; `?presentation=compact` checks homepage-style interaction gating. Mock selector states include parked, moving, unknown, out-of-service, error, loading, stale, long-labels, malformed and unauthorized. Loading reloads the iframe with no status responses; stale sends one3s-valid snapshot then stops. Unauthorized uses a separate port4200 nested sender; parent must ignore it. Mock toolbar simulates Find/Route/Stops; it does not request real location. No external backend is used. This validates website display/transport only, not the real map integration.

Required paired verification after companion work: use real local child and actual website iframe at320,360,375,390,430,768,1024,1440 plus844x390 and390x500. Verify one panel above, no internal duplicate, accurate projected states/ETA, unknown/expired neutral state, allowed origins, reload recovery, stop commands, actual Find me/Find van/Route/Stops and existing expansion, keyboard navigation, attribution, page scrolling/map gestures and safe areas. Preserve homepage versus Route differences. Compare default standalone at representative sizes and top-level opt-in URL. Real vehicle/GPS/geolocation acceptance must be separately distinguished from fixtures. Do not invent an Expand control if current app has none.

Release order (future, NOT authorized now): finish companion locally; run paired acceptance; release companion backward-compatible support first under explicit authorization; verify unchanged standalone/default. Then explicitly authorize website gate activation, retest against released child and publish website. If companion unavailable or compatibility fails, leave gate false. Website rollback is gate=false; default child then keeps internal card. No database migration required.

## Validation results

See `docs/evidence/live-map-website-connection-2026-10-30/validation.json` for final checks, captured widths and precise limits. Screenshots are schematic fixture evidence, not real-map or hosted integration acceptance. Known pre-existing website header crowding at320px is outside this map-only change; no blanket whole-page clipping pass is claimed.


Website validation completed:652 tests passed, lint/typecheck/build passed, final gate assertion and targeted lint passed. Native Chrome fixture captures cover every requested width plus landscape and short viewports. Fixture state/security/expiry/reload checks passed. Existing320px header crowding remains outside scope. Real companion and physical devices remain unverified.

## Paste into Codex in the Live Map workspace

Implement the Live Map companion side locally using this exact handoff:
`/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App-canonical/docs/LIVE-MAP-WEBSITE-HANDOFF.md`.

Read project instructions and inspect existing work, including any prior companion patch; reuse it. Preserve unrelated changes. Do not commit, push, deploy, apply database updates or modify the Web App repository.

Reuse the existing `shkodra:journey` v1 protocol and additive `embeddedDisplay` v1 exactly as documented. Activate embedded-only panel hiding only when framed with `embed=1&websiteStatus=external-v1`, plus a valid version1 `shkodra:request-journey` carrying `embeddedDisplayVersion:1` from an allowed parent origin/source. Send the existing computed display state on readiness and subsequent updates with explicit target origins; no raw GPS or new subscriptions/polling/state calculations. Preserve upstream freshness/parking/ETA/progress decisions.

Keep default/standalone appearance, copied top-level opt-in URLs, route/coordinates/assets/van/toolbar/permissions unchanged. Update only embedded card visibility and reserved framing space. Validate origin/source/version, lifecycle and projection parity, run relevant tests/lint/typecheck/build, and capture representative standalone/embedded evidence. Report exact changed files and any compatibility blockers. Website public activation must remain off until paired testing and separate release authorization. Do not claim end-to-end completion without connecting and testing both real applications.
