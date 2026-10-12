# Homepage hero V2 — local review, 12 October 2026

User explicitly chose the written brief because no mockup was attached. Local implementation only; no commit, push, deployment, CMS save or infrastructure change. Published production remains PR #10/main 79198a6. Original mixed workspace edits are preserved.

## Audit and scope

HomepageView -> HomepageHero renders published Website fields, authoritative stop count, product title and dated heroFare. HeroBookingWidget consumes one BookingProvider/useAvailability and the existing BookingDateSelector, QuantityStepper, BookingPriceIndicator, passenger formatters and dialog/CheckoutFlow. Departures are selected in that existing dialog; there was no departure field in the homepage widget to preserve. Adult/child seats, zero-seat infants, seasonal/category prices, cutoff, holds, customer management and notifications remain in the booking domain.

Hero photos are the same CMS desktop/mobile URLs, optimized through getImageProps into one picture/img with sizes=100vw, quality 75 and eager/high priority. Phone portrait source remains <=599px; tablet/landscape uses the existing desktop photo. CMS focal/alt values remain consumed. Header uses its existing IntersectionObserver, sticky states, navigation and menu; no header component or global style change.

Website > Homepage > Hero owns copy/photos/focal fields/actions; existing Hero amenities owns labels/icons/order/publication. V2 restores consumption of publishedAmenities instead of introducing another benefits model. CMS amenities replace the existing default benefit row when configured; draft amenities are excluded. With no published amenities, existing operational stop count/product facts remain, plus the existing live label when enabled. Wi-Fi is never fabricated by the fallback. Descriptions/data remain stored unchanged; the compact row displays titles/icons.

## Visual changes

- Desktop: immersive 620–720px photographic region adjusted to viewport height; white 48–60px heading, restrained left gradient, compact red circular icons. Existing widget spans the content grid; date/passengers and canonical fare/red submit share a horizontal row. 64px overlap, existing 16px radius, subtle shadow.
- Phone: 560px reserved region with a balanced 32–38px heading over the original portrait photo. A small reserved lower band keeps benefit icons clear of the vehicle and card. Two-column benefits; full-width date/passenger controls, unchanged disclosure and checkout interaction. 48px overlap in normal flow.
- Tablet: landscape photo, constrained left text, 56px overlap and progressive two-column controls. Large landscape screen: separate responsive crop. At >=1600px the CMS horizontal focal choice remains; vertical center becomes bottom to keep the panoramic crop's wheels above the card. Explicit top/bottom choices remain unchanged. Text aligns with header gutter at those widths to clear the vehicle.
- Price region reserves 84px so ordinary loading/fare wrapping does not move the booking action. Passenger disclosure intentionally expands in document flow. Header CTA still appears when the card's action is outside the viewport, and hides when that action is visible. A full-page phone screenshot can show both, although they do not compete in the same viewport.

## CMS copy shown in review

The requested headline, longer subtitle, Check Availability arrow and four requested benefit labels are passed through EXISTING CMS fields in an isolated local fixture. No literal replacement was added to application JSX or schema defaults; saved CMS copy remains authoritative. The €17.50/€24.50 fixture prices/date and Wi-Fi label are demonstration inputs, not production configuration or verified service claims. Applying new wording/benefits to actual content later requires the existing CMS draft/publish flow. Fixture values are recorded under /private/tmp/hero-v2/proposed-cms-fields.json.

## Exact task files

1. src/components/public/homepage-hero.tsx — published CMS benefits and grouping; derived wide crop.
2. src/components/public/homepage-hero.module.css — hero/card presentation and responsive rules.
3. tests/components/homepage-hero.test.mjs — meaningful published-order/draft-claim/fallback regression.
4. docs/HOMEPAGE-HERO-V2-LOCAL-REVIEW.md — this report.
5. docs/PHASE_STATUS.md — local evidence checkpoint.

HeroBookingWidget is byte-identical to the task-start snapshot. HomepageView, remaining sections, shared header/footer, other routes, booking API/domain, CMS schema/editor/records, environment, Supabase and independent map are unchanged by this task. Original unrelated edits remain present.

## Validation

Clean candidate based on production 79198a6: locked npm ci, lint, TypeScript and optimized production build pass. Complete suite passes 389 tests: 43 components, 17 identity, 140 integrations, 165 disposable database and 24 local PostgreSQL concurrency tests; zero failures/skips. Original workspace final npm run check also passes. Initial workspace 45 component/140 integration runs pass. Source diff and widget byte comparison confirm scope.

Chrome portrait widths 320/375/390/430/768/1024/1280/1440/1920: no horizontal page overflow, one widget/action, every visible hero target >=44px, benefit/card separation. Measured overlap 48px phones, 56px tablet, 64px desktop. Desktop at 900px viewport height is 702px; at 1080px it caps at 720px. Landscape 844x390 and 1024x768 also pass overflow checks. Image crops inspected at narrow phone/tablet/1024/1440/1920; final wide crop clears wheels.

Synthetic availability fixture reuses quoteAvailability, category snapshots and existing contract. Edited 2 July 2030 uses supplied €24.50 adult fare; 3 July has no departures and clears the price. Clearing date disables submit and preserves fallback. 1 adult + 1 child + 1 infant disables last-adult removal. Existing dialog retains edited date/counts, lists four supplied departures and selects 09:00 with canonical €33.50 total; Continue is enabled but NEVER activated. No hold, customer details, reservation or payment. Escape closes dialog. Keyboard Enter toggles native passenger disclosure at 320px, 3px focus outline and all counter targets >=44px without overflow.

Optimized local screenshot fixture removes development overlays. A delayed QA-only PerformanceObserver avoids hydration interference and reads buffered layout-shift entries: initial-render CLS 0 at 390x900 and 1440x900 after the image loads. This is local fixture evidence, not Lighthouse, throttled-network or physical-device certification. First development instrumentation changed a root attribute too early and generated a fixture-only hydration warning; it was removed and superseded by the optimized measurements. No instrumentation remains in application source. White/red button contrast is 6.44:1. No new animation, font, library or client request owner.

## Screenshots and limitations

Final 1440px desktop: /private/tmp/hero-v2/after-desktop.jpg.
Final 390px mobile: /private/tmp/hero-v2/after-mobile.jpg.
Before captures: before-desktop.jpg / before-mobile.jpg in the same directory. Responsive/landscape/CLS JSON and check/test logs are there as well. Initial per-width captures are development evidence; the two final deliverables are optimized-build captures. Next-section fixture uses the existing p-home-stops wrapper; other page content was not reconstructed.

NOT VERIFIED: physical iPhone Safari/Android Chrome, native virtual keyboard/calendar positioning on physical devices, authenticated CMS publish-to-public mutation, actual seasonal configuration and end-to-end live reservation. Local clone lacks public backend bindings, so checks use isolated fixtures and existing automated booking/publication tests. New CMS copy/benefit claims are proposals until applied through Admin. Image composition remains dependent on future asset/focal choices and unusually long CMS copy.

Temporary page/layout/API/instrumentation fixtures are restored before delivery. Production remains unchanged. Local review is ready; production deployment requires a separate explicit approval.
