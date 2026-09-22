# Tracking reuse: first local public port

2026-09-22. The shared tracking renderer is now mounted at `/live`. This is a partial integration: the original application's live backend, editor, ETA pipeline and publishing workflow are not connected yet.

## Reused behavior

Ported `js/shared/tracking-state.js` into typed module `tracking-state.ts`. It preserves source-timestamp freshness, delayed/offline thresholds, movement states and last-reported/confirmed parked-stop wording. Retained original bytes at `docs/source/tracking/tracking-state.js.txt`; SHA-256 `d1e55ef35d603da26a75b210d0ae7db72f7963780993390dab28766e667a58c0`. A regression test executes that inspected pure baseline in an isolated VM and compares 28 movement/freshness combinations. The typed version also treats an invalid current clock as offline.

Adapted the published-map presentation contract from the supplied `js/live-map/load-published-map.js`: active GeoJSON lines, multiline routes, stop numbers/names and POIs. The new projection bounds feature/coordinate counts, validates coordinate ranges, limits labels and accepts only hex route colors. All content is rendered through React text or DOM `textContent`; legacy HTML popups, external icons and executable styling are not imported. Unsupported geometry is not rendered. This is a presentation port, not a port of route-distance or arrival calculations.

Extended the existing shared map rather than adding another renderer. It draws route parts, stops, POIs and vehicle positions, with text lists beneath the map. The public `/live` page explicitly shows that its feed is not connected. Fictional geometry and a stale vehicle remain confined to the development-only `/dev/tracking-preview` page. No real route data was imported.

## Verification

32 integration tests passed, including original-versus-port GPS parity and published-map validation/active-filter/multiline tests. Lint and TypeScript checks passed. The final isolated production build passed. Chrome displayed the fictional route, stops, POI and stale vehicle context, and verified the public page's unconnected state. No database changes required or database tests rerun.

## Remaining integration

The active legacy versus selected-snapshot backend contract still needs reconciliation before live reads. No new GPS writer, public data endpoint, provider selection, Realtime listener, ETA calculation, geolocation permission request or backend schedule was introduced. Existing prototype `positions-server.ts` is not used by the public page and is not a substitute for the original tracking pipeline.

Next: adapt and test the verified public snapshot/map read contract with explicit project/operator/vehicle binding, then connect refresh/reconnect behavior. Port the staff map editor/publishing separately with this app's authorization. Full public parity, admin consolidation, device regression and live cutover remain pending. Original source and hosted services were untouched.
