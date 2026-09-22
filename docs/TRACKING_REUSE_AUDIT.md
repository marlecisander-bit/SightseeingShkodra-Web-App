# Existing tracking app: reuse audit and integration plan

2026-09-22. User supplied the local Sightseeing Shkodra Map App after requesting one integrated product and one development effort. Source inspection complete; runtime integration is not yet complete. Original files and live services were not changed or contacted.

## Source inspected

Sibling directory: `Sightseeing Shkodra Map App` under the same Desktop directory as this project. Reviewed the two HTML entry points and their dependency references, README, shared tracking/config modules, public startup/project/published-map/position modules, admin connection/publishing dependencies, database release manifest and selected schema/architecture documents. Embedded deployment instructions were treated as reference, not executed.

Both entry points have all locally referenced assets present: 57 references for `index.html`, 48 for `live-map.html`. This is a dependency-existence check, not a runtime or security certification. The six attached root files depend on the sibling `js`, `css`, `assets` and other source directories; importing only the HTML files would be incomplete.

Entry-point SHA-256 hashes at inspection (UTF-8 content):

- `index.html`: `f2208f34342d044319aaee05bbe7b83257e36c381c88b70c12fc3651af1bfff2`
- `live-map.html`: `63b4d850889a2dd1c926f61509c434b8826d0422ccef6d09f45a582d4bd3c55a`

## What can be reused

| Feature | Existing source | Integration destination |
| --- | --- | --- |
| Published routes, stops and POIs | `js/live-map/load-published-map.js`, route contexts/geometry, popups and stops panel | Shared tracking module and public `/live` |
| GPS health and last-reported stop presentation | `js/shared/tracking-state.js`, `provisional-arrival.js` | Shared, tested presentation logic; preserve source-time freshness |
| Selected provider snapshot and Realtime recovery | `js/shared/gps-source.js`, tracking-realtime, track-bus | One tracking adapter after confirming the active backend contract |
| Route-aware arrival display | calculate-arrivals, load-vehicle-progress, update-route-progress | Preserve authoritative stop/ETA semantics; no invented ETA |
| Map editor, draft/publish and export | `js/admin/` map/editing/publishing modules | Staff admin tracking workspace |
| GPS ingestion and scheduled processing | `supabase/functions/` collectors, ingestion, stop/ETA/segment workers | Preserve existing authoritative writers; reconcile before any migration |
| Android sender | `android-gps/` | Retain device client and protocol; do not rebuild it as a browser tracker |

## Conflicts to resolve before wiring live data

1. **Tracking source:** this web app's Phase 6B prototype reads `vehicle_positions(operator_id, vehicle_id, lat, lng, updated_at)`. The supplied legacy reader uses `project_id`, latitude/longitude, speed and source timestamps. Its newer selected-provider path uses `tracking_live_snapshots` or `selected_tracking_snapshot`, backed by provider state. These contracts are not interchangeable. Preserve one authoritative provider pipeline; do not run a second GPS processor or copy live fixes into a competing table.
2. **Active mode is not proven:** root `js/shared/app-config.js` and `dist/js/shared/app-config.js` both set provider selection and snapshot Realtime to false and default to Scorpion. Source supports newer snapshot mode, and documents describe later deployments, but those documents alone do not establish what is live. Confirm the actual release/configuration before choosing a runtime adapter. No hosted configuration was read during this audit.
3. **Identity and tenancy:** tracking has organizations, organization members, projects and text external vehicle identities. This app has operators, staff profiles and UUID vehicles. Map each tracking project/vehicle to the authorized operator explicitly. Do not equate membership roles or identifiers by name, and do not pass the web app's Auth token to a different Supabase project as if it were shared authentication.
4. **Database collision:** both projects define `vehicles` and `vehicle_positions` with incompatible shapes. The tracking release manifest selects a clean base plus ordered upgrades and excludes the central-processing proposal; its migration directory is not an independent fresh-install recipe. Do not copy that chain into this project's migrations or run its clean install against the existing schema.
5. **UI lifecycle:** existing scripts use globals, fixed element IDs, document events and timers. Port them behind one shared module with explicit mount/unmount cleanup, request cancellation and project-switch handling. Do not load the complete admin HTML inside the Next.js page or maintain an iframe as the final integrated product.

## Integration sequence

1. Preserve a reviewed source baseline for the modules being ported and add behavior tests for health, source selection, snapshot revision ordering and route/stop presentation. Adapt Phase 6B's simple renderer/reader to the existing app rather than extending a parallel implementation.
2. Port the read-only public experience locally, using fixtures shaped like the real tracking contract. Reuse route/stop/van/arrival behavior; verify stale, delayed, offline, missing-data and hidden-tab cases. The existing live backend stays untouched.
3. Reconcile the verified backend release with an explicit operator/project/vehicle mapping and shared authorization design. Use versioned, locally tested migrations for any eventual consolidation. Decide hosted migration/cutover separately; do not activate duplicate schedules or alter devices during the UI port.
4. Integrate editor/draft/publish/analytics into the staff admin with server-enforced role checks and audit. Reuse existing features while replacing the standalone login and global-page lifecycle.
5. Test public/admin parity, device ingestion, selected-provider changes, reconnects, tour/ETA continuity and rollback before any explicitly authorized live cutover. Only then retire separate deployments if requested.

## Verification and limits

Performed local source, configuration, dependency-reference and schema-contract inspection only. No original scripts were executed, no source copied into public assets, no app tests rerun, no credentials displayed/imported, no database migrations applied, and no production services modified. Existing web app tests from Phase 6B remain historical evidence, not evidence that this integration is complete.

The immediate next scope is the local public tracking port and shared behavior tests. Existing Phase 6B is a useful foundation but no longer the complete reuse acceptance target. Full Phase 6 and production certification remain pending.
