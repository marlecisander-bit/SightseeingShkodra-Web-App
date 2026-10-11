# Homepage hero redesign result — 12 October 2026

Implemented locally, not committed, pushed or deployed. Review checkout: `/private/tmp/sightseeing-hero-redesign-review`, based on published main `415f747`. Original mixed workspace changes preserved. No roadmap rewrite, hosted CMS save, booking submission, infrastructure or Live Tracking App change.

## Original architecture and audit

`HomepageView` renders the server `HomepageHero` with published Website fields, enabled primary product title, authoritative operational stop count and `home.heroFare`. `getImageProps` creates one responsive picture using the existing desktop/mobile CMS URLs, portrait breakpoint, quality 75, alt and focal-position fields. The prior hero covers a full viewport with text and two actions over the van photograph.

The public layout owns one `BookingProvider`, its native dialog, selection and `useAvailability`. `PublicBookingLink` opens that dialog for ordinary `/book` activation. `CheckoutFlow` retains date/passengers, departures, capacity, cutoff, seasonal/category pricing, existing-session recovery, hold/checkout/confirmation and QR behavior. Adults/children/infants, adult accompaniment and non-seat infants already belong to the canonical passenger model and controls. Availability quotes come from the existing public availability endpoint and booking engine; `nextHeroFare` selects one-adult quotes for the next bookable service date. No prices are administered independently in the hero.

Website > Homepage > Hero remains the sole editor for image variants, focal positions, alt, heading/emphasis, subtitle, description, visibility and action labels. Existing `--ss-*` tokens define primary red, yellow booking action, cream/white surfaces, text, typography, radii, shadow and focus. Existing `AmenityIcon` supplies the stop, clock, van and map SVGs. Header observes `#home-hero` and its `.p-button-booking`; its mobile navigation breakpoint is 900/901px. These hooks and header code are preserved. Other homepage breakpoints and sections remain unchanged.

## Final implementation

- Mobile: bounded van photograph, readable heading/subtitle on the existing cream surface, compact stop/All Day/Hop On-Hop Off icons, one daily-ticket date/passenger card, dated dynamic fare and one booking action. Live-map and discovery links follow; the longer CMS description is available through an accessible native disclosure.
- Tablet: fields and fare/action progressively share rows. Desktop: wide existing photograph, heading/benefits beside the card beneath the image, with both shortcuts and description disclosure below. Card does not cover the van. No new gradients or animation libraries.
- `HeroBookingWidget` reads and updates the existing booking context, reusing `BookingDateSelector`, `QuantityStepper`, `BookingPriceIndicator` and existing formatters. Passenger disclosure expands in document flow. Submit opens the existing dialog with selections intact. No hero departure selector, separate checkout or quote hook.
- Untouched date uses the existing next-bookable dated hero fare. An edited date uses available departures' supplied adult unit prices from the context quote. It never calculates seasonal rates. Loading/error/no-departure/invalid price clears the advertised amount; clearing the date leaves it blank and disables submit. Unpublished/missing product has no product widget or invented price.
- One responsive image remains eagerly loaded with high priority, reserved media height and the existing optimization pipeline. No added image asset, map embed, GPS request, subscription, timer, database migration, Supabase write, cron or dependency.

## CMS copy and compatibility

Saved heading/emphasis, subtitle/description, images/positions, alt and booking/map/discovery labels are still consumed directly. No CMS schema, editor or record was changed. Product title and stop count remain dynamic; five is displayed only when five authoritative stops are supplied.

Proposed CMS wording, shown in the visual review only: **See More Shkodra** (empty emphasis), **Check Availability**, **Follow Our Van Live**. Production still has its saved **Discover Shkodra. / Your way.**, **Book your day** and **Track live**. This implementation does not silently overwrite them. The longer existing headline was separately tested at every width. Applying the proposed wording is a future editorial decision through the existing CMS.

## Exact task files

- Modified: `src/components/public/homepage-hero.tsx`.
- Added: `src/components/public/hero-booking-widget.tsx`.
- Added: `src/components/public/homepage-hero.module.css`.
- Added: `tests/components/homepage-hero.test.mjs`.
- Added: this report.
- Documentation amendment: `docs/PHASE_STATUS.md`.

`HomepageView`, all sections below the hero, shared public CSS, header/footer, Route/Explore/FAQ, booking/backend/API files, admin/Auth, SEO and independent map are unchanged by this task. The isolated diff contains only the four implementation/test files. Earlier Tour/stops changes remain in the original workspace and production.

## Booking and pricing verification

Read-only local UI tests used the actual published desktop/mobile van photographs and a disposable synthetic availability fixture. The fixture reused `quoteAvailability` and never contacted production Supabase. Temporary API/page/layout overrides and fixture files were removed and original files restored before final checks.

- Select 13 October: supplied dated starting fare changes from synthetic €17.50 to €24.50; no hardcoded production fare.
- Add one child and infant: caption and category counts update; removing the last adult is disabled. Infant label retains “No seat required.”
- Submit: exactly one existing booking dialog opens with 13 October and 1 Adult / 1 Child / 1 Infant; four supplied departures render. No hold, customer details, booking or payment submission.
- No-departure date: no “From” amount; dialog retains responsibility for departure/availability feedback.
- Clear date: empty field, unavailable-price fallback and disabled submit; no stale initial fare/date restored.
- Existing reservation recovery is retained, including its priority for a previously saved checkout session.

SSR regressions verify saved CMS identity/assets/focal values/action labels, one hero widget and date control, dated canonical fare, existing passenger controls, and no fabricated unpublished-product offer. Existing booking/capacity/publication regression suites pass.

## Responsive/browser evidence

All requested widths checked: 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. No page horizontal overflow; one hero submit action; visible interactive targets at least 44 × 44px. Expanded passenger controls remain readable. Both proposed and longer saved headlines were checked. Native keyboard/date/passenger controls and dialog handoff work. Real homepage-path fixture confirms header booking suppression while the hero CTA is visible and existing solid/book state after scrolling to discovery.

Final proposed-copy measurements:

| Width | Hero height | Booking action bottom from document top |
| --- | ---: | ---: |
| 320 | 879 | 662 |
| 375 | 839 | 674 |
| 390 | 848 | 683 |
| 430 | 871 | 706 |
| 768 | 895 | 725 |
| 1024 | 759 | 631 |
| 1280 | 786 | 658 |
| 1440 | 824 | 696 |
| 1920 | 859 | 731 |

Screenshots are actual Chrome captures. Before screenshots show published CMS copy and real pricing; after screenshots use the proposed copy and clearly synthetic €17.50 fixture fare. They are layout evidence, not a production price change.

- Before mobile: `/private/tmp/hero-redesign/before-mobile.png`.
- Before desktop: `/private/tmp/hero-redesign/before-desktop.png`.
- Final mobile: `/private/tmp/hero-redesign/after-mobile.png`.
- Final desktop: `/private/tmp/hero-redesign/after-desktop.png`.
- Existing-heading review: `/private/tmp/hero-redesign/after-saved-headline-mobile.png`.
- Booking handoff: `/private/tmp/hero-redesign/booking-dialog.png`.
- Measurements: `proposed-copy-final-responsive.json`, `final-responsive.json`, `saved-heading-responsive.json` in the same directory. The final proposed-copy file reflects the last desktop spacing adjustment; earlier files record the longer saved-headline stress test.

## Performance comparison

Original desktop hero fills 900px in the paired capture; final proposed composition measures 824px at 1440px width. The mobile booking action is around 683px from document top at 390px width, with date/passenger controls included. Images retain the same CMS assets, responsive selection and quality; there is still one selected picture and no competing preload. Existing Arial/system typography adds no font download. Hero pricing shares the already-mounted provider; there is no duplicate availability request owner and no added interval.

Complete production client-chunk directory comparison against the clean published stops candidate: 497,185 → 503,027 gzip bytes (+5,842); raw JS 1,601,657 → 1,620,576 bytes. This measures all application client chunks, not homepage first-load transfer or a Lighthouse score. It establishes a small code-size increase, not zero added JavaScript. No new packages. Lightweight hero CSS is scoped; no other page stylesheet changed. Layout space is reserved before image load. Mobile network/LCP/CLS benchmarking and physical-device acceptance were not performed; no unmeasured speed improvement is claimed.

## Validation and deployment readiness

Clean production-based candidate: ESLint, TypeScript and optimized production build pass. Component suite: 42 passed; integration suite: 140 passed; identity suite: 17 passed. Original preserved workspace: lint/types/build and 44 components / 140 integrations pass (includes unrelated pending analytics tests). No failing/skipped tests in these runs. Stale generated dev types referenced a removed temporary fixture; generated types were cleared and recreated, with no application route changes left behind.

Logs: `/private/tmp/hero-redesign/{final-check,final-components,final-integrations,final-identity,workspace-check,workspace-components,workspace-integrations}.log`.

Ready for scoped review and a separately authorized deployment. No commit, push or deployment occurred. This clone lacks its existing public backend bindings, so actual published CMS/editorial parity and live seasonal pricing must be checked on a configured Preview/production after approval. Isolated quotes prove UI handoff and rate selection; they do not certify live schedule configuration, payment, QR scanning, native physical-device picker or real reservation mutation. Production remains untouched.

## Visual integration refinement — 12 October 2026

This follow-up supersedes the separated-photo/card composition described above. It is local only and adds no product elements or booking behavior.

The existing photograph and headline now share one visual region. The existing headline panel uses the same cream surface and radius token; the van remains unobstructed in the inspected phone/desktop compositions. The ticket card overlaps the photograph's lower background in normal document flow: 16px on phones, 24px on tablet and 40px on desktop. A reserved visual region keeps the overlap clear of the subject, and long text can increase its height. Only the background photograph is positioned absolutely; the headline and card stay in flow. The hero's white surface matches the next section, with reduced bottom spacing. No gradient or decorative graphic was added.

Card refinement uses the existing shadow/border/radius tokens, aligned field labels, compact spacing and one subtle divider before price/action. Date and passenger controls remain at least 44px. The form, quote selection, adult/child/infant rules, dialog, CMS fields, picture source/focal configuration, header/footer, other sections/routes, SEO and independent tracking code were not edited.

Exact additional task changes: `homepage-hero.tsx` (visual grouping), `homepage-hero.module.css` (layout/spacing), this report and `PHASE_STATUS.md`. `hero-booking-widget.tsx` and booking code are unchanged in this refinement.

Chrome widths 320/375/390/430/768/1024/1440/1920: no horizontal page overflow, no headline/card collision, loaded existing CMS image variants and minimum 44px controls. Closed card heights are 322px on phones and 260–284px on larger screens. The eight-width measurements are `/private/tmp/hero-integration/responsive.json`. Mobile/desktop screenshots were inspected for subject clearance; a photograph's subject is not a DOM box, so no automatic subject-detection claim is made.

Existing controls smoke: expanded family selector stays within the page; 1 Adult + 1 Child + 1 Infant prevents removal of the last adult. Exactly one existing dialog opens with all three counts and selected 13 October date intact; infant “No seat required” remains. The displayed synthetic €17.50 dated source and automated custom-fare tests verify unchanged price presentation. No live seasonal price, booking, hold, CMS save or database write was submitted. The clone's existing missing public backend configuration still limits live-data acceptance.

Before/after captures use the same published van assets and saved headline/action labels, with synthetic quote data (not production prices):

- `/private/tmp/hero-integration/before-mobile.png`
- `/private/tmp/hero-integration/after-mobile.png`
- `/private/tmp/hero-integration/before-desktop.png`
- `/private/tmp/hero-integration/after-desktop.png`

Temporary local page/layout and comparison components were removed; original routes were restored before verification. Clean candidate lint, TypeScript and optimized build pass; 42 component and 140 integration tests pass with no failures/skips. Original workspace lint/types/build also pass. Logs: `/private/tmp/hero-integration/{check,components,integrations,workspace-check}.log`. Only generated stale dev types were cleared during cleanup. No new dependency, request owner, timer, pricing calculation, backend change, commit, push or deployment.

## Publication authorization

Owner subsequently requested publication. Scoped release based on production 415f747 excludes unrelated analytics. Final full disposable suite passes 388 tests: 42 components, 17 identity, 140 integrations, 165 database and 24 PostgreSQL concurrency; no failures/skips. Production CMS wording and image configuration are preserved. Merge only after successful Project CI and Vercel Preview.
