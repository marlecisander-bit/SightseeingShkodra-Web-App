# Independent live map embed

The user's approved approach is now an iframe on `/live`, pointing to:

`https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra&embed=1`

Continue editing and publishing the map in the original tracking admin. The embedded page uses that application's existing GPS and published-map refresh behavior. Unsaved drafts are not published updates. Map changes do not require rebuilding this booking website; changes to the tracking application's JavaScript may require a page refresh after its own deployment.

The tracking app, its authentication, database, device ingestion and processing remain independent. This website neither copies positions nor runs a second tracking pipeline. Deeper code/database/admin consolidation is superseded by this decision. Earlier prototype modules and development preview are retained but not imported by `/live`.

The iframe has a descriptive title, responsive height, lazy loading, geolocation delegation for the embedded app's user-triggered location feature, and a direct-open fallback link. No user location was requested during verification. Cross-origin loading failures and upstream GPS/ETA quality remain the tracking app's responsibility; the host does not claim to diagnose them.

Local verification (2026-09-22): lint, typecheck and isolated production build passed. Chrome loaded the hosted map inside localhost, showed published stops, and the Route control worked at 390px width. The embedded display updated its distance/ETA during observation. It initially showed location temporarily unavailable and subsequently recovered. Map tiles can load independently of route overlays. No map was republished to test publication refresh; that behavior remains owned by the existing app. No live-service modifications, database writes or external deployment occurred.

Recovery follow-up: background tiles were reported missing while route/van overlays remained. Read-only Chrome inspection showed tiles loading successfully both directly and inside the iframe; a transient grey background occurred during route zoom. No persistent browser error or definitive original cause was established. Added a manual Reload map control that remounts only the iframe, plus the existing direct-open option. This is recovery UI, not a fix to the upstream tile service. Lint/typecheck passed; browser reload interaction verified. Original tracking app unchanged.

Site-wide connection follow-up: the same shared LiveMapEmbed component now powers the homepage live section, tour live section, /live and the Your day companion preview. The tour FAQ acknowledges the connected map; destination-guide sections link to its published route. Removed the obsolete previewTracking model and TrackingShell placeholders. The connected embed is independent of whether booking catalog content has been published. GPS availability remains determined by the original app. Published locally only. Lint/typecheck and isolated build passed; Chrome verified homepage placement and the expanded FAQ answer.

## Unified Route & Live Map - 30 September 2026

Local implementation; not deployed. This entry supersedes earlier references to /live as the canonical page. /route is canonical and /live permanently redirects to it. Desktop/mobile navigation and public map links converge on Route & Live Map. The homepage editorial route anchor remains compatible.

### Architecture and ownership
- LiveMapEmbed still embeds the independent sightseeingshkodralivetrackingapp.netlify.app/live-map.html source with project=sightseeing-shkodra. One iframe, no new map engine. Home, Tour and Your day retain their existing embed modes.
- The independent map remains authoritative for GPS, operational route/stop order, current/next stop, parked state, ETA and signal health. A small additive change in the sibling Map App's js/live-map/public-presentation.js projects its normalized operational state and rendered ETA through an origin- and source-checked postMessage bridge. It uses the existing presentation heartbeat and does not add GPS queries, tracking timers, writes or calculations. Stop selection pans to and opens the existing marker.
- The website validates the versioned bounded payload in journey-contract.ts, expires missing status after 45 seconds and falls back to published operational stops. Handshake retries are window messages, not network/GPS polling. Existing read-only published-map stop loading supplies the fallback; no copied stop definitions.
- getDayPlanner and the existing public day-planner endpoint supply service times. The page refreshes that schedule at most once per minute while visible. Current booking availability and cutoff enforcement remain in the existing booking flow.
- CMS published destinations join to stops only by stable stopId. Compact text/image previews link to the existing destination guide. No inferred name matching, duplicated destination records or long repeated stories.
- Existing route/departures visibility flags control those shared sections. Destination showOnPage governs previews; operational active flags remain map-owned. The independent operational map and booking entry remain available when promotional content is hidden. Draft preview accepts page=route (and legacy page=live). Existing root-layout revalidation covers this consumer.
- No schema, booking algorithm, payment, email, GPS radius, ETA algorithm or operational reset change. The prototype website tracking modules remain unused.

### Verification
- Full npm test chain: 282 passed, 0 failed (components 6, identity 17, integrations 99, database 137, PostgreSQL concurrency 23). A subsequently added unified-page visibility test passed with the final component run: 7 passed. These are separate runs, not a fabricated single 283-test run.
- Final npm run check passed lint, TypeScript and production build after the destination thumbnail addition.
- The sibling tools/test-website-journey-bridge.cjs passes isolated projection checks: current/parked, moving/ETA, last-departed, skipped-stop non-inference, delayed/unavailable status, Stop 1 reset projection, marker selection and rejected foreign origin.
- Chrome localhost: 320, 360, 375, 390, 412, 430, 768 and 1440px widths have one iframe and no document overflow. Header clearance is 88px on tested phones and 104px at tablet/desktop. Loaded mobile map and controls visually inspected.
- Browser verified merged desktop/mobile navigation, /live redirect, selecting Rozafa Castle and its actual CMS description/guide link, opening/closing the existing booking selection dialog. No booking submitted. Home and Tour retain their compact iframe source and no journey subscription.
- Logs: private/route-full-tests.log, private/route-components-final.log and private/route-check-final.log (local only).

### Release dependencies and acceptance limits
Both the website and the additive independent-map bridge must be released for the external timeline to receive live state and Show on map commands. The currently hosted map has not received this extension: local browser testing therefore verified the honest static timeline fallback alongside the working hosted live map. End-to-end moving-vehicle bridge acceptance, coordinated deployment, physical Safari/Android and a full network profile remain pending. No deployment or production data changes were performed.

The source provides lastDeparted, not a full visited-stop history. Only the confirmed last departure is marked; earlier or skipped stops are not invented as visited. All underlying operational stop-radius, parked and reset behavior remains owned by the existing map. VM projection tests are not proof of a real vehicle run. No production CMS visibility toggles or GPS simulation were performed during this task.

## Native Route preview

The owner approved integrating the map and map admin into the Web App while retaining the separate tracking Supabase project. The local native `/route` preview uses `LIVE_MAP_NATIVE_ROUTE=1` with the existing tracking Supabase URL and publishable key. The public endpoint reads only the fixed public project, its published map version, and the default vehicle's current published tracking snapshot. The flag defaults off.

The preview renders route geometry, stops and reported vehicle position in Next.js. It does not yet reproduce operational stop progression, ETA, or the full companion map controls. Other public consumers still use the companion. Map management and Netlify retirement remain pending. The existing map publication RPC requires an authenticated tracking-project identity with permission on the target project. Preserve that check and the RPC's atomic draft/publish behavior when integrating admin writes.

Verify the current device and GPS worker paths, legacy map links, and every public consumer before retiring Netlify. No tracking project migration or public deployment was performed for the local preview.

### Publication readiness check — 24 November 2026

- Local Webpack production build, TypeScript, targeted lint and all 758 repository tests passed. The built server returned native `/route` markup with no iframe when enabled, and the map API returned HTTP 200 with `Cache-Control: no-store`, one published route and five stops from the existing tracking project. The disabled API returned HTTP 404. The local browser-facing HTML check used fallback web app content because main Supabase CMS settings were absent.
- The tracking project returned a vehicle observation approximately 15 hours old at the time of the check. Connectivity is verified. Fresh vehicle updates, stop progression and ETA have yet to pass live acceptance.
- Chrome showed the Live Map Netlify project serving its November 13 production deploy on the default Netlify subdomain. The separate tracking Supabase project showed the deployed `gps-worker` Edge Function. The Netlify team also hosts the separate Borealis project.
- Release remains blocked on native admin editing and publishing, migration of remaining Netlify consumers, live mobile acceptance and verification of the exact intended release branch. Local checks ran in the existing mixed working tree. No push, hosting or Supabase change was made.

### Native journey status

The preview now shows supported stop progression and ETA from coherent tracking snapshots. Estimates require a fresh moving observation and a matching upstream ETA. A stationary stop shows its location without an arrival countdown. Stale estimates expire locally. Full companion feature parity, live vehicle acceptance and admin integration remain pending.

### Connected website and admin consumers

The opt-in native source also supplies homepage journey status and the Your day map. Tracking-authorized staff in the public operator workspace can view the published map in Live Map. Operational editing and publishing still use the existing companion because the tracking database requires an authenticated tracking-project identity. Netlify remains needed for those controls and existing direct links.

### Admin draft and publish

The native workspace now supports editing map GeoJSON, saving a draft and publishing the saved draft through the tracking project's existing RPC. It requires both website tracking permission and an existing administrator account in the tracking project. The connection expires after at most one hour. No service-role key is used. The current Vercel Preview remains read-only. Draft and publish need an end-to-end check on an isolated tracking project before production. GPS controls, operating hours and the graphical editor remain in the companion.

### Van operating hours

The native workspace reads and saves the default vehicle's weekly hours through the existing tracking Supabase project. It uses the same authenticated RPC and Monday-first Europe/Tirane schedule as the companion and preserves overnight schedules. Preview remains read-only. Graphical editing and remaining GPS controls still need migration and isolated release testing.

### Graphical map editor and cutover checks

Live Map now edits point locations and route geometry on a map, edits stop and POI details, and saves through the same draft and publish workflow. The admin map includes Find van. Calendar and overview public-map links use /route. The installed companion GPS provider selector is fixed to ScorpionTrack and disabled. The tracking worker and its provider binding remain in Supabase.

Disposable tracking database checks passed for unauthorized saves, draft privacy, stale-version conflicts, publication visibility, authorization for operating hours, overnight schedules and worker closure. Hosted authenticated editing and mobile editor acceptance are still outstanding. Verify existing direct Netlify bookmarks and QR codes before retirement.
