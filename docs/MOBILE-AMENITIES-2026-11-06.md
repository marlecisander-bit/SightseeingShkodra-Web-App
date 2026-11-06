# Responsive mobile homepage adjustments — 6 November 2026

Implemented on work/mobile-amenities-20261106 in the existing repository under the previously authorized folder exception. The subsequent PUBLISH CHANGES request authorizes release through the existing PR/main/Vercel integration. Initial local validation is recorded below; unrelated local edits remain excluded. No CMS/backend or independent Live Map change.

## Changes

- Phone headline and subtitle move down together by a viewport-aware17–24px. Carousel gap compensates for the added copy spacing. Short screens use smaller bottom padding with safe-area protection. Header/logo/menu/language/wording/colours remain unchanged.
- Photos adapt to both viewport width and height, from128px to208px; object-fit retains proportions. Padding scales between12–14px and gaps between6–9px, based on width/height, with a compact short-screen override. Cards remain88vw with existing snapping, next-card preview and pagination. Equal heights and aligned price/booking rows remain; spare space sits above the amenity group rather than between amenities and price.48px booking targets stay intact.
- Removed the standalone audioguide label. ProductAmenities receives the same productFeatureBadges result used by desktop: same enabled CMS features, custom icon choices, labels and presentation order. No second mobile content list or CMS control. The illustrated product begins Multilingual audioguide, Full-day ticket, Air conditioned. Other products retain their shared desktop order.
- Compact widths up to375px or viewport heights up to740px show the first two. Larger phone layouts measure the actual wrapped badge heights, remaining card space, price/button area, pagination and safe-area padding; they reveal more only within that budget. Badges wrap naturally with no ellipsis or line clamp. Current English data fits all8/6 on the two larger requested sizes; no redundant All amenities link is shown there.
- Where needed, All amenities opens a native modal bottom sheet, following the existing app's dialog pattern. Every real feature/icon is listed. Named dialog, product description, initial/contained keyboard focus, Escape, Close and backdrop dismissal, internal scroll and focus restoration are supported. Resizing after dismissal recalculates the count and moves focus to View details if the disclosure is no longer needed. Carousel position is unchanged and booking does not start.
- View details retains the CMS description and reservation information. Its duplicated amenity list moves to the dedicated amenities disclosure. Booking links, state and APIs remain untouched. WhatsApp clears the new trigger and is hidden by the existing open-dialog rule. Its observer now responds when amenity count/disclosure visibility changes.

## Evidence and validation

Actual published CMS fixture: docs/evidence/booking-publication-20261104/published-cms-snapshot.json, previously checked against production during today's publication. Inspection covered hero source/crop, ProductCarousel, shared desktop helper, CMS product feature selection/icon editing, both actual products and native dialog patterns. The previously supplied approved homepage mockup is retained in docs/evidence/mobile-homepage-20261106/approved-mockup.png. No new mockup price or invented product information used.

Chrome/CDP with the shared production components and CMS fixture, in a temporary development-only route. No privileged credentials or real checkout mutation; checkout endpoints blocked during browser tests. The temporary route is removed before final checks and archived as harness-page.tsx.txt.

| Viewport | Headline moved down | Visible amenities (product1 /2) | Pagination bottom |
| --- | ---: | ---: | ---: |
| 360×740 |23.2px |2 /2 |719.1px |
| 375×667 |17.4px |2 /2 |662.8px |
| 390×844 |24px |8 /6 |792.5px |
| 430×932 |24px |8 /6 |808.6px |

PASS: all four portrait sizes show complete first card,48px booking button and pagination; landing section fits the viewport. Both cards and their price/button rows align; measured amenity-to-price gap is at most12px. No document horizontal overflow. Landscape568×320 and844×390 allow normal vertical scrolling; following sections stay accessible.

PASS: desktop/tablet600×900,768×1024,1280×800 and1440×900 screenshots are pixel-identical before/after (zero differing pixels).

PASS: both products' full lists match the shared inline list exactly, including every icon. Keyboard Enter/Tab/Escape, Close, backdrop dismissal, short-screen list scroll (including keyboard Page Down in a named, focusable scroll region), unchanged rail position and restored focus/scroll verified. Resizing the open sheet from375×667 to430×932 restores a visible focus target when all amenities fit inline. No standalone category label and no duplicated list in View details.

PASS: long-label stress at390×844 reduces counts to4 /2, with no truncation or horizontal overflow. Long sheet labels remain scrollable. These are synthetic Italian-length strings, not an added translation system.

PASS: native swipe/pagination, View details, four-product stress,200% text stress,20 booking open/close cycles with unchanged background geometry and focus/scroll restoration, and WhatsApp clearance around price/book/details/pagination/All amenities. No checkout requests.

PASS: a synthetic no-selected-amenities card preserves price/button alignment and has no horizontal overflow.

PASS: final npm run check (lint, TypeScript, normal Turbopack production build) and all 678 tests, zero failures. Logs: final-check.log and final-tests.log, both exit 0.

## Verification limits

The existing product label source and language indicator are English-only; real language switching is unavailable. Synthetic longer-label and enlarged-text layouts were tested. Physical iOS/Android devices, real Safari/Firefox, screen readers, OS browser-toolbar/safe-area behavior and actual reservation/payment submission remain unverified. Hero/card composition changes stay below the established600px boundary. Short wide landscape with a coarse pointer also uses the compact amenity list/sheet; desktop and normal tablet layouts are unchanged.

Artifacts: docs/evidence/mobile-amenities-20261106/. Browser scripts and geometry/acceptance JSON are retained with before/after screenshots, expanded amenities and long-label screenshots.

Publication preparation: fresh npm ci, normal npm run check, all 678 tests and production dependency audit pass with zero production vulnerabilities. Evidence: docs/evidence/mobile-amenities-publication-20261106/release-check.log.
