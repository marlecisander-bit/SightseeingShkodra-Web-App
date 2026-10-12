# Footer responsive refinement — 9 October 2026

Implemented and validated locally. No deployment, cloud operation, CMS save, booking submission, migration, dependency, environment or authentication change.

The existing shared Footer now uses one CSS Grid with two desktop rows and three compact mobile rows. Desktop keeps logo left, social links centered and Staff Login right; copyright/VAT left and legal links right. Mobile keeps logo/social links together, copyright/VAT together, and legal links alongside Staff Login. Reduced padding, proportional logo sizing, 44 px link targets, retained yellow keyboard focus and charcoal background. Uses the existing 1320 px container token and shared gutter, with 8 px minimum gutters at the narrowest breakpoint to accommodate five 44 px icons even with a classic scrollbar. No fixed height; long content and safe-area insets can increase height.

Existing logo/icon assets, URLs, CMS readers, optional-social visibility, business/year/VAT editing, legal publication, final-invitation visibility and WhatsApp obstacle marker remain unchanged. No duplicate footer or new content source. English is the only currently exposed language; long accented/multilingual business text was tested without adding translation infrastructure.

## Changed files

- `src/components/public/ui.tsx`: remove layout-only wrappers and assign classes to the existing identity/legal groups.
- `src/app/(public)/public.css`: replace only the footer layout rules. Preserve the pre-existing analytics CSS and unrelated worktree changes.
- This evidence report and an appended `docs/PHASE_STATUS.md` entry.

## Local validation

| Viewport width | Original five-icon fixture | Refined five-icon fixture | Horizontal overflow | Minimum target height |
| --- | --- | --- | --- | --- |
| 320 | not captured | 138 px | none | 44 px |
| 375 | not captured | 138 px | none | 44 px |
| 390 | 377 px | 138 px | none | 44 px |
| 430 | not captured | 138 px | none | 44 px |
| 768 | not captured | 133.7 px | none | 44 px |
| 1024 | not captured | 133.7 px | none | 44 px |
| 1440 | 199.7 px | 133.7 px | none | 44 px |
| 1920 | not captured | 133.7 px | none | 44 px |

Actual public route checks: `/`, `/tour`, `/book`, `/route`, `/explore`, `/your-day`, `/faq`, `/credits`, `/privacy-policy`, `/terms-and-conditions`, `/booking/manage`, `/live` (redirects to `/route`) and guides `/explore/bridge`, `/explore/castle`, `/explore/centre`, `/explore/lake`. All 128 completed route/width renders had exactly one shared footer and no document horizontal overflow. Guides display existing 404 fallback in this unconfigured local environment; streamed rendering was allowed to finish before measurement. Eight additional optimized-build checks on Privacy Policy confirmed the same dimensions/targets and no overflow.

A temporary local QA route used the actual Footer, BookingProvider and WhatsAppContact with five fixture social URLs. Removed before build. Hydrated mobile checks at 320/375/390/430 found no WhatsApp/footer intersection; the existing docking logic placed the button 12 px above the footer. Classic scrollbar height/overflow at 320 was checked after narrowing the gutter; the earlier docking JSON retains its pre-adjustment 182 px measurement. Keyboard Tab from logo focused Instagram with a visible 3 px yellow outline. All six logo/icon images loaded. Stress business/VAT values, including accents and long unbroken identifiers, remained contained at 320/375/768/1440; mobile height increased to 192 px as intended.

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; temporary QA route excluded.
- `node --import tsx --test tests/components/global-footer.test.mjs tests/database/global-footer.test.mjs tests/database/whatsapp-contact.test.mjs`: 13 passed, 0 failed, 0 skipped. Includes existing CMS draft/publish/withdraw behavior and WhatsApp docking/security checks in disposable local databases.
- `git diff --check`: PASS.

## Screenshots and raw evidence

Before/after screenshots use the actual shared Footer rendered with five explicitly configured test URLs, not published social-account data. Assets and CSS come from this project. Capture dimensions: desktop 1440 px; mobile 390 px.

- [Desktop before](/private/tmp/shkodra-footer-refinement/before-desktop.jpg)
- [Desktop after](/private/tmp/shkodra-footer-refinement/after-desktop.jpg)
- [Mobile before](/private/tmp/shkodra-footer-refinement/before-mobile.jpg)
- [Mobile after](/private/tmp/shkodra-footer-refinement/after-mobile.jpg)
- Raw JSON and check logs: `/private/tmp/shkodra-footer-refinement/` (`responsive.json`, `routes.json`, `whatsapp.json`, `stress.json`, `production-css.json`, `lint.log`, `typecheck.log`, `build.log`, `tests.log`).

## Acceptance limitations

Local runtime reports missing PUBLIC_OPERATOR_ID, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY; it renders the CMS-unavailable fallback. Published guide content, actual social-profile URLs and hosted CMS save/publish acceptance cannot be certified here. Existing social URL construction/validation and external-link security attributes are unchanged; fixture destinations were inspected, not treated as real business profiles. Homepage and both legal link routes render; Staff Login href remains `/admin`, whose local response is 503 under missing configuration (browser also blocked that navigation). No authentication behavior was changed. Physical Safari/Android and hosted acceptance remain pending. Target height may grow for longer content, larger text or safe areas. No roadmap phase completion or production readiness is implied.


## Approved publication follow-up

The owner subsequently authorized publishing. The full release suite required updating the historical CMS visibility test to assert persistent footer information instead of the removed layout wrapper. Live validation then found classic-scrollbar wrapping at 768 px; a one-rule tablet legal-text adjustment was validated and released through the same workflow. Production read-only acceptance supersedes the earlier local CMS/staff limitations. See [footer deployment results](FOOTER-DEPLOYMENT-RESULTS-2026-10-09.md) for final source, exact scope, CI and live evidence.
