# Homepage Hero V2 - 2026-09-24

## Implemented

- Existing homepage hero replaced by a fluid full-screen composition: `min-height:100svh` with `100vh` fallback, natural content growth on short screens, full-cover image, restrained left/top/bottom contrast gradients, equal-height text-only CTAs and centered scroll marker.
- Homepage header is transparent over the image, becomes the existing `--ss-primary` color when at most 20% of the hero remains in the header-adjusted viewport, and remains fixed without adding layout height. IntersectionObserver is tied to hero geometry; no scroll-event loop. Internal pages retain solid headers. Reduced-motion disables the color transition.
- One route resolver drives desktop and mobile active navigation. Exact routes, nested families and configured anchors are distinguished; current state comes from pathname/hash, including hashchange/popstate. Home is a structural route with an editable label. Yellow underline uses `--ss-yellow`.
- Existing desktop/mobile image fields retained. Next image responsive srcsets are used through one picture element, with eager/high-priority LCP image, no duplicate desktop/mobile preload. Existing upload/optimization pipeline retained. Separate nine-position desktop/mobile focal selectors added. No new media system.
- Header's old default `Book now` becomes `Book your day`; custom labels are preserved. Existing hero text/image values are preserved.

## Amenities ownership and editing

Website content > Homepage > Hero amenities, immediately after Hero.

Add/remove, edit title/description, publish checkbox, visual allowlisted icon selector, numeric ordering and Move up/Move down. Save Draft stages the whole list; Preview renders saved drafts; Publish makes the list live. Discard cancels unsaved changes. Removal affects only this presentation list when published.

Reuse the existing flat structured `content_pages` website record: `hero.amenities` is validated serialized JSON, rather than creating a parallel table. Each item has id, icon, title, description, published, display_order, created_at and updated_at. Client and database validate shape, strings, timestamps, order, unique IDs and icons. No arbitrary HTML/icon markup. Up to 50 entries / 30,000 serialized characters is an editorial safety limit; layout is not tied to eight items.

Published items alone render. Zero hides the area entirely. Desktop flex wrapping balances available width; mobile uses two columns and allows full titles to wrap. Icons are decorative with visible text. Amenity statements are marketing copy, never inputs to booking price, schedule, capacity, GPS, route or stop logic.

No service claims were seeded as published facts. The actual list starts empty. Owner can add approved highlights. Synthetic examples are confined to `/dev/hero-preview`, disabled outside development.

## Database

`20260924000400_homepage_hero_v2.sql` applied to sightseeing-shkodra-dev. Additive fields preserve existing draft/published values. Existing scoped service-only save RPC, role check, optimistic concurrency, audit logging and publication model remain. No new tables, no deleted content/media, no operational schema changes.

## Validation

- Database: 106/106 with bounded test concurrency. Initial unconstrained run exhausted native worker resources in two files; isolated retries passed, then full bounded run passed.
- Integration: 42/42. Identity: 15/15. Lint, typecheck and production build passed.
- CMS draft/save/publish/shared public-render proof: 138/138, including amenities and focal styles. Historical report's 134 count predates these four additions.
- Dedicated tests: amenity mutation lifecycle, publication isolation, unchanged product pricing, invalid payloads/focal values and route matching.
- Actual homepage plus eight-amenity development fixture checked at 1920x1080, 1600x900, 1440x900, 1366x768, 1280x720, 1024x768, 768x1024, 430x932, 390x844, 375x812, 360x800, 320x568: no measured horizontal overflow or clipped amenity items. Short 320px screens grow vertically intentionally; eight-amenity 1024x768 preview also slightly grows.
- Counts 0,1,2,3,4,5,6,7,8,9,10,12 rendered with exact item counts; zero has no list.
- Browser verified transparent top state, solid scrolled refresh, Home/Tour/Route/Explore/Live/FAQ active states, internal solid headers, mobile menu, icon selection and discard. Back/forward between Explore and Tour passed after waiting for the matching route state; refresh and pure route resolver checks also pass. Nested guide matching is covered by tests; current long-form guide URLs remain unpublished.
- Actual GPS/ETA freshness and physical mobile Safari/Android devices were not tested. Desktop browser emulation is not a physical-device certification. No map or booking behavior changed.

## Main changed files

`homepage-hero.tsx`, `homepage-view.tsx`, `booking.tsx`, public.css; `hero-amenities.ts`, `navigation.ts`, `website-schema.ts`; admin `hero-amenities-input.tsx`, `hero-amenities.module.css`, `website-editor.tsx`, `website-workspace.tsx`; `amenity-icon.tsx`; next.config.ts; additive migration; development hero preview; tests and CMS field-proof script.
