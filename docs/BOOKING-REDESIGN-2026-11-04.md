# Responsive homepage and booking redesign — 4 November 2026

The candidate has been checked against the [approved mockup](https://chatgpt.com/s/m_6aeb0dc1844c819195a4f4a34687202b), published CMS content and live read-only availability. Publication is authorized by the owner's follow-up request once validation passes. The post-publication commit/deployment identities and hosted results are recorded separately in the local publication receipt.

Work uses the existing `SightseeingShkodra-Web-App` directory, explicitly authorized because the documented `-canonical` folder is absent. The branch is `work/responsive-booking-20261104`, based on production/main `f221bfd9dbc0c358778359480242cc9354f65e7f`. Unrelated local changes are excluded from the release.

## What changed

- Existing CMS hero photographs, focal positions, official branding, copy and product definitions remain authoritative. A restrained lower fade and greater overlap emphasize the product cards. Overlap is 88px on phones, 80px on tablets and 96px on desktop; the phone overlap is proportionally greater.
- Desktop product cards now pair the photograph with the offer text/action, following the approved reference. Mobile cards use a native horizontal rail with snap points, a next-card preview and accessible pagination. There is no autoplay or intercepted vertical gesture. Published descriptions, operational reservation duration, selected feature badges and real adult prices remain visible; actions align across cards.
- Product-specific `/book?productId=…` links retain the existing booking behavior. The hero CTA buttons and retired below-hero text strip were already absent and remain absent. Other navigation/Live Map access remains intact.
- Shared booking presentation now follows **When → Who → Review**. When selects the date/departure; Who retains the existing passenger rules and live quote hook; Review retains required name/email, optional phone, the existing review/confirm action, seat holds, idempotent retry and confirmation lifecycle.
- Phone dialogs fill the available viewport with independently scrolling content and actions outside the scroll region. Desktop dialogs retain separated fields and summary, constrained height and internal scrolling. Form-associated footer controls preserve native required-field validation. The full booking page keeps its footer visible on phones and short landscape screens.
- The footer includes the selected date/time and actual total. Explicit focus restoration, native Escape handling, focus trapping, safe areas, reduced motion and visual-viewport keyboard handling remain in place. Mobile navigation booking returns focus to the visible menu toggle after the navigation drawer closes. Product-specific booking pages avoid duplicating their existing product heading, while the generic `/book` entry retains its default product identity.
- A real over-capacity test exposed a navigation trap: Back to When could prevent returning to Who to reduce an unavailable group. An explicit **Edit passengers** action now permits recovery without discarding the selection.

The calendar remains the existing native date control. The mockup's illustrative wording, photographs, dates, departure examples and red CTA styling were not imported. The current brand palette, published CMS text/media, actual service data and selected feature badges are retained.

No booking/domain API, schema, authentication, pricing/capacity calculation, payment processing, notification/QR logic, analytics implementation, operational GPS or companion map source changed. No real reservation, hold, order, payment or communication was created during verification.

## Build repairs

The Turbopack stall was traced to a macOS `compressed,dataless` placeholder at `node_modules/next/dist/server/accept-header.d 2.ts`. Reinstalling with **`npm ci` from the unchanged lockfile** restored a complete dependency tree. No dependency version or package configuration changed.

Webpack rejected two global-only CSS Module selectors. The global homepage header rule moved into the existing global public stylesheet under the same desktop breakpoint. The development overlay selector now references the existing local `.reviewMarker` class while preserving its body/portal behavior. Validation was not disabled. Both normal Turbopack and diagnostic Webpack builds pass.

After removing the temporary real-CMS review route, stale generated Webpack route types still referenced it. Only generated `.next/types`/`.next/dev/types` were cleared; normal Next type generation and the complete check were then rerun successfully.

## Final validation

Evidence directory: `docs/evidence/booking-publication-20261104/`.

- Fresh full `npm test`: **670 passed, 0 failed** — 166 components, 24 identity, 228 integrations, 217 disposable database, 28 PostgreSQL and 7 CMS verification tests. [Final log](evidence/booking-publication-20261104/tests-final.log).
- **`npm run check` passes**: zero-warning lint, Next type generation/TypeScript and the normal production build. [Final log](evidence/booking-publication-20261104/check-final.log).
- Diagnostic Webpack production compilation also passes; see [build log](evidence/booking-publication-20261104/webpack-final.log).
- Production dependency audit: **0 vulnerabilities**. Package/lock files are unchanged. [Audit log](evidence/booking-publication-20261104/audit.log).
- `npm start` serves the production build successfully. Without privileged local backend bindings it serves the expected configuration-unavailable shell; this startup check is not represented as CMS parity. [Startup result](evidence/booking-publication-20261104/start-result.json).
- `git diff --check` passes.
- Chrome checks use the exact publicly published CMS content/product props, captured from `sightseeingshkodra.app`, and a fixed GET-only bridge to its public availability endpoint. The temporary review route was archived as text and removed from application source before final checks. No production credentials were copied into local development or Preview.
- Homepage and dialog layouts pass at **320, 375, 390, 430, 768, 1024 and 1440px**, plus **390×480** and **844×390**: no horizontal overflow, aligned card heights/actions, accessible close controls and visible fixed actions. Real desktop/mobile van photographs were visually inspected; mobile retains the complete vehicle above the cards, while desktop retains the vehicle/branding with its lower portion behind the intended overlap.
- Native Chrome touch gestures move the carousel, update pagination and allow independent vertical page scrolling. This uses touch emulation, not dispatched synthetic DOM TouchEvents.
- Real availability, adult/child/infant prices and ages, free infants, minimum-adult protection, over-capacity/unavailable departures, passenger-edit recovery and preserved date/departure/counts were checked. The Loop quote for 5 November showed 09:00/11:00/13:00/15:00; the reviewed 1-adult/1-child/1-infant quote was €18.00 at that time. Values remain live server data, not hardcoded application values.
- Checkout handoff uses the correct product, selected live departure and passenger counts; mutation requests are intercepted before any remote write. Contact/review UI is exercised with a **local-only hold response using the exact live passenger quote**, native required-field validation and keyboard text entry. It is not a real inventory/confirmation test. Footer form association, Back/contact preservation, Tab/Shift+Tab trapping, Escape/opener restoration, scroll locking, short-screen scrolling and hold restoration are checked. [Browser results](evidence/booking-publication-20261104/real-cms-browser-results.json), [runner](evidence/booking-publication-20261104/browser-review.mjs).
- Focused regression coverage protects progression without an early hold, loading/error blocking, minimum-adult protection, unavailable-group recovery, Back preservation, hold/release requests, footer date/time context and required form submission through the portalled footer.

## Files in the application/test change

- `src/app/(public)/public.css`
- `src/app/(public)/book/page.tsx`
- `src/app/dev/admin-v2/fixture.module.css` — CSS Module build repair only
- `src/components/public/booking.tsx`
- `src/components/public/checkout-flow.tsx`
- `src/components/public/booking-controls.tsx`
- `src/components/public/booking-dialog.module.css`
- `src/components/public/homepage-hero.module.css`
- `src/components/public/product-booking-cards.tsx`
- `src/components/public/product-booking-cards.module.css`
- `src/components/public/product-card-booking.tsx`
- `src/components/public/product-carousel.tsx` — new native rail/pagination wrapper
- `tests/components/booking-redesign.test.mjs` — focused regression test

This report, a scoped phase-status entry and selected release evidence accompany the change. Unrelated dirty documentation, historical receipts, other development routes and earlier local evidence remain preserved outside the release. Generated `next-env.d.ts` is restored after checks.

## Screenshots from real CMS content

- [Desktop homepage](evidence/booking-publication-20261104/cms-home-1440.png)
- [Desktop offer cards](evidence/booking-publication-20261104/cms-cards-1440.png)
- [Mobile homepage](evidence/booking-publication-20261104/cms-home-390.png)
- [Mobile cards](evidence/booking-publication-20261104/cms-cards-390.png)
- [Unavailable group](evidence/booking-publication-20261104/cms-unavailable-mobile.png)
- [Mobile passengers](evidence/booking-publication-20261104/cms-who-mobile.png)
- [Mobile review](evidence/booking-publication-20261104/cms-review-mobile.png)
- [Desktop booking](evidence/booking-publication-20261104/cms-dialog-desktop.png)
- [Mobile booking](evidence/booking-publication-20261104/cms-dialog-mobile.png)
- [Short mobile booking](evidence/booking-publication-20261104/cms-dialog-short.png)

## Publication and rollback

Observed workflow: feature branch push and PR CI → merge to `main` → Vercel Production. The current Vercel ignored-build rule cancels feature-branch builds; the first pushed candidate received `Canceled by Ignored Build Step`, with no Preview deployment created. This setting is preserved. No Preview acceptance is claimed; pre-merge content/interaction checks use the read-only real-CMS review described above. Before publication, GitHub's current main status is successful for Vercel and Verify project; its latest Production deployment maps to `f221bfd9dbc0c358778359480242cc9354f65e7f` in the expected `aleksander-marleci/sightseeing-shkodra-web-app` project. Existing deployment URL: `https://sightseeing-shkodra-web-nwi1mnlr4-aleksander-marleci.vercel.app`. See [baseline evidence](evidence/booking-publication-20261104/pre-publication-github.json).

Do not change Vercel/DNS/backend/map configuration. Preserve the previous production identity for rollback. A material release regression must restore the previous application through the existing deployment workflow; without direct Vercel dashboard access, a normal Git revert restores the prior source without rewriting main history. No schema reversal is required because this release has no migration.

## Verification limits

Physical iOS/Android devices, physical on-screen keyboards and real seat/order/payment creation are **not tested**. Responsive Chrome/touch emulation, live read-only queries, native keyboard events and intercepted mutation handoffs are distinguished above. No email/QR receipt or financial end-to-end success is claimed. Production acceptance must stop before creating a reservation; post-publication results and final immutable URL belong in the publication receipt.


## Published acceptance

PR #51 merged as **e47473289f93ffbc3301eedf7924a34c2c403783**. Vercel Production **FrDXzdsSgQTbC8WeGSEZ7cnXwuCb** is successful at `https://sightseeing-shkodra-web-69ag3pcs7-aleksander-marleci.vercel.app`. PR and main CI pass; the deployed source tree is identical to the validated final candidate.

Actual `.app` and `www.sightseeingshkodra.com` browser checks each pass nine homepage and nine dialog layouts, native touch swiping, real availability/prices/passenger rules, unavailable-group recovery, generic/product-specific booking identity, fixed phone/landscape actions, keyboard focus, Escape and preserved selection on reopening. Both record **zero checkout requests**. The existing non-www `.com` redirect resolves to the working www site. No material regression was found; rollback was not needed. Previous production identity is retained in the receipt.

- [Release receipt](evidence/booking-publication-20261104/publication-receipt.json)
- [Main CI/deployment status](evidence/booking-publication-20261104/production-status.json)
- [Published .app browser results](evidence/booking-publication-20261104/published-browser-results.json)
- [Published www browser results](evidence/booking-publication-20261104/www-published-browser-results.json)
- [Published desktop homepage](evidence/booking-publication-20261104/www-published-home-1440.png)
- [Published desktop cards](evidence/booking-publication-20261104/www-published-cards-1440.png)
- [Published mobile homepage](evidence/booking-publication-20261104/www-published-home-390.png)
- [Published mobile booking](evidence/booking-publication-20261104/www-published-booking-mobile.png)
- [Published mobile dialog](evidence/booking-publication-20261104/www-published-dialog-mobile.png)

Physical devices/on-screen keyboards remain unverified. Live production checks stop before reservation creation; pre-publication contact/confirmation verification uses the intercepted local hold response described above. Post-publication receipts/screenshots are retained locally rather than triggering a documentation-only production deployment. Unrelated working-tree changes remain preserved. No DNS, schema, GPS, delivery configuration or separate Live Map deployment changed.
