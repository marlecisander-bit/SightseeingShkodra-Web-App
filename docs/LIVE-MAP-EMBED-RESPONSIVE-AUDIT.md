# Live Map embed and responsive audit — 26 September 2026

## Current architecture
One independent application in the sibling **Sightseeing Shkodra Map App** owns live-map.html, js/live-map/* and css/live-map/*. The website consumes its Netlify live-map.html through LiveMapEmbed. No map/tracking code is copied into React. Changes are local, NOT deployed. Both repositories had unrelated pending changes; those were preserved.

## Embed locations and initial audit
All iframes are width:100%. Heights below describe original rules.

| Location | Method | Desktop | Tablet | Mobile | Problem / recommendation |
| --- | --- | --- | --- | --- | --- |
| / homepage | HomepageView → LiveMapEmbed | Half content grid; clamp(520px,75svh,820px) tall | Two columns until mobile breakpoint | Stacked, same 520px minimum | Excessive preview height; use container-sized preview |
| /tour#tour-live | TourView → same iframe | Content width, same height | Available width | Same minimum | Shared compact presentation |
| /your-day | Same iframe | Companion content width | Available width | Stacked width | Shared compact presentation |
| /live | LiveView → same iframe | clamp(340px,62svh,680px) | Same height rule | Same height rule | Full controls, responsive internal layout |
| Admin website-preview | Shared HomepageView/TourView | Preview content width | Available width | Shared layout | Automatically consumes shared fix |
| /dev/cms-reconciliation | Three shared views | Three intentional previews | Same | Same | Development-only multi-map fixture |
| Standalone live-map.html | Authoritative Leaflet app | Viewport | Viewport | dvh/visualViewport | Preserve fullscreen, handle short height |

Confirmed issues: excessive preview minimum height; no explicit presentation intent; fullscreen controls squeezed into tiny frames; historical mobile control-position overrides; internally scrolling status card; fixed 150/130px route-camera padding. Existing ResizeObserver was present and extended/replaced, not duplicated. Iframe media queries already use iframe width rather than parent browser width.

## Changes made
Website files:
- src/components/public/live-map-embed.tsx: explicit full/compact presentation prop and URL parameter, preview interaction gate, rounded viewport wrapper. Loading priority remains separate.
- src/components/public/live-map.module.css: container-relative preview height, scroll surface, responsive interaction controls.
- src/components/public/editorial-pages.tsx: /live explicitly requests full presentation.

Independent map files:
- live-map.html: loads two presentation assets.
- css/live-map/responsive-presentation.css: container-aware status/control/marker sizing, wrapping and safe-area spacing. Canvas reserves space outside status/navigation.
- js/live-map/responsive-presentation.js: single observer measures app/card/control geometry, invalidates Leaflet and retains follow-van recenter behavior. Cleanup on non-persisted pagehide.
- js/live-map/start-live-map.js: replaces only the old resize observer block. Startup, subscriptions and polling unchanged.
- js/live-map/display-full-route.js: visual fitBounds padding is 24px because the canvas already excludes chrome. Route geometry/order unchanged.

## Display modes
FULL: wide/tall dedicated map; status, van, route, stops and all four controls.
COMPACT: website preview or narrow/short full viewport; smaller card with same essential status and controls.
MINI: preview narrower than 340px or shorter than 300px; status/next stop, smaller van illustration and full-map link; hides detailed ETA row and four-button bar. Dedicated narrow maps retain controls.
All modes consume the same authoritative state.

## Mobile
Existing text-then-map stacking retained. Preview height clamp(320px,90cqi,500px), short landscape clamp(280px,75svh,400px). Fallback actions wrap/stack. Map buttons have 48px targets. Preview starts scroll-safe with pointer events disabled and iframe removed from keyboard sequence; Interact with map enables it, Done interacting restores scrolling. Dedicated map remains interactive. Existing mobile zoom-button hiding retained; library pinch/keyboard behavior unchanged when enabled.

## Iframe
Same authoritative host/project plus presentation parameter. Parent owns height; child measures its viewport. No new postMessage protocol or relaxed origins. Existing use-map-status checks exact origin, iframe window, payload type/version/length; child only responds to configured parent origins. Existing heartbeat/listeners unchanged.
Iframe onLoad still means document load, not GPS-ready/tile success. Existing slow-loading/reload/direct-open recovery retained. Reload intentionally remounts only the iframe. Geolocation delegation and referrer policy unchanged.

## Performance
One Leaflet instance and the same map object observed throughout resize/visibility checks. No new service requests, subscriptions, Scorpion calls or engines. The existing development reconciliation page intentionally renders multiple previews.

## Tracking regression
No GPS ingestion, Scorpion integration, database, route sequence, Stop 1 reset, stop/ETA calculations, Realtime architecture or worker changed. Coordinates untouched; only camera/drawing area changes. Pre-existing changes in the map repository were preserved.
Tests hold project initialization pending and block backend calls. These are presentation fixtures, not an on-road tracking test.

## Screenshots
Synthetic local status and marker fixtures, not claims about live coordinates.

- [Desktop](../private/map-1440x900.png)
- [Tablet](../private/map-768x1024.png)
- [390px mobile](../private/map-390x844.png)
- [360px mobile](../private/map-360x640.png)
- [Mobile landscape](../private/map-844x390.png)
- [Constrained desktop](../private/map-constrained.png)

## Remaining issues
- Physical iOS/Android one-finger scrolling, pinch/double-tap, notches and dynamic browser bars require device acceptance; desktop emulation is not physical-device proof.
- No live GPS/ETA road test was run. Third-party tile availability is not guaranteed; fallback remains.
- Authenticated CMS preview was inspected through shared component code, not an authenticated browser session.
- Root typecheck fails in a pre-existing nested private copy (missing credits.json and consequent implicit-any). Isolated app typecheck/build pass. Root configuration was not changed to hide this.
- Both applications need their normal separate frontend build/deploy to publish the complete result. Ordinary localhost still consumes the deployed map; local map assets were verified through browser test interception. No database deployment needed; nothing published.

## Test matrix
Local Edge/Chromium; actual website components and local authoritative map assets with synthetic status/route/marker fixtures. No hosted writes.
Additional PASS: 450px embed in 1440px browser, 450→280→600→350 resizing, hidden→visible, unchanged map identity, Leaflet canvas dimensions, follow-van centering, long name wrapping, Stops open/close, interaction gate and iframe tab order.
Standalone PASS: 390×844, 844×390, 768×1024, 1024×768, 1440×900.
Lint, JavaScript syntax, isolated typecheck and production build PASS. Root typecheck failure described above.
Local scripts/evidence: private/test-map-responsive.cjs, private/test-map-interactions.cjs, private/test-map-standalone.cjs, private/map-responsive-results.json. Run from website root with localhost:3000 and sibling Playwright runtime.

| Viewport | Homepage | /live |
| --- | --- | --- |
| 320 x 568 | PASS | PASS |
| 360 x 640 | PASS | PASS |
| 375 x 667 | PASS | PASS |
| 390 x 844 | PASS | PASS |
| 393 x 852 | PASS | PASS |
| 412 x 915 | PASS | PASS |
| 430 x 932 | PASS | PASS |
| 768 x 1024 | PASS | PASS |
| 820 x 1180 | PASS | PASS |
| 1024 x 768 | PASS | PASS |
| 1280 x 720 | PASS | PASS |
| 1366 x 768 | PASS | PASS |
| 1440 x 900 | PASS | PASS |
| 1920 x 1080 | PASS | PASS |
| 844 x 390 | PASS | PASS |
