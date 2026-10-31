## Publication authorized — 31 October 2026

The owner explicitly requested publication after the mobile audit. Release scopes the eight public component/style files, three regression-test files, two CMS-verification helpers and this report. Local development review fixtures and unrelated work remain outside the release. Vercel main triggers Production with automatic domain assignment; feature pushes may trigger Preview. Existing main ded362c is the rollback baseline. The local-only statements below describe the preceding implementation step.

# Stops simplification — local review, 31 October 2026

Implemented locally against the existing `SightseeingShkodra-Web-App` checkout on main `ded362c83f33b6c8d2a7a30e7fed3ae4bd45bcf7`. The documented `-canonical` path is absent; the existing renamed permanent checkout was used. No clone, worktree, source release folder, commit, push, deployment or database change. Pre-existing dirty documentation and release evidence preserved.

Read project instructions, roadmap/decisions/status, CMS reconciliation and existing destination fields/consumers, plus installed Next client/image guidance. Mockup used only for this section's presentation. Website header, branding, CMS records, destination publishing permissions, stop identities/order and iframe contract retained.

## Result

One shared selector/detail renderer supports the homepage at every breakpoint and the Route tracker. All five existing stops retain original photographs, numbered badges and individual colours. Selectors contain only photograph, badge and short name; the redundant English `Stop 1 -` prefix is removed from the selector's displayed name without modifying CMS content. No slogans, descriptions, Upcoming labels, destination links or tall background cards remain inside selectors.

The first stop's persistent detail card renders immediately. Selection updates that same card; clicking the selected stop does not close it. Tracking updates, stale status and viewport changes do not automatically replace or recenter editorial selection. Existing live-summary presentation is retained separately. The iframe's Find Van and message processing are unchanged.

The card uses the existing destination image/name/summary and CMS action label. Explore destination is the existing branded primary link. View on map is a secondary text action with a decorative pin: Route invokes its existing selected-ID callback; the homepage retains the existing `/route` fallback. No new route parameters or message protocol. Missing and failed images use a neutral placeholder. No data/schema/editor changes or copied mockup photographs.

Desktop has five evenly spaced selectors and a compact two-column detail card. Mobile uses a contained horizontal rail with a partly visible next selector, labels attached to portraits and a stacked detail card. Arrow keys/Home/End select and reveal items by scrolling only the rail. Enter/Space retain native button operation. Pressed state, a polite selection announcement, labelled detail region and visible focus distinct from the selection ring are provided. Reduced motion removes smooth centering/portrait motion. Long labels wrap in normal flow.

## Changed files

Application:
- `src/components/public/stop-selector.tsx` — shared persistent selector/card and keyboard behavior (new).
- `src/components/public/stop-selector.module.css` — scoped responsive layout/focus/actions (new).
- `src/components/public/stop-portrait.tsx` — compact presentation option and image-error fallback.
- `src/components/public/stop-portrait.module.css` — thin borders, normal-flow labels, selected ring.
- `src/components/public/live-journey-tracker.tsx` — reuse selector; keep operational summary and selected-ID map callback.
- `src/components/public/live-journey-tracker.module.css` — remove obsolete selector/card styles; retain live-summary styles.
- `src/components/public/homepage-journey.tsx` — same renderer across breakpoints, retaining mobile/desktop status differences and server-rendered destinations.
- `src/components/public/homepage-stops-gallery.tsx` — compatibility wrapper reuses the shared renderer instead of modal/arrow UI.

Verification:
- `tests/components/live-journey-tracker.test.mjs`
- `tests/components/homepage-stops-gallery.test.mjs`
- `tests/components/journey-follow.test.mjs`
- `scripts/cms-verification/client.mjs` and `verify.mjs` — CMS probes now verify real persistent stop-card selection, label propagation and stale-copy rejection instead of the retired modal/open-close interaction.
- `src/app/dev/stops-review/page.tsx` and `review.tsx` — development-only review route, current public CMS snapshot, controlled tracking/edge cases; notFound outside development.
- `docs/evidence/stops-simplification-20261031/` — public snapshot, runners, results/logs and screenshots.
- This report and an additive local phase-status entry. Earlier unrelated documentation edits remain separate.

## Validation

- 163 existing component tests PASS, including the updated selection/gallery/homepage regressions.
- Five existing bridge/display integration tests PASS: schema, explicit capability, source/origin validation, expiry, reload and cleanup.
- Lint, typecheck and production build PASS; final whitespace check PASS.
- Actual Next development app tested in headless Chrome/Chromium at 320, 360, 390, 430, 768, 1024 and 1440 px, plus 844×390 landscape. Five selectors in original order at every width; no page-level horizontal overflow. Desktop/tablet has one selector row; mobile rail scrolls horizontally.
- All five selectors and selected-ID map callbacks checked at every size. Primary links were clicked for all five stops and reached their existing paths; all five published destination URLs returned HTTP 200. Local article responses are 404 because this checkout has no configured CMS bindings, not because the paths were changed.
- Persistent selection through simulated tracking changes and unavailable state; actual Route component's unavailable-iframe path; primary/secondary hierarchy, keyboard/Home/End, visible focus and rail-only centering checked. Image-less and failed-image cases, including 320 px, and long labels at 320/768/1440 checked.
- Exact retained colours: #F20544, #0875E8, #078B51, #FF8412, #8200D6. Captured current public photographic URLs and destination associations in `public-stops.json`; those are review fixtures, not another production content source.
- Zero browser page exceptions. Browser report: `evidence/stops-simplification-20261031/browser.json`; additional initial-rail/colour/missing-image evidence in `additional.json`.

Limitations: desktop Chromium responsive emulation, not physical Safari/iOS/Android touch testing. The local review uses a read-only snapshot of the currently public CMS destinations; configured local CMS/article parity is unavailable. The hosted iframe is deliberately blocked for unavailable-map acceptance; no new live GPS or hosted child integration acceptance is claimed. Existing bridge regression tests pass and production map code is untouched. Screenshot capture hides only the Next development indicator.

## Review

Local development review: http://127.0.0.1:3011/dev/stops-review . Controls exercise long labels, missing images, tracking changes, map-unavailable state and homepage/actual Route placements. The production URL is unchanged.

Representative screenshots:
- `evidence/stops-simplification-20261031/review-mobile-start.png` — initial mobile swipe hint.
- `evidence/stops-simplification-20261031/review-390.png` — selected Historic Centre, stacked card.
- `evidence/stops-simplification-20261031/review-1440.png` — all five selectors and horizontal card.
- `evidence/stops-simplification-20261031/keyboard-focus.png`
- `evidence/stops-simplification-20261031/long-labels-320.png`
- `evidence/stops-simplification-20261031/missing-images-mobile.png`

All seven requested widths plus landscape, homepage screenshots and raw results are retained in the same evidence directory. Representative mobile/desktop, long-label and missing-image screenshots were visually inspected.

## Follow-up mobile interaction audit

The owner asked whether this redesign is mobile friendly. Rechecked with Chrome mobile-device emulation (`isMobile`, touch enabled, DPR 2), rather than viewport resizing alone. PASS at 320×568, 360×800, 390×844, 430×932 and 844×390 landscape. Native browser touch swipes scroll the rail without accidental selection or vertical page movement; all five stops select by touch; selector and detail-action touch targets meet the 44 px minimum; no page-level horizontal overflow. Selected stop survives portrait/landscape/portrait changes and long labels wrap. Stacked mobile image/content and full-width primary action were visually inspected. No additional application redesign was necessary. Existing source changes remain local and unpublished.

Evidence: `evidence/stops-simplification-20261031/mobile-audit.json`, `mobile-audit.log`, `mobile-touch-review.png` and `mobile-touch-long-labels.png`. Mobile-audit runner lint passes. These are touch-emulated Chromium checks, not physical iOS/Safari or Android acceptance.
