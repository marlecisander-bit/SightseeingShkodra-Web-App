# Paired Live Map audit — 31 October 2026

**Verdict: PARTIALLY CONNECTED. Release recommendation: HOLD public activation.**

The actual Next.js Route page and actual canonical Live Map exchange the existing v1 presentation contract locally. This is paired application evidence, rather than a mock parent/child demonstration. A companion stop-command interaction defect remains: van-follow can move the selected popup offscreen or close it. The public gate remains **false**. No commit, push, deployment, database change or companion source edit was made.

Consolidation note (31 October 2026): the active source, runners and evidence are now preserved in `SightseeingShkodra-Web-App-canonical`. Run the commands below from that permanent folder. The original checkout/revision below remain historical evidence; see [consolidation audit](PERMANENT-WORKING-FOLDER-2026-10-31.md). Relative companion paths and the existing contract are unchanged.

## Sources, instructions and local setup

Website checkout: `/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App-release-all-20261030`, branch `release/all-completed-20261030`, HEAD `b623c3f9f2538c570b65b2536e5f36cf65e04b6f` plus this uncommitted website patch. Initial status contained only untracked `docs/releases/all-completed-20261030/publication.json`; preserved. Other admin release worktrees were not edited.

Canonical current companion: `/Users/aleksandermarleci/Desktop/Projects Dev/live-tracking-app-release`, branch `master`, HEAD `b80768d913dd62a24caea5db806c07fb50864f6a` plus its existing local companion patch. Its README's latest “Coordinated candidate” section identifies `frontend/` as canonical and the older `live-tracking-app-canonical` workspace as historical. Read its actual [31 October report](../../live-tracking-app-release/reports/companion-20261031/README.md), runtime selection, source, browser test and README. No companion AGENTS.md/CLAUDE.md was found. Existing modified companion files: responsive-presentation.css, journey-framing.js, public-presentation.js, app-config.js, current-release.json, test-tourist-presentation.cjs; existing untracked report and test-companion-browser.cjs preserved. [Worktree evidence](evidence/live-map-paired-20261031/worktrees.json).

Read website AGENTS.md, roadmap V4 including Phase 6 guardrails, DECISIONS including iframe amendments, PHASE_STATUS, current handoff and historical integration reports. Read installed Next server/client and environment-variable guides before edits. Existing independent map and authoritative operational model retained; no second tracking contract or GPS engine.

`lsof -nP -iTCP:3011 -iTCP:4199 -sTCP:LISTEN` found no listeners before startup. Started only these task-owned services, without changing ports:

```sh
# Website checkout
NEXT_PUBLIC_LOCAL_MAP_PREVIEW=1 npm run dev -- --hostname 127.0.0.1 --port 3011
# Companion checkout
npm run serve
```

Actual parent: `http://127.0.0.1:3011/route`.
Compact placement: `http://127.0.0.1:3011/dev/live-map-preview?presentation=compact`.
Child: `http://127.0.0.1:4199/live-map.html?project=sightseeing-shkodra&embed=1&websiteStatus=external-v1&presentation=full` (or compact).

Only `127.0.0.1` was used for the pair. The existing preview override already served the real child port; the new `NEXT_PUBLIC_LOCAL_MAP_PREVIEW=1` development-only override extends that fixed binding to actual Route. It accepts no arbitrary child URL/origin. Production ignores it even when set to 1; regression tested. Both ports were task-owned and were stopped after verification. The static server itself points at public services; **do not manually open it expecting isolated data**. The acceptance runners install browser transport interception before navigation.

The real child HTML, scripts, Leaflet/Turf, stop assets, status model, card renderer, toolbar and real React consumers ran. Only transport and captured assets were controlled: synthetic Supabase SDK reads/Realtime rows, existing captured published-map fixture, local pinned library copies, synthetic browser geolocation. External requests were fulfilled locally or blocked before dispatch. No writes were observed. Tiles were deliberately absent. Visible website copy labels simulated tracking data. These are not live GPS or hosted acceptance screenshots.

## Producer / consumer comparison

Companion references below are relative to the canonical companion root; website references are relative to this report's repository root.

| Contract concern | Actual producer | Actual consumer / result |
| --- | --- | --- |
| Query opt-ins | `frontend/js/live-map/public-presentation.js:5` requires framing, `embed=1`, `websiteStatus=external-v1` | `src/components/public/live-map-embed.tsx:48` sends both only for external mode. Missing websiteStatus retains child card and leaves parent neutral/unavailable. |
| Capability | Companion `public-presentation.js:81` requires numeric `version:1`; supplied capability must be numeric 1. External activation additionally requires capability 1 and approved parent. | `src/modules/tracking/journey-bridge.ts:9` sends exact `shkodra:request-journey`, numeric versions. Legacy requests omit capability. Numeric 2, string "1", capability 99 rejected in browser. |
| Reply / readiness | Companion `public-presentation.js:15` emits `shkodra:journey`, numeric 1; no separate ACK. `:43` builds display from `touristView.project(model)`, the same card model. | `journey-contract.ts:11` validates bounded additive schema; bridge `:20` now requires embeddedDisplay in external mode before readiness. Legacy-mode compatibility retained. |
| Display schema | `{version:1,label,destination,activity,eta,nextStop,live,stops:[{id,number,name,label,state}]}`; view states unknown/current/approaching/next/completed/upcoming | `journey-contract.ts:1` matches. Strings limited to 240; display stop strings to 180, unique nonempty IDs, at most 100 stops. `embedded-map-status.tsx:5` renders authoritative text and accessible progress; no independent ETA/status calculation. Exact projection and stop-array equality verified. |
| Envelope | Existing unavailable, movement, phase, observation/valid-until, confidence.position and legacy stops retained. Producer also sends pre-existing confidence/activity metadata and stop statusText/historical. | Parser accepts additive metadata; validates numeric v1, booleans, bounded strings/stops and known states. No latitude/longitude/coordinates/speeds/provider run IDs in observed journey messages. Extra pre-existing fields do not create another contract. |
| Parent/source | Companion `public-presentation.js:79` checks source === parent and exact allowlist; external mode uses stricter approved set. Legacy journey includes the pre-existing `https://sightseeingapp.netlify.app` consumer without granting it external activation. | Bridge `:18` checks exact child origin AND source === current iframe.contentWindow. Browser rejects null-origin sandbox sender, same-child-origin sibling iframe and malformed messages. |
| Local origins | `frontend/js/shared/app-config.js:64`: adds exactly localhost:3011 and 127.0.0.1:3011 only on exactly localhost:4199 or 127.0.0.1:4199. | Fixed receiver `http://127.0.0.1:4199`; no wildcard, prefix or arbitrary-port trust. Companion targeted tests confirm local isolation. |
| Public origins | app-config.js:50 permits https://sightseeingshkodra.app, www.sightseeingshkodra.app, sightseeingshkodra.com, www.sightseeingshkodra.com | Public receiver remains https://sightseeingshkodralivetrackingapp.netlify.app. Public gate false. Both implementations use explicit postMessage target origins. |
| Initial / updates | Valid handshake registers parent and immediately sends cached projection when model exists; later normal renders send updates (`public-presentation.js:10`, `:71`, `:88`). | Listener installed before request; 3-second handshake retry while disconnected. Initial connecting state and retained child card observed before valid capability. One parent panel and hidden child card after activation. |
| Evidence age / expiry | Existing child render cadence sends current projection without renewing old observation timestamps. PARKED grace comes from existing child model. | `journey-contract.ts:28`: recognized phases need movement/valid timestamps, observation <=60s future, max age/span 90s (PARKED 180s); TTL min(45s, valid-until minus now). UNKNOWN/absent phase has 45s transport TTL. Repeated updates preserve observation time; simulated 181s without observations becomes UNKNOWN. Silenced transport removes parent claims. |
| Reload / navigation | New document loses capability, retains internal card until a new valid handshake. | iframe onLoad resets snapshot, readiness and slow-load timer (`live-map-embed.tsx:46`); Reload remounts iframe. Navigation and reload recover; one panel. Bridge disposal removes listener/retry/expiry (`journey-bridge.ts:39`); cleanup count verified by unit tests. Browser listener cardinality itself was not instrumented. |
| Stop selection | Companion `public-presentation.js:90` checks numeric version 1, string ID, active stop, exact parent/source; opens existing marker. | Parent sends exact `shkodra:select-stop`, numeric 1, authoritative ID. Invalid numeric/string/null versions reject. **Interaction mismatch remains:** handler omits disabling followVan, unlike child helper at `:76`. See defect below. |

## Website fixes

1. `src/modules/tracking/journey-bridge.ts:20`: external mode now rejects otherwise valid legacy messages lacking embeddedDisplay. Previously they could stop retries and mark ready while no external display existed. Added regression for absent display and preserved legacy mode.
2. `src/modules/tracking/public-map-binding.ts:17`: fixed development-only local paired override. `src/components/public/live-map-embed.tsx:14` reuses it; local previews visibly identify simulated tracking.
3. `src/components/public/route-journey.tsx:32`: redundant Route rail status follows the effective local/public external-mode flag. Previously a whole-page local override would leave a second summary. Public behavior is unchanged while gate is false.
4. `tests/integrations/embedded-map-display.test.mjs`: production override cannot activate even with environment flag set; development opt-in works.

No homepage section was reinstated. Current `src/components/public/homepage-view.tsx:19`–`:30` mounts editorial stops and no LiveMapEmbed/HomepageMapDisclosure. Historical handoff statements claiming a homepage inline map are stale for this checkout. `/` also cannot load a real CMS publication without local backend bindings (`src/app/(public)/page.tsx:20`). Browser captured this exact unavailable state and the existing synthetic full HomepageView preview with no iframe. Compact results below are explicitly **dev-preview results**, not a claim that the current homepage contains a map.

## Paired browser acceptance

Installed Chrome headless with real cross-origin frames. Reproducible runners: [paired-browser.cjs](evidence/live-map-paired-20261031/paired-browser.cjs), [paired-extra.cjs](evidence/live-map-paired-20261031/paired-extra.cjs). They require the two actual running servers; they do not start a replacement website or child. Data: [browser.json](evidence/live-map-paired-20261031/browser.json), [extra.json](evidence/live-map-paired-20261031/extra.json), [stop-diagnostic.json](evidence/live-map-paired-20261031/stop-diagnostic.json).

| Viewport | Actual Route full | Existing compact dev preview |
| --- | --- | --- |
| 320×568 | Pass map layout; existing header crowding separately | Pass map layout; existing header crowding separately |
| 360×800 | Pass | Pass |
| 375×812 | Pass | Pass |
| 390×844 | Pass | Pass |
| 430×932 | Pass | Pass |
| 768×1024 | Pass | Pass |
| 1024×768 | Pass | Pass |
| 1440×900 | Pass | Pass |
| 844×390 landscape | Pass | Pass |
| 390×500 short | Pass | Pass |

Each layout check measured status above iframe, one external panel, hidden child card, zero map-container horizontal overflow and toolbar wholly within child viewport. Document scrollWidth did not exceed innerWidth at these sizes; this does not rule out clipped header descendants. Visually inspected 320px Route, desktop compact, popup and standalone evidence. Header clipping/crowding at 320px remains unrelated and unchanged. A widget screenshot scrolled under the fixed header can show that header over the panel's first line; panel geometry itself is in normal flow, not clipped by the map.

Other passes: current status/contextual ETA/next stop/progress match child's authoritative view; long labels through actual child model fit 320px; connecting and unavailable fit; expired PARKED becomes UNKNOWN without fresh evidence; transport expiry gives neutral parent state; invalid versions/malformed messages rejected without renewing display; missing query opt-in keeps internal card; iframe reload, Reload button remount and navigation recovery; parent progress keyboard Tab; real Find Me/Find Van/Route active-control states, Stops open and Escape close; compact Interact/Done toggles focus/pointer gate; attribution visible; standalone and top-level copied opt-in retain original card. No existing expansion/fullscreen control is present, so expansion is N/A.

Find Me used synthetic browser geolocation, not physical location. Browser scrolling to controls succeeded; physical page/map touch arbitration, pinch gestures and safe-area behavior require devices. No blanket real-device interaction pass is claimed. Error-like UNKNOWN/location-unavailable and connection-unavailable states were observed; a full matrix of every provider/network failure and service-finished state in paired real runtime is still pending. Harness schema/render tests are supplementary only.

### Remaining companion defect: stop command competes with van-follow

Reproduction: paired Route at 390×844, synthetic parked van at stop 3; click parent progress stop 1 while van-follow is active. The parent sends the correct existing ID. The child opens the matching popup, then follow/framing moves it outside its viewport or removes it. Measured popup in one run: x=1613, y=-2003 within a 360×591 child viewport. With fresh parked observations another run had `followVan:true` and no popup after one second.

Exact required companion change: retain source/origin/version/string/active-stop validation at `frontend/js/live-map/public-presentation.js:90`, then use the existing `selectJourneyStop` behavior at `:76` (or set followVan=false before the existing pan/open) instead of the separate follow-preserving pan/open at `:92`. Do not remove active-stop validation or change the contract. Re-test with follow initially enabled and update its reviewed runtime source hashes through that repository's existing process.

Diagnostic browser call to the existing helper, without source changes, yielded `followVan:false` and a usable popup x=96, y=115, width=167, height=118 in the same child viewport. [Helper screenshot](evidence/live-map-paired-20261031/child-helper-stop-selection.png). This demonstrates the required behavior; it does not fix or certify the repository. Companion files remain untouched.

## Screenshots

All paths are under `docs/evidence/live-map-paired-20261031/`; simulated tracking, offline tiles:

- `route-{width}x{height}.png` and `compact-{width}x{height}.png`: all ten viewport rows above.
- `connecting.png`, `parked-390.png`, `expired-unknown.png`, `transport-expired.png`.
- `long-labels-320.png`, `missing-opt-in-unavailable.png`, `controls-focus.png`, `stops-panel-open.png`.
- `stop-popup.png`, `child-helper-stop-selection.png` (companion defect and diagnostic behavior).
- `standalone.png`, `standalone-copied.png`.
- `actual-home-unconfigured.png`, `current-homepage-renderer.png` (no homepage map).

## Validation and release limits

Website full `npm test`: **665 passed, 0 failed** (163 component, 24 identity, 226 integration, 217 database, 28 PostgreSQL, 7 CMS verification). Focused bridge/display regression tests passed. `npm run check`: lint, Next typegen/TypeScript and production build passed. Logs in this evidence directory. `git diff --check` passed. Task-owned generated next-env changes restored after validation.

Companion `node tests/test-tourist-presentation.cjs` rerun passed projection, parked expiry, origin/source/version/query isolation, copied URL and stop-version checks. Its historical full suites/build are report evidence, not rerun claims here. The reported legacy browser fixture failure reading missing health remains unresolved in that repository; no replacement harness result is used to declare that suite passing.

Read-only HEAD chains checked `/` and `/route` for all four public website hostnames; [raw redirect evidence](evidence/live-map-paired-20261031/redirects.json): `.app` returns 200; `www..app` 307 to `.app`; `.com` 308 to `www..com`, which returns 200. Route paths are preserved. All final origins are in the child's explicit approved list. The `.com` family does not converge on the permanent `.app` host; record as a separate domain/canonicalization discrepancy, without changing DNS/hosting or treating it as transport failure.

Before release: companion stop selection fix and paired retest; reconcile/explicitly accept domain canonicalization; isolated configured CMS homepage acceptance if required; hosted released-child compatibility, browser CSP/geolocation permissions, tiles/network recovery, Safari/iOS/Android touch/safe areas, real vehicle transitions/parking/ETA, and comprehensive standalone regression. Public gate activation needs a separate explicit decision after those checks. No database migration is needed for this integration; existing unrelated migrations were not applied. No next roadmap phase was started.
