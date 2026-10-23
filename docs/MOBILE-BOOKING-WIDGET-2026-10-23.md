# Compact mobile booking widget — 23 October 2026

Local implementation: `/private/tmp/shkodra-mobile-widget-20261023`. No push, merge, deployment, production writes, schema changes or pricing changes. Isolated from the original dirty IDE worktree and the separate unpublished hero, customer email and notification redesigns.

## Result

At widths below 600px the existing ticket card has a two-column product/price header, prominent authoritative From price, two side-by-side date/passenger fields with contextual icons and one full-width yellow CTA. Existing CMS product title and hero.book CTA remain authoritative. Daily Ticket remains the existing subtitle. The native date input, passenger categories and shared checkout dialog are reused. Passenger details appear in a width-constrained overlay, close on outside pointer or Escape and restore summary focus on Escape. The collapsed summary truncates visually while keeping its complete accessible text; all categories remain editable in the expanded control.

The card retains its existing 48px mobile hero overlap. Hero image, typography, benefits, amenities, header, shortcuts and other homepage sections were not redesigned. All visual overrides are scoped below 600px. Tablet and desktop card placement/price/fields/button remain unchanged. The only shared behavioral additions are dismissal and explicit suppression of a price while availability is loading.

## Measurements and screenshots

A comparable local 390px preview measured 433.375px before and 229.195px after: approximately 47% shorter. The earlier fixture uses a different short product title, so this is a layout comparison rather than pixel-identical content. The standard title remains about 229px at 320/360/375/390/430px. Tablet (768px) remains about 349px; desktop (1024/1440px) about 262px. No horizontal overflow was observed at any of the eight requested widths. Fields have a 62px minimum container; the date input and passenger/action controls have at least 44px interaction targets.

- Before: `/private/tmp/widget-before.png`
- Mobile 375px: `/private/tmp/widget-375.png`
- Mobile 390px: `/private/tmp/widget-390.png`
- Desktop 1440px: `/private/tmp/widget-desktop.png`

Screenshots use synthetic €10/2030 date and a local product label; they do not assert that production currently charges €10. The existing saved hero-image fixture supplies the same photograph/focal configuration. No separate image mockup was supplied in this brief.

## Pricing and booking verification

`src/modules/content/homepage.ts` obtains the one-adult hero quote through the existing source and `adultHeroFare`/`nextHeroFare` in `src/modules/content/hero-fare.ts`. It selects an available departure on the canonical bookable date. The widget displays that server-supplied dated amount before selection, then adult unit prices from available departures in the existing `useAvailability` quote after selection. It does not claim a season-wide minimum or selected-party total. It performs no new quote request or price arithmetic. Non-integer/negative/non-finite amounts and loading/error states do not display a confirmed fare. Currency formatting reuses bookingMoney.

Existing date changes still clear the departure, passenger steppers still enforce existing adult/child/infant constraints, and submission retains the existing date/passenger context and opens the existing checkout. No booking/hold was submitted to a backend during validation.

All 489 tests passed: components 93, identity 23, integrations 158, database 182, PostgreSQL 26 and CMS 7. New tests exercise actual BookingProvider/passenger controls with a synthetic availability hook: authoritative adult fare selection, exclusion of unavailable fares, loading/error states, date input updates, category preservation, Escape focus and opening the existing preview dialog. Existing suites protect pricing, cutoff, availability and capacity behavior. The focused tests passed again after the final price validation/date-event test. Final lint, TypeScript and production build passed; git diff --check passed. Browser inspection also verified passenger overlay bounds and category updates without writes.

## Localization, accessibility and limits

The current application exposes EN with “More languages coming soon”; booking labels and the native input are not connected to a five-language localization system. This task preserves the existing CMS bindings rather than adding a second translation source. Synthetic long product titles in English, Italian, French, German and Spanish fit at 320px without overflow. Long titles naturally increase card height to approximately 255–276px; they are not clipped. This is text-fit verification, not complete translated booking support.

The current date selector is a browser-native date input. It retains its keyboard/native picker behavior and browser-specific formatting; it does not display an availability-colored calendar or disable individual sold-out days. Availability and cutoff remain enforced by the existing quote and checkout paths after date selection. Creating a custom calendar or expanding backend availability was not undertaken. Native mobile OS picker dismissal and screen-reader announcement were not independently tested. Focus styles, native labels, live price/loading feedback, category labels and essential validation remain present.

The implementation is ready for local owner review. The complete five-language experience and availability-colored date calendar requested in the brief remain limitations of the existing application. Production release also needs reconciliation with the separate unpublished hero/email/notification work and normal release checks. No live quote or checkout acceptance was exercised.

## Changed files

- `src/components/public/hero-booking-widget.tsx`
- `src/components/public/homepage-hero.module.css`
- `src/app/dev/hero-preview/page.tsx` — synthetic date/title and long-copy query option, development only
- `tests/components/mobile-booking-widget.test.mjs`
- This report and `docs/PHASE_STATUS.md`

No environment variables, migrations or architecture changes.

Owner refinement: removed the mobile price underline on 23 October 2026. Mobile-only decorative pseudo-element removed; desktop and booking logic unchanged.
