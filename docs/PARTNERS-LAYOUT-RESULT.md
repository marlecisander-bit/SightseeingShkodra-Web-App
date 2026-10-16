# Our Partners layout correction

16 October 2026. **Local implementation PASS; ready for review. No release action authorized or performed.**

## Isolation and scope

- Checkout: `/private/tmp/shkodra-partners-layout-20261016`.
- Branch: `implementation/partners-layout-2026-10-16`.
- HEAD: `c3020c566f167af4d0ef87e9aa33d4d0adb0d367`, freshly verified remote main. This matches the previously recorded production release baseline; no new hosted deployment inspection is claimed.
- Began clean. No Admin Phase A or Warm Minimal changes were copied. Their checkouts and Draft PR #22 were not modified.
- All work is uncommitted. No push, PR creation/update, merge, deployment or hosted mutation occurred.

## Files changed

1. `src/components/public/partners-section.module.css` — centered wrapping cards, consistent sizing and scoped responsive section spacing.
2. `src/components/public/partners-section.tsx` — image `sizes` updated to match the actual 118px mobile / 126px desktop logo areas; original sources, contain fit, names, ordering and link attributes retained.
3. `docs/PARTNERS-LAYOUT-RESULT.md` — this local report.

The public reset `.public-site :is(main, section, footer)` was overriding the section's original padding. A stronger local `.section.section` selector fixes that conflict without changing global CSS or any other section.

## Layout

Centered Flexbox rows use 140px mobile cards and 160px cards from 640px, with 20px / 24px gaps. Every row, including an incomplete last row, centers independently. Cards have a 220px minimum height, matching heights for the tested long-name/description samples. Unusually long future content can grow rather than being clipped. White background, existing border/radius and proportional `object-fit:contain` logo rendering remain.

Heading-to-description margin is 16px. Description-to-cards spacing is 28px mobile / 36px tablet and desktop. Bottom white padding is 48px below 640px, 64px from 640px and 80px from 1024px. No separator or heavy shadow was introduced. Optional CTA rendering/behavior remains unchanged; when enabled, it sits inside the padded section.

## Local browser validation

Actual rendered PartnersSection and existing Footer used synthetic partners and existing local raster images; none represents a real approved partner or a stored record. A temporary development-only composition removed the preview main's artificial minimum height so section-to-footer spacing could be measured directly. That route was removed before final validation. No production page, CMS save, upload or external link was operated.

| Width | Counts checked | Five-partner rows | Padding to footer | Result |
|---|---|---|---|---|
| 320 | 0, 1, 2, 3, 5 | 1 / 1 / 1 / 1 / 1 | 48px | PASS |
| 375 | 0, 1, 2, 3, 5 | 2 / 2 / 1 | 48px | PASS |
| 390 | 0, 1, 2, 3, 5 | 2 / 2 / 1 | 48px | PASS |
| 768 | 0, 1, 2, 3, 5 | 3 / 2 | 64px | PASS |
| 1024 | 0, 1, 2, 3, 5 | 5 | 80px | PASS |
| 1440 | 0, 1, 2, 3, 5 | 5 | 80px | PASS |

All 30 samples verified actual viewport width, zero document horizontal overflow, exact rendered card count, centered row bounds, equal sample card heights, unchanged external href/target/rel, contained image fit and exact bottom gap. Zero partners still renders no section. One card stays compact and centered. Two/three form centered rows when space permits, wrapping into centered rows otherwise. At 375/390px two fit; at 320px cards stack safely.

Initial checks caught the overridden padding and unequal heights for long synthetic content. Both were corrected, then all measurements repeated. One transient aborted local navigation during fixture regeneration was retried; only complete final samples were retained. Final mobile five-card and desktop one-card screenshots were visually inspected. Browser viewport was reset and local server stopped.

Image space and minimum card height are reserved before lazy images load. No layout shift was observed in reviewed states; no instrumented CLS/performance or physical-device certification is claimed.

## Checks and preservation

- `npm run check`: PASS — ESLint zero warnings, TypeScript, production build, after temporary route removal.
- `npm run test:components`: **64 PASS**, zero failures/skips, including existing partner empty/inactive/hidden behavior, ordering, safe links/CTA, logo validation and homepage invitation/partner/footer composition tests.
- Browser measurement assertions: **30 PASS** for the final CSS.
- `git diff --check`: PASS.
- Complete application diff: only the two partner presentation files above. No footer/global CSS, CMS, partner admin/CRUD, visibility/ordering rules, booking code, other homepage section, Admin Phase A, schema, dependency or cloud configuration change.

Ignored local evidence: `private/partners-layout-evidence/responsive.json`, `one-desktop.jpg`, `five-mobile.jpg`. Logs: `/private/tmp/partners-layout-check.log`, `/private/tmp/partners-layout-components.log`. Existing local development fixture images are used only for layout; actual partner data was not inspected or altered.

**GO for local review.** Separate authorization is required before commit/push/release work. No production rollback is needed; a future authorized release would use a scoped application revert, with no database rollback.
