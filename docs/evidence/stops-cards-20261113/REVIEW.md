# Homepage and map stops redesign — local review, 13 November 2026

No push, deployment, database write or hosted configuration change was performed.

## Implementation

The homepage reused circular stop portraits and automatically highlighted the first editorial selector. It now uses an opt-in landscape card presentation in the existing selector/portrait components. Five desktop columns, three tablet columns and an 82%-width mobile snapping rail retain CMS image URLs, alt text, destination names and links. The requested five captions are presentation copy. The initial view has no selected destination or oversized detail panel; selecting a card retains the existing destination details and map links. Arrow keys, Home/End and touch gestures remain supported.

The exact Find Van SVG is shared through MapVanIcon, using a crimson alpha mask inside the existing pale-yellow wrappers. The map vehicle marker and command controls are unchanged. Homepage status remains visible on mobile and uses validated freshness before current-location or LIVE claims; historical observations use Last known stop, route-only sequence uses Next on route, and unreliable estimates use ETA unavailable.

The existing compact map panel is retained, with only its icon implementation shared. The mobile disclosure and stop-command contract are unchanged.

The companion drawer previously inherited 46px circular marker geometry. Its scoped drawer styles now use 104×76 desktop / 88×68 mobile photos with 10px rounding, inset numbered badges and a two-column compact row. Update age is a smaller separate line. Map marker styles, photos, order, status projection, click handler, close, scrolling and keyboard focus management are preserved. Only frontend presentation files were edited in the companion.

## Verification

- Web App: 198 component tests, lint, typecheck and Webpack production build pass.
- Companion: existing frontend suite passes, including presenter, freshness, controls, bridge and route-policy tests.
- Chromium and WebKit at 320, 390, 768 and 1440px: five cards, responsive rail/grid, keyboard selection, long destination names, missing-image fallbacks, drawer scrolling/select/close and no drawer horizontal overflow. See check.mjs/results.json and screenshots.
- Integrated local candidates through browser-only canonical-origin proxies: mobile route disclosure moves the existing iframe without recreating it; Leaflet canvas equals its container after collapse/expansion and responsive changes. Stop selection opens popup; Find Van, Find Me (synthetic browser location), Route, Stops, Interact/Done and Reload pass. See map-check.mjs/map-integration.json.

## Review images

- Homepage: home-chrome-1440.png, home-webkit-390.png.
- Panel with integrated map: result-1440.png, result-390.png.
- Drawer: drawer-chrome-1440.png, drawer-webkit-390.png.
- Additional long-name/fallback images cover both engines and all four widths.

## Limits

Physical iPhone Safari/Chrome was not connected; WebKit is browser-engine coverage. Homepage screenshots use the existing development review fixture and its saved public CMS destination photos; the local root homepage did not expose the route section under its current environment, so its independent read attempt timed out (home.log). No live booking was submitted. Existing unrelated dirty work in both repositories is preserved. This change does not claim to resolve previously recorded global-navigation or guest-review hydration issues.
