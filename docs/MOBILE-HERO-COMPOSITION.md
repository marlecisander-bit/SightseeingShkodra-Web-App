# Mobile hero composition correction — 29 September 2026

**LOCAL STATUS: READY FOR REAL-DEVICE RETEST. Not deployed.**

## Root cause and audit

The mobile/tablet override through 900px used `grid-template-rows: auto 1fr auto auto` and a relatively positioned media item spanning the first three rows with `min-height: clamp(760px, 200vw, 1100px)`. The spanning media minimum and flexible copy row allocated excessive space below the subtitle. At 390×844 the rendered photo was 976.78px high, the subtitle ended at 201.44px and the price began at 760px. At 430px the photo grew to 1056.78px and price to 840px.

There was no literal active 9/16 aspect-ratio rule. The width-derived 200vw minimum effectively imposed an even taller portrait region. The saved portrait itself is approximately 9:16, but its ratio should not determine layout height.

| Property inspected | Before / diagnosis |
|---|---|
| Hero height/min/max | auto / 0 / none in the <=900px override |
| Media height/min-height | auto / clamp(760px, 200vw, 1100px); the problematic intrinsic layout contribution |
| Image aspect-ratio | auto; width/height 100%, absolutely positioned |
| Fit and focal position | cover, published mobile focal point 50% 50%; no distortion |
| Picture | inline wrapper, no independent height contribution from its absolutely positioned image |
| Grid | auto 1fr auto auto; surplus allocated to the subtitle row |
| Flex | desktop flex layout overridden by the mobile grid; content display:contents |
| Spacer | no explicit bounded subject gap; media minimum creates implicit surplus |
| Viewport units | desktop retains svh; mobile media uses width-derived vw, not dynamic viewport height |
| Landscape | separate max(660px,75vw) media minimum also contributes forced height |
| Breakpoints | <=900px shared hero grid, <=700px typography/header rules; portrait image selected through 900px |

## Implementation

Only hero CSS changed in application code. All four grid tracks are content-sized. The photograph is absolutely positioned against grid rows 1–3, with zero intrinsic minimum height. The commercial row has a modest `clamp(160px,45vw,220px)` top margin to reserve a deliberate vehicle region. Text and controls can grow naturally; the image cannot force the content taller. Landscape's forced media minimum was removed as well.

Portrait phones through 700px use a uniform 1.2 scale anchored at the bottom of the media box. This crops more sky and moves the vehicle upward without changing the source asset or its proportions. Existing CMS focal position remains applied; no image, CMS record, TSX, header architecture, hamburger, booking, pricing or map logic changed. Tablet retains unscaled cover. Desktop >900px rules are untouched.

The photograph spans through the commercial row, so text wrapping automatically extends its end. Track remains inside that region; Discover occupies row 4 outside it. No fixed hero height or dynamic viewport-height spacer is introduced.

## Before and after

Coordinates are CSS pixels from the document top in desktop Chrome viewport emulation. Its scrollbar reduces the content width by 15px; the requested viewport dimensions themselves were exact.

| Viewport | Old photo height | New photo height | Old price top | New price top | New van roof, approximate | Track bottom | Discover top |
|---|---:|---:|---:|---:|---:|---:|---:|
| 320×568 | 957 | 641 | 740 | 424 | 272 | 621 | 649 |
| 375×667 | 957 | 611 | 740 | 394 | 260 | 591 | 619 |
| 390×844 | 977 | 618 | 760 | 401 | 263 | 598 | 626 |
| 393×852 | 983 | 619 | 766 | 402 | 264 | 599 | 627 |
| 430×932 | 1057 | 638 | 840 | 421 | 273 | 618 | 646 |

Old behavior: a tall portrait region, extended subtitle row and distant commercial controls. New behavior: recognizable vehicle shortly after the copy, substantially earlier controls and one stable photo ending. On the small phone scrolling is still required, with readable original type and touch targets retained. The crop deliberately trims vehicle edges; it retains the substantial cabin/body/wheel region rather than preserving the entire portrait.

## Verification and acceptance

| Criterion | Result |
|---|---|
| Mobile hero composition | PASS in local Chrome emulation |
| Excessive empty sky | RESOLVED in inspected local compositions |
| Van appears earlier / focal position / visibility | PASS; approximate roof at 260–273px on five phones |
| Hero height / not driven by image ratio | PASS; content tracks plus bounded subject space |
| Image crop / no distortion | PASS; cover and uniform scale, existing image retained |
| Price / Book / Track on photo | PASS for all <=900px matrix cases |
| Photo ends after Track / Discover starts after photo | PASS; >=20px after Track, Discover starts 8px after photo |
| 320×568 / 375×667 / 390×844 / 393×852 / 430×932 | PASS in emulation, including visual inspection |
| 700/701 breakpoint | PASS; photo heights 710/742px, expected existing header/type change, no overflow |
| Tablet 768×1024 / 820×1180 | PASS; photo heights 744/746px |
| Landscape 844×390 | PASS; content scrolls normally, landscape photograph retained |
| Desktop 1440×900 | PASS; hero/media/copy/price/Book/Track/Discover geometry matches pre-edit baseline within 1px |
| Red fixed header | PASS; transparent at top, rgb(185,21,70) after Discover navigation, transparent after logo returns to top |
| Hamburger | PASS; opens, body scroll locks, backdrop present, Escape dismisses |
| Dynamic price | PASS regression; actual EUR10, next service date 30 September shown; canonical fare tests pass; no hosted price mutation |
| Canonical booking dialog | PASS; hero opens one dialog without route navigation, Close works; full booking regressions pass; no booking submitted |
| Live Map routing | PASS; Track opens /live and existing independent iframe URL remains |
| Browser-height stability | PASS simulation; at 390px width and 650/744/844/944px heights, photo/copy/commercial/Discover document geometry stays unchanged |
| iPhone Safari | PENDING REAL-DEVICE RETEST |
| Android Chrome | PENDING REAL-DEVICE RETEST |

Geometry assertions in `scripts/check-hero-composition.mjs` consume real browser measurements, check boundaries/touch sizes/height reduction, compare desktop before/after and verify browser-height stability. The van landmark assertion uses manually identified source-image roof/wheel bounds at approximately 52–77% of image height, transformed through the measured cover/scale geometry. It is specific to the current CMS portrait, not automatic object recognition or a guarantee for replacement photographs.

Run: `node scripts/check-hero-composition.mjs private/hero-composition/geometry.json`.

Quality gates: **280 tests passed, zero failed/skipped** (components6, identity17, integrations97, database137, PostgreSQL23), lint PASS, TypeScript PASS, production build PASS. The added geometry script separately passed targeted ESLint and its 11-viewport/four-height checks. Browser checks used the local production build on port3003. Tests include existing unrelated working-tree email tests; those files were not changed by this task. Logs and measurements are under `private/hero-composition/`.

## Files and limitations

- `src/app/(public)/public.css`: scoped hero layout and crop only.
- `scripts/check-hero-composition.mjs`: measured geometry acceptance checks.
- `docs/MOBILE-HERO-COMPOSITION.md`: this report.
- `docs/PHASE_STATUS.md`: appended local status.

Blockers: none for local real-device retest. Physical-device acceptance remains pending. The supplied attachment contained the written brief only, so no independent phone screenshot was available for pixel comparison. Existing CMS image alt text describes a lake scene despite the van photograph; left unchanged. Actual browser-bar/safe-area behavior requires hardware retest. Full price-edit/publish lifecycle was not replayed for this CSS-only change.

No deployment, commit, content write, asset replacement, schema change or email enablement performed.

![Before at 390×844](../private/hero-composition/before.png)
![After at 390×844](../private/hero-composition/after-390.png)
