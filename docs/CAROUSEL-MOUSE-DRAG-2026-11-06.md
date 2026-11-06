# Product carousel mouse dragging — 6 November 2026

Local implementation only. No commit, push or deployment.

The owner chose to keep both current desktop cards fully visible. Existing card dimensions and layout are preserved: mouse dragging moves the rail only when its content overflows (for example narrower windows or additional published products). A fully fitting two-card desktop rail has no scroll distance.

The existing native carousel now supports primary mouse dragging from non-interactive card surfaces, a movement threshold, horizontal intent detection, grab/grabbing cursors and nearest-card snapping. Document listeners and blur cleanup support releases outside the rail. Drag-generated clicks are suppressed; ordinary booking/details/amenities clicks, keyboard controls, pagination, arrows, RTL and native touch scrolling remain available. CMS, pricing, booking APIs and card content are unchanged.

## Verification

- Installed Chrome native mouse/touch input: two cards remain fully visible at 1440×900; overflowing two-card rail at 900×900; four-card fixture at 1440×900; mobile touch at 390×844; narrow card actions at 375×667.
- Drag movement and snapping, release outside the rail, release over a booking button without booking, normal booking click after dragging, details, amenities, pagination keyboard use, previous/next buttons, small movements, blur cleanup and RTL passed. No page-level horizontal overflow.
- Zero checkout requests; no real bookings or cloud changes.
- npm run check passed (lint, type checks, production build); npm run test:components passed all 174 tests.
- Temporary browser fixture removed after testing. Physical devices, Safari and Firefox were not verified.

Evidence: [acceptance results](evidence/carousel-mouse-drag-20261106/drag-acceptance.json), [browser script](evidence/carousel-mouse-drag-20261106/drag-review.mjs), [narrow desktop screenshot](evidence/carousel-mouse-drag-20261106/review-mouse-narrow-desktop.png), [additional products screenshot](evidence/carousel-mouse-drag-20261106/review-mouse-additional-products.png), and check/component logs in the same evidence directory. Additional products are test fixtures using existing product data, not CMS edits.
