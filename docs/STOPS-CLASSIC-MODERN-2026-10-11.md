# Route stops — Classic Modern, 11 October 2026

Local presentation change only; no deployment, cloud mutation, migration, booking/admin change, map repository modification or new dependency. The workspace was already dirty on main; prior pending work was preserved.

## Files changed in this task

- src/components/public/sightseeing-stops-experience.tsx: live-mode indicators, accessible labels, optimized timeline images, transition-based rail scrolling. Existing inline details, guide links and map action retained.
- src/components/public/sightseeing-stops.module.css: live-mode-only compact horizontal rail, circular photographs, segment lines and status colors. Homepage discover presentation retained.
- src/app/dev/stops-preview/page.tsx: development-only synthetic names matching the requested sequence, late-next and loop-reset fixtures. No operational route hardcoding added.
- tests/components/sightseeing-stops.test.mjs: updated label assertions and arrival/next/unavailable regression.
- docs/PHASE_STATUS.md and this report: evidence and limitations.

## Data audit

Operational definitions: getDestinationStops reads the independent public map's published map_versions.map_data.features through existing read-only bindings and mapStopSummary. IDs/order/active flags remain upstream-owned; getDayPlanner supplies the existing ordered stop DTO. No coordinate or radius changes.

Editorial images/names/descriptions/links: getPublicDestinations, matched solely by stable stopId. Zero or ambiguous matches retain existing placeholder/name fallback; no inferred name matching. Live timeline photographs use next/image optimization with existing local/Supabase media permissions. Details preserve their existing image behavior. Published editorial names can differ from operational labels; associations were preserved.

Operational progression: LiveMapEmbed origin/source checks shkodra:journey version 1 through parseJourney. Existing handshake messages and 45-second expiry remain unchanged. Fields: unavailable plus each stop's id, optional number, label, state (current/next/departed/upcoming), eta. Website selection remains independent of that snapshot. No raw GPS is processed.

Read-only sibling source inspection shows public-presentation.js projecting getNormalizedLiveState currentStop, nextStop and lastDeparted; no full per-loop visited history. Stop 1 arrival suppresses old departure projection. Each website update replaces the snapshot; it never accumulates visited stops. Green/check indicates only the upstream-confirmed departure, labelled **Departure confirmed**, rather than claiming unsupported full-loop completion. Red/van and blue/next render only fresh valid snapshots. Stale/unavailable states remove operational highlights and ETA.

The 9 October deployment evidence records no validated production journey snapshot. During this task the hosted iframe showed tracking temporarily unavailable and an old update, while the website fixture composition stayed neutral. No fresh moving-vehicle end-to-end acceptance is claimed. The actual local /route reported missing PUBLIC_OPERATOR_ID, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY and had no configured stop content available; full-page layout acceptance therefore used the existing development RouteJourney fixture.

## Minimal read-only adapter proposal (not implemented)

Extend the independent map's existing presentation message only after separate approval and confirmation that backend values exist: version 2, loopId, observedAt/expiresAt, currentStopId, nextStopId, completedStopIds and availability. Stable IDs must come from the authoritative backend; no website coordinate detection or browser-accumulated history. Forward on the existing subscription/presentation heartbeat, with existing origin/source validation and no new polling, writes, tables or cron. On a new loop ID replace completed IDs atomically; expired/disconnected data renders neutral. If the backend cannot supply completion history, keep the honest departure-only presentation until an upstream decision is made. Releasing/authorizing the missing hosted journey bridge is also a separate task; do not infer state by scraping iframe text.

## Layout and interaction evidence

Chrome at 320/375/390/430/768/1024/1440 px: isolated rail and full RouteJourney composition had no page-level overflow. Photos measure 68/71/74/82/84/104/104 px including rings. Phone rail shows approximately 2.5 stops; tablet four with native scrolling; desktop all five evenly spaced. Minimum card width exceeded 115 px; height exceeded 44 px. Long destination names wrap without overlap; all fixture images loaded and circular cropping inspected. Segment centers align with the circle centers. Tablet horizontal scrolling preserves readable long labels.

Keyboard Enter opens existing details; Escape closes and restores focus. Selection leaves operational states unchanged. Show on map scrolls to the existing map and retains one iframe; upstream marker pan acknowledgment was not available. A late next-stop fixture automatically scrolled into view; scrolling back reached scrollLeft 0. Auto-scroll runs only when the target ID changes and is outside the rail viewport, so heartbeats/rerenders do not reset user scrolling. Reduced motion uses instant scrolling; no pulse animation added. Native physical-device touch, screen reader and dark-theme acceptance were not separately tested (the public site currently uses its existing light theme).

Screenshots (synthetic states and editorial fixtures, not production GPS):

- /private/tmp/stops-classic-modern/parked-390.jpg
- /private/tmp/stops-classic-modern/parked-1440.jpg
- /private/tmp/stops-classic-modern/next-390.jpg
- /private/tmp/stops-classic-modern/route-390.jpg
- /private/tmp/stops-classic-modern/route-1440.jpg
- Geometry: responsive.json and route-responsive.json in the same directory.

## Performance and release

No new subscriptions, backend requests, GPS provider calls, writes, cron, timer or carousel/animation dependency. Existing schedule refresh and iframe heartbeat remain intact. Added effect depends on the authoritative target ID, not snapshot identity. Image optimization uses the existing Next.js pipeline; no measured network/performance benchmark claimed.

Lint, TypeScript, 37 component tests and 141 integration tests pass. Local optimized production build passes; logs under /private/tmp/stops-{components,integrations,build}.log. The npm tsx CLI initially encountered sandbox IPC restrictions; equivalent node --import tsx test runs passed. No database tests were needed for this presentation-only change.

Presentation is ready for owner review and a separately approved deployment with neutral live fallback. Complete-loop green progression is **not ready** until authoritative history and the hosted bridge are available. Production config, actual CMS image availability and physical-vehicle transitions must be verified in that coordinated release. No deployment was performed.

## Publication authorization and clean candidate

Owner explicitly requested publication on 11 October. Isolated release based on production 6a4f9e8 preserves the Tour removal and excludes unpublished analytics. Clean locked install, lint, TypeScript, optimized production build and all 385 regression tests pass: 39 components, 17 identity, 140 integrations, 165 database and 24 PostgreSQL concurrency. No data/configuration changes. Hosted publication follows successful CI and Preview.
