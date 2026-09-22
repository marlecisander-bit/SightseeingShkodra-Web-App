# Phase 3.5 - Public design foundation

Date: 2026-09-22. Scope: roadmap sections 14-15, after the accepted Phase 3 admin checkpoint. Result: implemented and visually reviewed in desktop Chrome and phone-size emulation. No production booking, payment or tracking connection is included.

## Design and components

The public route group replaces the coming-soon homepage with a photographic destination guide. Its CSS is scoped to `.public-site`; existing admin/auth styles and behavior are retained. The original roadmap and fresh-project decision are unchanged.

| Foundation | Implementation |
| --- | --- |
| Colors | Warm paper `#f8f6f0`, charcoal `#242921`, reference red `#7a2020`, muted `#61655c`, line `#d9d9ce`, surface `#eeeee5`; subdued green tracking placeholder |
| Typography | Georgia display headings and Arial UI, with local fallback stacks; no font downloads |
| Layout | 1320px container; responsive 22px-80px gutters; 64px-120px section spacing; layout transitions at 700/900/1100px |
| Surfaces | Mostly open editorial sections; 3px button corners; restrained dialog shadow; no carousel, decorative animation or gradient |
| Shared server-compatible pieces | ActionLink, Field, SectionHeading, Media, PreviewNote, Footer in `src/components/public/ui.tsx` |
| Client interaction | Header/mobile menu, BookingProvider, BookButton, BookingFields, QuantityStepper, BookingBar and BookingFlow in `booking.tsx` |
| Route/tracking boundary | RoutePreview destination selector and typed TrackingShell in `route-preview.tsx`; no map SDK, simulated GPS, ETA or routing engine |

The header changes from transparent to warm paper on scroll. Mobile has an independently composed hero, menu, safe-area-aware bottom actions after scrolling and a modal booking sheet. Desktop tour pages have a sticky booking card. The native dialog has an explicit keyboard wrap, Escape handling, focus return, background scroll lock and bounded height. Step changes focus the heading in view, below the header. Reduced-motion preferences disable transitions.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Hero, booking bar, daily-ticket explanation, route preview, four destination stories, live feature, how it works, departures empty state, genuine-review empty state, editorial grid, final image CTA, footer |
| `/tour` | Product shell with booking card, route, inclusions, timetable, live map, how it works, review shell and FAQ |
| `/book` | Selection -> Details -> Payment preview; payment disabled and total unavailable |
| `/your-day` | Explicitly invalid sample ticket/QR placeholder, vehicle status, timetable/boarding/help links and illustrative journey |
| `/live` | Unavailable tracking state and destination selector |
| `/explore` | Four destination guide shells with stable section anchors; not completed Phase 4 SEO articles |
| `/credits` | Image authors, original source links, licenses and adaptation notices |

The optional More Experiences section is omitted. All pages inherit noindex/nofollow. The text wordmark and reference red await an approved logo. English is the only implemented language; the interface does not pretend that translations are available. Contact/legal copy and genuine reviews remain launch content work.

## Data boundaries

`src/modules/public-preview/contracts.ts` holds the shared presentation facts, destination descriptors, BookingSelection, PublicBookingGateway and TrackingView. Availability types reuse the existing booking-domain DTOs by type-only import. The mock gateway returns a preview/unavailable response with no quote; it is an adapter contract for Phase 4, not a live API call. Presentation screens intentionally show unavailable price/total and unpublished timetable states. They do not calculate prices, reserve inventory, create orders or issue tickets.

The public layout retains date, guests and preview departure across client navigation and the sheet/flow. Refreshing the page resets the draft. A fictional name exists only in component memory; no customer or payment details are submitted or stored. No Supabase, Stripe, browser storage, geolocation or messaging call is made by the public previews. Actual customer/order/payment integration remains in its later phases.

Tracking follows the approved fresh-project amendment: there is no legacy map to import. The typed unavailable-state component is the integration boundary for the future shared tracking implementation. Destination selection changes the photo/detail panel; real route geometry and boarding information are not invented.

## Photography and performance

Four authentic Wikimedia Commons photographs are stored locally as WebP, with CC BY-SA 4.0 attribution and adaptation notices in `public/images/credits.json` and `/credits`. Contributors: Julianruizp (lake panorama and bridge), Exinvert (castle), Ambra Doci (centre). Original source and license links are recorded per image. The lake panorama is accurately described as a view from Rozafa, not a photograph taken in Shiroka. An initially downloaded bridge information-sign image was identified during visual review, replaced with a real bridge photograph and removed.

Next Image provides responsive sizes and lazy loading below the hero; hero media is preloaded. Mobile and desktop use different hero crop positions. Pages remain static and most content renders on the server. No third-party font, map or payment script loads. No measured Core Web Vitals or physical-device performance result is claimed.

## Verification

- All 97 existing tests passed: 15 identity, 5 integration, 63 database and 14 native PostgreSQL. These are regression checks, not new visual tests.
- Lint, TypeScript and production build passed; all seven public routes prerender as static pages. The initial lint run caught one unescaped apostrophe, corrected before the successful rerun.
- HTTP smoke checks returned 200, noindex and a main landmark on all seven pages; staff sign-in still rendered.
- Measured all seven public routes at 360/390/430/768/1280px: scroll width equaled client width (345/375/415/753/1265px, with a 15px scrollbar), without horizontal overflow.
- Visually inspected the full mobile homepage, booking/payment and sample-ticket layouts, desktop hero/tour/selected-stop/guide layouts. The initially cramped desktop hero was corrected: at 1280x720 the action row ends at about 540px and the fact line starts at 586px. A height-specific font cap also resolved the restored 1536x674 window, where actions now end at about 541px and facts begin at 569px.
- Found native-date state retention failure during browser testing. Added input/blur synchronization; date 2030-06-02, two guests and Morning preview then persisted through Details, Payment and a separate page's booking sheet.
- Verified quantity changes, selected departure, disabled payment, sample-ticket navigation, selected-stop photo changes, mobile menu, Escape close and focus return. Explicit Shift+Tab/Tab wrap stays inside the sheet. Step heading focus was visible at about 349px, below the 76px fixed header.
- At 360x800 the sheet fit from about y=166 to y=800; body scrolling was locked. Reduced-motion emulation reported a zero-second header transition. Credits links and primary controls use minimum 44px targets.

Browser emulation is not physical iOS/Android keyboard or assistive-technology testing. Full-page captures can place fixed elements at the current scroll offset; viewport/DOM geometry was used to distinguish screenshot artifacts from actual overlap. No production data, migrations, environment configuration or package dependency changed.

## Next work

Phase 4A connects the homepage to real structured product/content data. Before public launch, supply the approved brand asset, real prices, route and schedule, inclusion/accessibility details, contact/legal content and genuine review sources; finish physical-device and performance checks. These are expected later-phase inputs, not simulated facts in this foundation.

Roadmap deviations: none beyond the already recorded fresh-project amendment. Existing user changes to AGENTS.md and README.md remain outside this phase commit.
