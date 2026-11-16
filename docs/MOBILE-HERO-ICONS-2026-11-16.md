# Mobile hero and amenity icons — 16 November 2026

Implemented locally on work/mobile-hero-icons-20261116. No push, PR update, merge, deployment, hosted data, DNS or configuration change. Earlier SEO work and unrelated local changes are preserved.

## Implementation

The phone hero uses a natural minimum of 100dvh minus the measured winter ribbon, with 100svh fallback, safe-area padding and the existing header-height observer. The ribbon now has its real flow height instead of a zero-height overlay frame. Header, heading and approved copy remain unchanged. The photograph and overlay cover the hero, including any space remaining below the carousel; content may extend the hero on short landscape screens or with larger text. Page scrolling stays available.

Only phone media queries and touch landscape up to900px apply the new card styling. The active card retains88vw width and a next-card glimpse. Natural shared text rows keep both cards aligned without fixed outer heights or truncated titles/descriptions. Photos range from96–191px across the tested portrait sizes; compact screens use a shorter photo and70% vertical object positioning so the van stays visible. Mobile hero and card image transforms/animations are disabled. Desktop styles and the native carousel implementation are unchanged.

Up to six buttons come from existing published product feature badges and the existing icon library. All have44×44CSS-pixel targets, accessible names, expanded state and a tooltip relationship. Only one portal popover opens across all cards; same-button activation, outside interaction, focus leaving the group, Escape, scrolling or viewport resize dismiss it. Escape restores focus. Popovers are clamped to the visual viewport above the amenity row, clear of purchase actions. Active buttons use pale yellow. Duration remains visible text, the helper reads “Tap an icon to see what’s included”, and the existing complete amenities sheet is retained. Zero-feature products do not invent icons and keep their existing details control.

Existing actual prices, booking URLs, checkout/domain logic, product data and carousel gestures are unchanged. WhatsApp’s existing collision detection also clears amenity buttons/popovers, while retaining its safe-area bottom anchor.

## Changed files

- src/components/public/mobile-amenity-icons.tsx
- src/components/public/mobile-amenity-icons.module.css
- src/components/public/product-amenities.tsx
- src/components/public/homepage-hero.module.css
- src/components/public/product-booking-cards.module.css
- src/components/public/product-amenities.module.css
- src/components/public/whatsapp-contact.tsx
- src/components/public/seasonal-announcement.module.css
- src/app/dev/mobile-hero-review/page.tsx
- tests/components/mobile-amenity-icons.test.mjs

Also appended local evidence to docs/PHASE_STATUS.md and the owner’s mobile presentation amendment to docs/DECISIONS.md. No roadmap rewrite or database migration.

## Validation

- Full npm test:756pass,0fail,0skipped (202components,25identity,271integrations,223database,28PostgreSQL,7CMSverification).
- Added a React/JSDOM interaction test for published-feature limits, zero/one feature lists, toggle state, one popover across cards, accessible relationships, outside dismissal and Escape/focus restoration.
- Lint and type generation/TypeScript pass. Lint excludes only the pre-existing unused base variable in docs/evidence/seo-audit-20261116/resources.mjs; that audit evidence was not edited. Webpack production build passes. The previously observed local Turbopack dependency/placeholder stall was not re-investigated for this mobile-only task.
- Chromium:360×640,375×667,390×844,430×932,667×375 and844×390. The four portrait heroes end exactly at their viewport bottoms, with no white strip, header overlap, page overflow or clipped card content. All icon targets measure at least44×44. Landscape retains natural vertical scrolling rather than forcing a fit. See viewport-matrix.json.
- Width390 resized from740px to844px height: background continues covering the viewport. This simulates changing available space, not real mobile toolbar animation.
- Long product title plus200% root text sizing: hero grows to1355px; page scroll remains available, card content fits, no horizontal overflow, popover stays in viewport and above the booking action.
- Product feature counts0,1,3,7 display0,1,3,6buttons respectively. The complete list retains all published features.
- Real keyboard Enter opens a popover; Escape closes it and restores the triggering button’s focus. First/last-icon popovers stay inside the viewport with one popup and no overlap with booking.
- Menu opens/closes; existing booking action opens the calendar dialog and closes with scrolling restored. No booking/date/payment submission. All amenities opens the existing complete seven-feature list. Carousel indicators move to the second card and back using the existing native scrolling. Existing mouse-drag/booking regression tests pass. Physical touch swiping is not claimed.
- Desktop1440×900 loaded-image before/after screenshot comparison:0changed pixels; hero, heading and card bounding boxes also match exactly. Initial unloaded-image baseline was discarded as a visual comparison; the loaded baseline is retained.

## Screenshots and evidence

- [Compact375×667](evidence/mobile-hero-icons-20261116/compact.png)
- [Tall430×932](evidence/mobile-hero-icons-20261116/tall.png)
- [Landscape667×375](evidence/mobile-hero-icons-20261116/landscape.png)
- [Desktop baseline](evidence/mobile-hero-icons-20261116/desktop-before-loaded.png) and [desktop result](evidence/mobile-hero-icons-20261116/desktop-after-loaded.png)

The development-only /dev/mobile-hero-review fixture uses audit photographs and sample offers for layout/interaction checks, and returns notFound outside development. Product counts/long-title variants are fixture-only. No real product record was changed.

## Limitations

The referenced mockup was not present in the supplied message; the implementation follows the written requirements and existing approved visual language. Native Safari, physical touch devices, real expanded/collapsed browser chrome, notch/safe-area hardware and assistive-technology speech output were unavailable. CSS uses safe-area insets, modern viewport units and named native buttons, but physical acceptance remains appropriate. Live inventory/checkout completion was not exercised. This task remains local only; SEO draft PR91 was not updated with these mobile changes.
