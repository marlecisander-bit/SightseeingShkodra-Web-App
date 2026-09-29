# Mobile homepage hero simplification

29 September 2026. Local implementation only; not deployed.

## Audit and reuse

The existing HomepageHero in src/components/public/homepage-hero.tsx renders the CMS title, emphasis, descriptions, labels, desktop/mobile image sources and focal positions. Its single picture uses next/image getImageProps, a 700px source breakpoint, eager loading and high fetch priority. The current mobile photograph is approximately 9:16 and contains the branded van. No image was replaced or duplicated.

Header in booking.tsx retains BrandLogo, menu state, navigation, scroll behavior and the desktop BookButton. Hero ActionLink already navigates to /book, which uses the existing three-step CheckoutFlow. Tracking already navigates to /live and its independent iframe. None of those actions changed.

HomepageView supplies adultFares and date from the existing homepage data loader. lowestQuotedFare and BookingPriceIndicator remain the price projection and formatter. This is the existing date-scoped quote, not a general season-wide minimum. General From remains BACKEND-DATA LIMITATION. The latest user brief explicitly requests hiding the mobile date; no backend scope or price calculation was changed.

## Changes

- At widths up to 700px, the homepage header hides its duplicate Book button and leaves logo and a 44px Menu target.
- The eyebrow and longer description are hidden on mobile; the existing headline and short CMS subtitle remain. No CMS data was edited or deleted.
- The existing image occupies a portrait region independently of the hero's content height. Its existing mobile focal position remains active. The van is fully visible in the checked image; the commercial controls sit below it.
- The price remains dynamic. A span around its date permits hiding it only inside the mobile hero. Other price surfaces retain their date.
- One full-width yellow booking CTA precedes the quieter tracking link. The existing CMS scroll cue remains.
- The hero can grow beyond a short viewport, uses stable small-viewport minimum height and safe-area padding, and keeps all lower actions reachable by scrolling. Landscape at mobile widths deliberately scrolls rather than compressing the portrait photograph or overlaying its van. Wider layouts retain the existing desktop/tablet breakpoint behavior.
- Existing colors, fonts, logo, image, radii, shadows and action implementations retained. Three application files changed; no dependency, additional JavaScript behavior, request, asset, migration or business-logic change.

## Verification

Required viewport settings checked: 320x568, 375x667, 390x844, 393x852 and 430x932. Chrome rounded the requested 393px width to 394 CSS pixels in this session; exact 393px hardware rendering is unverified. Additional geometry checks: 568x320, 667x375, 844x390, 1440x900 and 1920x1080. No document horizontal overflow was observed. Representative screenshots at all five portrait settings were inspected: headline and subtitle above the van, price/CTA below, no controls over the van, header logo/menu visible. The yellow CTA fit in each requested portrait viewport; lower tracking/scroll controls require scrolling on short phones. These are desktop Chrome emulation checks, not device certification.

At 1440x900 the deployed baseline and local candidate have identical measured header, headline, price and actions geometry and typography. Desktop copy, date, header CTA and side-by-side actions remain. Menu open/close and Escape, keyboard focus, homepage logo navigation and hero /book navigation were exercised. The current independent map remained the tracking destination. Hero retains one image element and the same responsive image source/loading mechanism. No duplicate image downloads or extra hero JavaScript were introduced by the diff; complete network/Core Web Vitals profiling was not performed.

Full npm test: 269 passed, zero failed/skipped (17 identity, 96 integration, 133 database, 23 PostgreSQL). npm run check passed: lint, TypeScript and production build. Logs: private/mobile-hero-tests.log and private/mobile-hero-check.log. Application diff whitespace check passed. Existing tests were used; no implementation-mirroring tests added for the CSS change.

## Remaining acceptance limits

Physical iPhone Safari and Android Chrome were unavailable. Real browser chrome expansion/collapse and nonzero device safe-area rendering remain unverified. CSS safe-area support is present but is not device evidence. Comprehensive accessibility and performance acceptance remain incomplete. Existing CMS hero alt text describes a castle river view although the current photograph features the van; this pre-existing content mismatch was retained rather than changing hosted CMS content during a presentation task.

The requested PASS/FAIL-only physical-device labels must be read as FAIL to establish acceptance, not observed device failures. Tested local layout and functionality passed; full acceptance cannot be certified until the remaining checks are completed. No deployment performed.
