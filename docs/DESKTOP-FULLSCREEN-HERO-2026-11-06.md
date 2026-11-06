# Desktop fullscreen hero — 6 November 2026

Implemented on work/desktop-fullscreen-hero-20261106 in the previously authorized existing folder. The subsequent publish request authorizes release through the existing PR/main/Vercel workflow. Initial local evidence is recorded below; unrelated local edits remain excluded.

## Change

Only src/components/public/homepage-hero.module.css changes application behavior. At the existing desktop composition boundary (1024px and wider), the composed hero visual has a border-box minimum height of100vh, then100svh/100dvh where supported, and uses flex centering for the existing headline/product grid. The image already covers the entire visual through its absolute media layer and object-fit:cover. Its existing CMS desktop photograph, focal configuration, responsive source selection, darkening/softening and foreground card layout remain intact.

The minimum height permits natural growth when the cards need more room on short windows; nothing is clipped or forced into a fixed-height panel. On900/1080/1440px-tall tested desktop windows the hero exactly fills the viewport. On shorter laptop windows, existing card content can make it taller, and the page scrolls normally. The following section remains in normal flow. No mobile/tablet styles, content, pricing, booking logic, dependencies or infrastructure change.

## Validation

Native Chrome/CDP review used the actual published CMS fixture and shared components through a temporary development-only route, removed before final checks.

- PASS: desktop1024×768,1280×720,1366×768,1440×900,1920×1080,2560×1440 and short1440×600. Hero covers at least the usable viewport; media covers its whole height; no page horizontal overflow; following content and booking controls remain accessible.
- PASS: mobile390×844/430×932 and tablet768×1024 retain identical hero/headline/header/card/button geometry. Primary content screenshots are identical; differences in the narrow next-card image previews are confined to lazy-image raster/resolution variation. Comparison artifacts retain this distinction rather than claiming whole-frame identity.
- PASS:16 booking open/close cycles across both products at1280×720,1440×900,1920×1080 and1440×600 retain identical hero/image/header geometry and restore scroll/focus. Existing mobile swipe, pagination, enlarged text and long/future content stress also pass. Zero checkout requests.
- PASS:174 existing component tests; npm run check (lint, TypeScript and normal Turbopack production build); git diff --check.

## Evidence and limits

Evidence: docs/evidence/desktop-fullscreen-hero-20261106/, including before/after screenshots, layout-acceptance.json, browser-review.mjs, booking-review.mjs/interactions.json and check/components logs. Screenshot: after-home-1440x900.png and after-home-1920x1080.png. No real reservations/payments/communications. Physical devices and Safari/Firefox remain unverified; Chrome viewport emulation is not physical-device testing.

Publication preparation: fresh locked npm ci, normal npm run check, all 678 tests and production dependency audit pass with zero production vulnerabilities. Evidence: docs/evidence/desktop-fullscreen-publication-20261106/release-check.log.
