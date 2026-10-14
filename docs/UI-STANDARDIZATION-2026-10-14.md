# Public UI standardization — local implementation, 14 October 2026

## Changes and files

- `src/components/public/sightseeing-stops-experience.tsx`: reused the existing component; separated timeline presentation from live/discover behavior with `layout`. No second timeline implementation.
- `src/components/public/sightseeing-stops.module.css`: shared the existing compact photographic rail across both modes. Circular images, numbering, connecting line, responsive horizontal rail, details and authoritative live-state styling retained.
- `src/components/public/homepage-view.tsx`: explicitly selects the shared timeline. Other homepage sections preserved.
- `src/components/public/route-journey.tsx`: map directly after the CMS introduction, timeline immediately below, then existing schedule. Promotional ticket block and fallback booking block removed from rendered tree. Header/footer booking entry points preserved.
- `src/app/(public)/route/page.tsx`: removed the now-unused product/fare query.
- `src/app/admin/[operatorId]/website-preview/page.tsx`: draft Route preview uses the same updated component without promotional product props.
- `src/app/brand-tokens.css`: `--color-booking-primary` aliases existing `--ss-yellow` (#F6C928); hover #E4B718 and active #CEA410 retain existing brand values.
- `src/app/(public)/public.css`: shared yellow booking appearance, charcoal text, 700 weight, control radius, 44px minimum, hover/pressed/focus/disabled states.
- `src/components/public/homepage-hero.module.css`: removed red hero purchase overrides.
- `src/components/public/booking.tsx`: public button links targeting /book receive the shared booking class; modal, modified-click and direct/new-tab behavior preserved.
- `src/components/public/checkout-flow.tsx`: final reservation submission uses the same yellow variant as preceding booking actions. Confirmation indicators and cancellation actions untouched.
- `tests/components/cms-visibility.test.mjs`: updated acceptance expectation for intentionally removed Route booking block and asserted map-before-timeline order.

## Data and architecture

Published operational stops/order remain owned by the independent map via existing day-planner data. Destination photos, descriptions, links and names retain existing shared CMS mappings. Visibility controls and draft preview remain intact. No duplicated CMS controls, hardcoded operational stop list, migrations, environment changes or backend changes added.

The Route map remains the sole mounted external frame and source of validated journey messages. Existing freshness handling and stop selection are unchanged. Homepage shows neutral stops because it has no journey bridge until its separately existing map disclosure is opened; no new polling, subscriptions, map mount or invented browser progression was added. Different homepage/route editorial visibility settings can intentionally omit editorial photos on one page; this existing policy was preserved.

## Verification

- Lint, typecheck and production build passed.
- Component suite: 45/45 passed.
- Integration suite: 140/140 passed, including tracking bridge/freshness and checkout regressions.
- Database/domain suite: 165/165 passed, including booking/capacity and customer management regressions.
- Original tsx CLI runners hit sandbox IPC restrictions; equivalent `node --import tsx` runners passed.
- Chrome local fixture previews for both shared page components at 375, 430, 768, 1024 and 1440px: five stops, timeline layout, no horizontal page overflow. Visible booking buttons computed #F6C928 and minimum 44px. Map measured 666px mobile / 684px larger viewport at 900px test height.
- Header booking action opened the existing shared dialog and Close booking dismissed it.
- External live map loaded and supplied unavailable-location status. No moving-van/ETA physical field test claimed.
- Desktop/mobile after screenshots saved under `/tmp/shkodra-ui-evidence/`; these use explicitly fictional local editorial fixtures. No before screenshots retained.

## Limits and release

Actual localhost homepage returned the existing content-unavailable fallback; hosted CMS availability and publication end-to-end testing were therefore not verified. Responsive layout testing used the existing development-only fixture rendering the same public components. No CMS publication, booking submission or external infrastructure mutation performed.

Existing Tour route redirects; there is no active Tour UI to recolor. Existing modifications present at task start were preserved. No commit, push or deployment performed. Production release needs separate explicit authorization after review.
