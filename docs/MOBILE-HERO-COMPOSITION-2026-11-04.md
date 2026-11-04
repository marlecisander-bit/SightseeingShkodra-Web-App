# Mobile homepage composition — 4 November 2026

Implemented locally, without commit/push/deployment. Existing local mobile-booking work and unrelated edits preserved.

## Implementation

`src/components/public/homepage-hero.module.css` changes only the existing phone breakpoint (max-width599px):

- Replace the fixed 64–150px gap with a flexible column and 24px minimum content gap. The carousel's automatic top margin consumes available space.
- Give the photographic visual a border-box minimum height of 100svh, with 100vh fallback. Padding includes the existing measured header offset and existing safe-area insets once. There is no fixed hero height or text/carousel absolute positioning.
- Extend the existing single CMS picture to the entire hero height, behind cards and pagination. Keep its existing mobile focal point, no blur, subdued overlay and stronger bottom fade. Foreground content remains opaque and sharp.
- Short/landscape/enlarged content increases natural section height; the following section remains in normal flow.

`src/components/public/product-booking-cards.module.css`: let the mobile price/details row wrap as flex items and keep the amount unbroken. Chrome 200% text enlargement exposed a split decimal amount in the original grid; the correction preserves ordinary card presentation while putting details on another row when needed.

No new JavaScript layout calculations, images, dependencies, CMS content changes or booking changes. Image source selection, responsive pipeline, dimensions, product selection, pricing, booking/focus/scroll lock and existing WhatsApp clearance remain shared.

`scripts/check-mobile-hero-composition.mjs` adds a focused regression check against real browser geometry: required widths, page containment, whole-hero photograph, normal-flow next section, copy/card separation, 44px booking target, and proportional tall-screen placement. Run with `node scripts/check-mobile-hero-composition.mjs docs/evidence/mobile-composition-20261104/after-layouts.json`.

## Browser validation

Installed Google Chrome, CDP touch/viewport emulation and native input, with actual published CMS product/content/image snapshot. Temporary development-only harness supplied the existing components and WhatsApp with a normal-flow following section. It was removed before final checks. All checkout network requests were blocked by a safety guard; no checkout request occurred and no real bookings/payments/emails were created.

- PASS: 320×568, 360×640, 375×812, 390×844, 430×932, short390×480, landscape568×320, tablet768×1024, desktop1280×800 and1440×900. No horizontal document overflow; whole-hero photo and normal-flow following section verified at all phone sizes. Tall-phone cards/pagination sit toward the bottom within the first screen; short screens grow and scroll.
- PASS: native touch swipe through the real two-product carousel, actual active dots, all-product pagination, keyboard Enter activation, visible focus and44×44 pagination targets. Four-product future-CMS and long expanded details were explicit layout stress scenarios, not claimed as published content.
- PASS: 200% text-size stress, unbroken price, reachable Book action, long title/details and four-product carousel; no horizontal page overflow. Reduced motion enabled during testing.
- PASS: WhatsApp clears booking actions and dots at five scroll positions. Existing docking logic reused.
- PASS:20 open/close cycles, both products,390×844,375×812,390×480,568×320 and1440×900. Hero/image/header rectangles, crop and selected image source unchanged before/during/after; exact scroll and trigger focus restored. Fresh navigation per emulated device avoids Chrome's transient text-autosizing state after switching mobile/desktop modes.
- PASS: tablet768px and desktop1280/1440 before/after geometry and screenshots unchanged (pixel-identical).
- PASS: fresh678 tests, lint, TypeScript and normal production build; geometry regression checker passes10 viewport records.

Chrome DevTools MCP also inspected the live local page:390×844 hero/photo both844px high, no overflow, expected overlay gradient. At375×812, pagination button44×44, visible outline and native Enter selected the Loop Tour. The MCP screenshot writer rejected this repository path as outside its configured roots; screenshots were captured through the installed Chrome CDP review runner instead.

## Remaining verification limits

The user said the mockup is in the ChatGPT Mac app. Computer Use inventory identifies it as `com.openai.codex`; attempting to read it returned: “Computer Use is not allowed to use the app 'com.openai.codex' for safety reasons.” No new image attachment or accessible image path/link was available. Exact comparison to that mockup is UNVERIFIED; composition follows the written specification and existing approved hero/card design. A shared link/local image path was requested.

No actual Safari/iOS, Android device, hardware keyboard/browser-bar animation or notch/safe-area device testing was available. Chrome emulation is not real iPhone verification. Safe-area padding and stable small viewport units are implemented, but physical-device acceptance remains UNVERIFIED.

## Evidence

`docs/evidence/mobile-composition-20261104/`: browser-review.mjs, interactions.mjs, baseline/after-layouts.json, interactions.json, desktop-comparison.json, keyboard.json, check.log, tests.log, and archived harness-page.tsx.txt.

Screenshots: [375px](evidence/mobile-composition-20261104/after-home-375x812.png), [390px](evidence/mobile-composition-20261104/after-home-390x844.png), [short screen](evidence/mobile-composition-20261104/after-home-390x480.png), [200% text](evidence/mobile-composition-20261104/interaction-200-percent-text.png), [long expanded content](evidence/mobile-composition-20261104/interaction-long-card-content.png).
