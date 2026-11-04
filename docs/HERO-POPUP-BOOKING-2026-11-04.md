# Hero composition and complete booking popup — local review

Implemented locally on `work/hero-popup-booking-20261104`, based on main `e47473289f93ffbc3301eedf7924a34c2c403783`. The owner subsequently authorized publication on 4 November 2026. Release preparation uses the existing feature → PR CI → main → Vercel production workflow. Existing unrelated local changes remain present. The current source folder is owner-authorized because the documented canonical folder is absent.

## Result

The homepage places its saved headline/supporting copy on the left and two portrait product cards on the right inside the hero. A subtle blur applies only to the CMS background photograph; foreground images and text stay sharp. Mobile/tablet uses the headline above a native swipe/snap rail with next-card peek and accessible pagination. Heights, prices and actions align; the hero grows with its content. CMS products and existing content, images, features and prices remain authoritative. One offer fits without horizontal overflow; extra offers gain desktop browsing arrows and matching pagination. Two desktop cards have no visible browsing controls. No autoplay or added dependency.

Normal activation of each product action opens its own product-selected native dialog on the current URL. Modified/new-tab activation and direct `/book?productId=…` URLs remain available. Nested product providers inherit saved CMS dialog content and meeting-point configuration. Existing shared When → Who → Review, availability hook, server contracts, capacity/passenger rules, contact validation, checkout and confirmation remain in use. The existing supported collection mode is payment at the meeting point; no payment provider was introduced.

Dialog closing is guarded while a mutation is pending. A contact draft requires an inline discard decision; Keep editing preserves the mounted form, while discard clears only contact details. Date, departure and passenger selections remain in their product provider and existing hold restoration still uses its session state. A confirmed order closes without a discard prompt. Native Escape, focus trapping/restoration, background scroll restoration and same-URL browser Back handling are supported. Mobile keeps the existing visual-viewport/safe-area sizing and fixed action footer.

## Verification

- Final `npm test`: 670 passed, zero failed/skipped (166 component, 24 identity, 228 integration, 217 database, 28 PostgreSQL, 7 CMS verification).
- `npm run check`: zero-warning lint, generated route types/TypeScript and normal `npm run build` all pass with Turbopack. No build bypass, validation disabling or package/lockfile changes.
- `git diff --check`: pass.
- Updated component regressions cover closed product-specific dialog markup/direct URLs, inherited CMS headings, and clean/dirty/busy checkout state reporting. Existing booking rules and server tests remain green.
- Native headless Chrome/CDP checks: 360×800, 390×844, 768×1024, 1024×768, 1440×900, 390×480 and 844×390. No horizontal document overflow; headline and cards never intersect; both desktop cards fit beside the headline; equal card heights; complete cards/actions inside hero bounds.
- One/two/four-product cases checked; four-product desktop arrow scrolling and four pagination buttons verified. Extra products are explicitly local layout variants. Native mobile touch swiping changes the selected card.
- Both product actions open the matching product on the unchanged page URL. Clean Escape and browser Back close; focus and original page scroll return. Native Tab wraps inside the dialog. Dirty close and Back show the inline guard; Keep editing retains contact values; discard/reopen clears them. Pending order prevents close/Back escape; rapid repeated submit makes one order request.
- Actual published CMS snapshot and assets used, alongside the revised owner-provided mockup: https://chatgpt.com/s/m_6aeb1ded2ffc8191ab1f997f05c9a24c . The snapshot is the public content captured earlier on 4 November, not a newly published CMS revision.
- Live public availability GET verified for the loop on 5 November at 11:00. One adult, one child and one infant quote €18; adult floor and child/infant controls checked. Subsequent hold/order/read/session responses were intercepted locally. Contact required validation, Review/back preservation, confirmation/reference/QR/payment-due display and management action render through the existing shared flow. No real hold, order, reservation, payment, email or notification was created.

An initial test-suite failure exposed an unqualified computed-style lookup in DOM tests; the carousel now reads its owning window. Browser harness fixes addressed selector escaping, a deliberately invalid mock QR credential, and waiting for asynchronous native close/history cleanup; these were corrected before the final successful run.

## Evidence and limits

Evidence: `docs/evidence/hero-popup-20261104/` contains final logs, browser assertions, revised mockup and screenshots. `home-1440.png`, `home-mobile-full.png`, `future-products.png`, `dialog-desktop.png`, `review-mobile.png` and `confirmation-mobile.png` are the principal review images. Confirmation is visibly marked `LOCAL-REVIEW-ONLY`; its QR is a test credential, not a valid ticket.

The temporary review route and fixed upstream GET-only proxy were removed before the final build. Their exact source is archived as `.txt` under `review-harness/`; the browser runner expects those files restored locally under `src/app/dev/hero-popup-review/` and `npm run dev`. They must not become production booking fixtures.

Physical phones/tablets and real iOS/Android on-screen keyboards were unavailable. Short, landscape, native touch, keyboard navigation and reduced viewport geometry were exercised in Chromium emulation; actual keyboard/visual-viewport behavior on hardware remains unverified. Safari/WebKit and Firefox were not exercised. Real checkout mutations, email delivery and live ticket validity were intentionally untested. No implementation blocker was observed within the verified local scope; publication is now authorized, pending exact-head PR/main CI and live acceptance. Publication receipts will be recorded under `docs/evidence/hero-popup-publication-20261104/`.
