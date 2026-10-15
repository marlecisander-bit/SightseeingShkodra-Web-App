# Homepage hero header cleanup — local only, 15 October 2026

Cause of the horizontal seam: header retained a transparent 1px bottom border from the original header rule. Its gradient background used default background-repeat:repeat with background-origin:padding-box, allowing the gradient to tile into the border strip. Live computed styles confirmed the 1px transparent border, repeating gradient, no shadow, no backdrop filter and no separator pseudo-elements. Homepage header now has border-bottom:0; all transparent-header gradient declarations use no-repeat. Gradient colors, hero image/focal positions and sticky transitions remain unchanged.

CTA clarification: user explicitly selected removing the widget submit button while keeping its fields and navigation booking. HeroBookingWidget no longer renders the yellow submit CTA; dated fare and date/passenger controls remain. The purchase layout has one column so no empty button column remains. Homepage desktop/mobile navigation now opens the existing shared checkout and transfers the hero date (including a displayed default date) into the same booking context. Passenger selection already shares that context. Other-page booking actions remain unchanged.

A separate mobile/banner duplicate was also found: the shared yellow booking style overrode the earlier mobile header hiding rule. Homepage-only CSS suppresses that outer mobile CTA; mobile drawer and desktop header booking remain.

Files changed for this task:
- src/app/(public)/public.css — non-repeating transparent gradient, zero homepage header border, homepage-only mobile outer CTA suppression.
- src/components/public/homepage-hero.module.css — non-repeating desktop transparent-header gradient override and single-column fare area.
- src/components/public/booking.tsx — homepage navigation hands the displayed hero date to existing checkout; optional previewPathname supports accurate development preview.
- src/components/public/hero-booking-widget.tsx — removed submit CTA and its unused label prop.
- src/components/public/homepage-hero.tsx — removed unused widget label prop.
- tests/components/homepage-hero.test.mjs — expects preserved date/price/passengers without a hero submit CTA.
- src/app/dev/hero-preview/page.tsx — selects homepage header preview state.
- docs/HERO-HEADER-CLEANUP-2026-10-15.md and docs/PHASE_STATUS.md — evidence.

Verification: lint, typecheck, production build and all 47 component tests passed. Six actual viewport widths 320/375/430/768/1024/1440: no page overflow, zero header bottom border and no-repeat gradient; hero fields remain, zero hero booking CTAs. Desktop navigation and mobile menu both open checkout. Selected 17 October 2026 and two adults transferred from hero to mobile-menu checkout; no reservation submitted. Local availability cannot complete because CMS/backend is unconfigured. Screenshot: /private/tmp/hero-header-cleanup/no-widget-cta-mobile.png.

Local CMS is unconfigured, so visual testing used the existing development-only hero preview with the same hero/header components and bundled lake photograph. Production read-only inspection showed the current published van photograph and five saved custom amenities; those content rows were left untouched. No deployment, Git push, CMS save, environment or infrastructure mutation performed.

