# Mobile homepage — 6 November 2026

Implemented on work/mobile-homepage-20261106. User explicitly authorized the existing SightseeingShkodra-Web-App directory because the documented canonical directory is absent. The subsequent “publish the changes” request authorizes this mobile-homepage release through the existing PR/main/Vercel integration. No CMS/backend mutation or companion changes; unrelated local edits remain excluded. Initial implementation evidence below predates release preparation.

## Implementation

- Phone-only styles below the existing 600px boundary: compact 60px header and 112px official logo, responsive left-aligned CMS heading/subtitle, retained yellow destination emphasis. Existing language indicator and menu remain in place.
- Existing CMS mobile photograph and focal settings retained. Navy overlay is 56–65% over the upper composition, strengthening at the bottom. Background-only 0.7px blur and bottom-anchored 1.16 scale bring architecture higher and reduce empty sky; foreground stays sharp. No admin configuration change.
- Natural-flow landing section uses vh/svh/dvh minimum-height fallbacks and safe-area padding. Removed bottom-pushing auto margin; carousel starts approximately 29–30% down standard phone viewports. Short screens, expanded details and enlarged text can grow vertically.
- Cards use 88vw width, 10px gaps, a narrow next-card preview, existing native horizontal snap/swipe and 44px pagination controls. Photos now scale from 140px to 216px with available height; van proportions remain intact. White cards have 22px corners, clear price/unit labels and at least 48px yellow booking targets. Shared rail stretching and flex layout align booking buttons.
- A selected real product feature supplies the small category/service label; its duplicate badge is hidden only on mobile. Descriptions that merely repeat the title are suppressed only on mobile and remain in View details. No invented description replaces the first product's redundant CMS copy. Product titles, enabled features, icons, prices and booking URLs use existing data. First embedded product photo loads eagerly to avoid a delayed above-fold image; reserved media dimensions avoid image layout shifts.
- Desktop/tablet CSS, booking engine/dialogs, navigation actions, CMS fields and independent Live Map contract unchanged. No dependencies added.

## Reference and CMS evidence

Approved reference: https://chatgpt.com/s/m_6aedba8ee53881919d051eca217740ff (archived as approved-mockup.png in the evidence folder). Compared visually for compact header, two-line heading, dark city backdrop, dominant white/photo cards, next-card preview and yellow actions. Real CMS copy and pricing retained rather than copying mockup text.

Browser harness used the existing published CMS snapshot from docs/evidence/booking-publication-20261104/published-cms-snapshot.json with the actual shared components. A read-only live inspection of sightseeingshkodra.app on 6 November confirmed both current titles, descriptions, product image URLs, prices (€15.00 and €10.00), booking product IDs and EN-only indicator match that snapshot. Hero mobile image selection and admin focal controls were inspected in source. Temporary development harness removed before final checks; archived as harness-page.tsx.txt.

## Validation

PASS — 678 existing tests, zero failures. Includes booking, security, database/PostgreSQL and CMS suites; tests.log.

PASS — initial lint, TypeScript and Webpack production build; final-check.log, exit0. During publication preparation, a fresh locked npm ci resolved the local Turbopack stall. Normal npm run check (lint, types and Turbopack production build), all678 tests and npm audit --omit=dev --audit-level=low now pass, with zero production vulnerabilities. No dependency versions, lockfile or bundler configuration changed. Fresh release evidence: docs/evidence/mobile-homepage-publication-20261106/release-check.log.

PASS — native Chrome/CDP viewport checks at 360×740, 375×667, 390×844, 430×932, landscape568×320 and844×390, tablet600×900 and768×1024, desktop1280×800 and1440×900. No page horizontal overflow; following section remains below the hero. validate-layouts.mjs independently asserts recorded geometry.

| Viewport | Card top | Booking bottom | Pagination bottom |
| --- | ---: | ---: | ---: |
| 360×740 | 216 | 651 | 716 |
| 375×667 | 197 | 590 | 653 |
| 390×844 | 253 | 713 | 778 |
| 430×932 | 273 | 755 | 820 |

PASS — complete first card, button and pagination visible together at all four required portrait sizes; equal card/action alignment. Native touch swipe, both products' pagination and details, four-product stress, long expanded content, 200% font-size stress and reachable actions pass. Twenty booking open/close cycles across both products and five sizes preserve background geometry, focus and scroll; zero checkout requests. Existing details and booking behavior reused. Native keyboard Enter selects the second pagination dot; menu Escape returns focus to the toggle. Synthetic Italian-length labels and320px containment pass; these are layout stress strings, not newly added translations.

PASS — tablet/desktop screenshots at600/768/1280/1440px are pixel-identical to the before screenshots (zero differing pixels at each size). Evidence: desktop-comparison.json.

## Limitations

Existing language UI is an EN indicator marked “More languages coming soon”; no switchable translated site exists to test. Actual language switching is therefore UNVERIFIED/unsupported by the baseline; long-label and enlarged-text containment were tested instead. Physical iOS/Android devices, Safari/Firefox, dynamic browser toolbar behavior, real device safe-area/keyboard behavior and real checkout submission remain unverified. No real reservations, payments or communications were created.

The local harness exercises the shared homepage/header/cards/dialog components with published CMS props and a normal-flow following section; it does not claim a production deployment or full live homepage revalidation.

## Screenshots and reproducibility

Evidence directory: docs/evidence/mobile-homepage-20261106/.

- after-home-360x740.png
- after-home-375x667.png
- after-home-390x844.png
- after-home-430x932.png
- after-home-568x320.png and after-home-844x390.png
- interaction-200-percent-text.png and interaction-long-card-content.png
- baseline/after-layouts.json, browser-review.mjs, validate-layouts.mjs, interactions.mjs/json and extras.mjs/json.

Keyboard runner correction: native Enter requires a carriage-return text payload in this CDP runner. Earlier incomplete synthetic key events did not activate the button; complete native input passes. Initial TypeScript attempts included archived .tsx copies and then stale generated dev-route types; archive extensions and generated types were cleaned before the final check.
