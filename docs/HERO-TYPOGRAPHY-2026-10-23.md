# Hero typography — 23 October 2026

Local only; ready for owner review. Source: `/private/tmp/shkodra-hero-typography-20261023`, cloned locally from the previously validated/published application snapshot (same application code as main 7c7f15c). The separate compact-ticket email work remains isolated and unpublished. No remote Git request, push, merge, deployment, Supabase write or booking submission was performed.

## Presentation

The existing CMS title now has separate block lines for the introduction and a recognizable trailing Shkodra/Shkodër destination, followed by the existing emphasis. Lead and ending are white; destination uses existing `--ss-yellow` (#F6C928). A short yellow CSS underline appears beneath the ending. Font family is inherited unchanged; headline weight 750, slightly negative tracking, compact line height, left alignment and maximum 520px text width. Desktop type scales 64–76px. Mobile scales 36–42px at the requested phone widths, with tighter text-only spacing to retain the original image frame. Tablet uses 52px.

The introductory label is now visible on mobile. Subtitle is 14px mobile / 16px desktop. The existing strong whole-frame overlays are replaced with the requested subtle left-to-right 0.48/0.20/transparent contrast gradient. No picture/image source, image colors/assets, object-fit/object-position, hero dimensions, navigation, booking widget, overlap, amenities or booking code was changed. Text uses flex centering in the existing safe space; the panoramic text inset follows the existing content container rather than a fixed coordinate.

## CMS and localization

No English heading is hardcoded in the component. The splitter recognizes only a trailing Shkodra/Shkodër name, retains punctuation and all CMS words, and leaves arbitrary/custom/non-Latin titles intact. There is still one H1. Longer translated copy wraps naturally without clipping; no forced three-line truncation or fixed text height is used.

The actual saved CMS label is “SHKODËR, ALBANIA · GO A LITTLE FURTHER”, and the saved title includes “Shkodra.” with a period. Those values remain intact rather than silently rewriting public copy/data to the shorter example in the brief. The default layout reads Discover / Shkodra. / Your way. The currently visible EN control says more languages are coming soon; no translation system, new CMS fields or translated production copy was introduced.

## Validation

- All 490 tests passed: 94 component, 23 identity, 158 integration, 182 database, 26 PostgreSQL concurrency, 7 CMS verification.
- ESLint, TypeScript, production build and git diff --check passed.
- Actual published desktop/mobile photographs were reused through the existing development-only preview and private public-asset fixture; no image was generated or replaced.
- At 320/375/390/430/768/1024/1280/1440/1920px: no page overflow, header/text clearances passed, subtitle visible, default image frame height matched baseline, object-position matched, booking overlap remained 48px mobile / 56px tablet / 64px desktop.
- Observed headline sizes respectively: 36 / 38.25 / 39.78 / 42 / 52 / 64 / 66.56 / 74.88 / 76px.
- Desktop, mobile and intermediate 1024px screenshots inspected. Existing van remains unobscured by the headline. Native device testing and automated per-pixel photographic contrast certification were not performed.
- Mobile menu opens/closes; existing passenger selector increments 1 Adult to 2 Adults and back. No checkout submitted. Existing booking markup/functions and other public sections are unchanged.
- Longer French fixture checked at 320/768/1440px without overflow, header collision or ticket collision. Exceptional long CMS copy may grow the flexible hero to remain readable; crop settings and overlap rules remain intact.

## Modified files in the isolated checkout

- `src/components/public/homepage-hero.tsx` — headline spans using existing CMS values.
- `src/components/public/hero-headline.ts` — conservative presentation-only splitter.
- `src/components/public/homepage-hero.module.css` — text styles, safe positioning and contrast overlay only.
- `src/app/dev/hero-preview/page.tsx` — optional synthetic long-copy fixture; remains development-only.
- `tests/components/homepage-hero.test.mjs` and `tests/components/hero-headline.test.mjs` — semantic/CMS/localization coverage.
- This report and `docs/PHASE_STATUS.md` — evidence.

Screenshots: `/private/tmp/shkodra-hero-type-desktop.png`, `/private/tmp/shkodra-hero-type-mobile.png`. Responsive evidence: `/private/tmp/shkodra-hero-type-responsive.json`. Local preview: `http://localhost:3103/dev/hero-preview?published=true`; add `&copy=long` for synthetic translated copy.

Ready for owner review. Not committed, pushed or deployed. Existing image configurations, CMS data, booking rules, capacity/pricing, reservations, backend and navigation remain unchanged.
