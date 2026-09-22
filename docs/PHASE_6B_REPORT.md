# Phase 6B: shared map foundation

2026-09-22. Shared component and source adapter implemented and locally verified under the fresh-project amendment. No legacy tracking code imported and no second position store created.

## Implementation

- `SharedMap` provides read-only view and manage-selection interfaces. Manage mode emits a selected vehicle ID; it grants no authorization and performs no writes. Both modes use the same snapshot and renderer.
- `readPositions` reads only the existing `vehicle_positions` table, with an explicit operator filter, bounded results and a five-second deadline. The calling server boundary must supply an authorized request-scoped client and trusted operator binding. No public position API or service key is introduced.
- Position normalization rejects foreign operators, duplicate vehicles, invalid coordinates/timestamps and oversized snapshots. Empty data and failed reads have distinct states; no locations are invented.
- Leaflet loads in a client-only dynamic component. It cleans up the map, tile listeners and resize observer on unmount. Freshness updates every 15 seconds; positions older than two minutes or more than 30 seconds into the future are shown as last known. These thresholds are conservative display defaults, not guarantees of GPS freshness.
- Text coordinates and timestamps remain available alongside the map. Keyboard-accessible selection buttons mirror manage marker clicks. There is no ETA, OSRM routing, GPS collection or database mutation in this subphase.
- `/dev/tracking-preview` contains an explicitly fictional, stale sample and empty/unavailable scenarios. It never accesses the database and calls `notFound()` outside development. It is not connected to `/live` or the admin navigation.

## Verification

29 integration tests passed, including four new tracking tests for tenant/coordinate validation, freshness boundaries, the single-source query contract and redacted failures. Lint, TypeScript checks and an isolated production build passed. No database schema changed; database tests were not rerun for this subphase.

Chrome checks passed for desktop and 390px-wide layouts, map/attribution rendering, view/manage switching, empty/unavailable states and keyboard vehicle selection. The temporary viewport override was reset. Real GPS, hosted source reads, public authorization/polling and admin writes are not yet verified or implemented.

## Configuration and next scope

Added pinned `leaflet@1.9.4` and development types `@types/leaflet@1.9.21`. No environment variables or migrations added. Standard OpenStreetMap tiles are used for the local preview with visible attribution, normal browser caching and an origin referrer; no prefetch or offline download feature exists. Revisit tile provider configuration before launch.

Next: Phase 6C public read-only tracking connection and UX, including authorized public data exposure and refresh/offline behavior. Phase 6D will connect admin manage actions separately. No live-service deployment or Phase 6 checkpoint is claimed.

References consulted: [Leaflet 1.9.4 API](https://leafletjs.com/reference), [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/), and the installed Next.js lazy-loading guide.
