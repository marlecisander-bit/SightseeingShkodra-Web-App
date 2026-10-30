# Homepage overlap — local presentation change, 30 October 2026

Local only. No commit, push, merge, deployment, database change or CMS schema change.

Removed the hero experience CTA, Track live / Discover your day / About your day strip and visible product-section heading. The product section retains its accessible name and screen-reader heading. Cards use opaque white backgrounds, rounded corners, subtle shadows and a normal-flow responsive negative margin. Hero-hidden layouts do not receive the overlap. Mobile hero copy starts higher, above the van. Original photo sources, logo, typography, product data, price logic and product-specific booking destinations remain unchanged. WhatsApp clearance now includes product prices and booking links, including consecutive obstacles.

## Local verification

Chrome responsive emulation used the real homepage components with a read-only snapshot of published public content and products. No hosted writes or real bookings. Temporary preview route was removed after testing; its local fixture/tooling is retained only under ignored `private/`.

| Width | Overlap | Columns | Horizontal overflow | Heading/subtitle clear | Booking controls contained |
| --- | --- | --- | --- | --- | --- |
| 375 | 24px | 1 | 0 | Yes | Yes |
| 390 | 24px | 1 | 0 | Yes | Yes |
| 768 | 40px | 1 | 0 | Yes | Yes |
| 1024 | 64px | 2 | 0 | Yes | Yes |
| 1440 | 64px | 2 | 0 | Yes | Yes |

Both links retain `/book?productId=…` with the published daily-ticket and loop-tour IDs. Component tests verify separate product links, accessible section naming, hidden heading and existing isolated booking state. Native Chrome confirmed visible keyboard focus on the daily-ticket booking link and WhatsApp clear of visible price/booking controls. Complete manual Tab traversal was limited by native browser focus interruptions; no claim of full screen-reader or real-device validation. Existing semantic anchors and their tab behavior were preserved.

`npm run test:components`: 151/151 pass.
`npm run check`: lint, typecheck and production build pass.
`git diff --check`: pass.

`npm run test:cms-verification`: fails its existing all-active-fields-render requirement for exactly `hero.description`, `hero.track`, `hero.discover`. Those CMS fields are retained unchanged, while their public consumers were explicitly removed by this request. This is an outstanding CMS inventory/editor reconciliation, not a booking or build failure. No schema change was made to hide the discrepancy.

Screenshots captured through Chrome's native device toolbar: `screenshots/homepage-overlap/desktop-1440.png` and `screenshots/homepage-overlap/mobile-390.png`. Full-page screenshots use a fixed header/contact at capture-time positions. Screenshots show a read-only content snapshot; production prices continue to use the existing runtime logic.

Pre-existing untracked publication receipts were preserved.

## Publication follow-up

The owner subsequently authorized publication. Release preparation retires only the three obsolete controls from active admin inventory, preserving every stored schema field/value. Explicit public probe cases now match the active inventory; full CMS verification passes and historical compatibility remains covered. Full npm test passed 633 tests before an additional focused retirement regression passed (634 total current cases). Lint, types, production build and production dependency audit pass. This supersedes the earlier CMS-gate limitation and local-only release boundary; manual/device limits remain.
