# Full-screen mobile hero — 29 September 2026

Implemented locally against the user's real-phone screenshot. Not deployed.

The previous approved compact photo ended before Discover, leaving a white area in the phone viewport. The latest request explicitly changes that composition: photo and Discover now fill the mobile screen together.

Changes in public.css, scoped through 900px:
- Hero minimum is 100svh (100vh fallback), with auto height for readable content on short screens. Stable small viewport height avoids following every browser-toolbar animation; actual device chrome still needs testing.
- Absolute cover photo spans all four grid rows, including Discover, and does not determine intrinsic layout height.
- Mobile hero Track live is hidden; existing desktop link and other map navigation remain.
- Discover directly follows Book, on the photo, with bottom safe-area padding and a continuous dark readability treatment.
- Headline and subtitle move 20px down. The subject-space minimum remains bounded; desktop rules and canonical price/booking code are unchanged.

## Verification

| Viewport | Photo height | Discover bottom | Mobile Track | Overflow |
|---|---:|---:|---|---|
| 320×568 | 635 | 635 | Hidden | None |
| 375×667 | 667 | 667 | Hidden | None |
| 390×844 | 844 | 844 | Hidden | None |
| 393×852 | 852 | 852 | Hidden | None |
| 430×932 | 932 | 932 | Hidden | None |
| 700×1000 | 1000 | 1000 | Hidden | None |
| 701×1000 | 1000 | 1000 | Hidden | None |
| 768×1024 | 1024 | 1024 | Hidden | None |
| 820×1180 | 1180 | 1180 | Hidden | None |
| 844×390 landscape | 731 | 731 | Hidden | None |

Small/landscape screens scroll to preserve legibility. At 1440×900 desktop hero/copy/price/actions/Discover geometry matches the preceding release. Four 390px height simulations passed full-screen coverage and copy-position checks. Browser evidence: private/hero-composition/fullscreen-geometry.json and fullscreen-*.png. The production build was checked at localhost:3004; no physical-device PASS is claimed.

Updated scripts/check-hero-composition.mjs to enforce the new requested contract: photo fills viewport, Discover inside photo directly below Book, Track hidden, proportional cover image, bounded phone composition and unchanged desktop. It no longer asserts the explicitly superseded outside-photo Discover or constant hero height. Geometry assertions passed all 11 cases plus four height simulations.

Canonical booking opens one dialog; Close works. Hamburger opens and Escape closes. Discover navigates to #home-intro, showing the existing red fixed header. Dynamic fare remains EUR10 for 30 September in inspected content. No booking submission, CMS data write or map change.

Quality gates: lint PASS, TypeScript PASS, production build PASS. Focused component tests 6/6 and public-homepage integration tests 9/9 PASS. Logs: private/hero-composition/fullscreen-check.log and fullscreen-tests.log. Earlier full-suite results remain historical and were not rerun for this CSS-only update.

Files changed: src/app/(public)/public.css, scripts/check-hero-composition.mjs, docs/DECISIONS.md, this report and the appended PHASE_STATUS.md entry. Unrelated work retained. No commit or deployment.

iPhone Safari and Android Chrome: PENDING REAL-DEVICE RETEST. Ready for local review.

![Updated mobile composition](../private/hero-composition/fullscreen-390.png)
