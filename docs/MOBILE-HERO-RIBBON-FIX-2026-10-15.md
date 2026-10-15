# Mobile hero, ribbon and ticket CTA correction — local only

15 October 2026. This request supersedes the earlier explicit instruction to remove the ticket-card submit button.

## Root causes and changes

The black ribbon was exposed hero background: mobile media height was calc(100% - 56px), tablet calc(100% - 100px), but the visual wrapper remained charcoal and its gradient covered the whole wrapper. The white card overlapped only 48/56px, leaving a separate dark strip. Media now fills the entire visual wrapper; gradient remains confined to the same photographed area. No covering rectangle, new spacer, image replacement or hero-height increase. Card overlap remains 48px mobile and 56px tablet, expressed through one variable. Desktop already used full-height media and retains its image/focal composition and card top position.

The fixed header originally remained transparent until most of the whole hero left view, allowing headline text to blend with the logo as it scrolled underneath. Header measurement now writes --hero-header-offset from the actual border-box height (including existing safe-area padding). Mobile/tablet hero top padding uses this value plus 24px clearance. On mobile scroll the existing solid header treatment applies when the headline reaches the header. Desktop header behavior is unchanged.

The ticket CTA disappeared because the owner explicitly selected removal of that widget submit button in the earlier task. It is now restored inside the white Daily Ticket card, below the price, using the existing shared Button and p-button-booking variant. Brand #F6C928, dark text, full-width mobile, minimum 48px and existing hover/focus/disabled states. Existing form submission, booking provider, passenger selection and checkout are reused. Missing date, loading, availability errors and an authoritative quote with no available departures disable the card action; no capacity/pricing rules are calculated in the component. Initial fare/date may open checkout for further server-authoritative validation, as before. Navigation booking remains intact.

Card and amenities are registered with the existing WhatsApp obstacle avoidance mechanism, so the floating control moves or hides when no safe space is available. No new positioning service or subscription added.

## Exact files changed for this task

- src/components/public/hero-booking-widget.tsx — restored shared submit CTA, presentation eligibility guard, floating-obstacle marker.
- src/components/public/homepage-hero.module.css — full-height photograph, measured mobile content offset, controlled overlap and 48px CTA sizing.
- src/components/public/booking.tsx — header measurement and mobile headline/solid-header transition.
- src/components/public/homepage-hero.tsx — amenities obstacle marker.
- src/app/dev/hero-preview/page.tsx — optional local published-image/label fixture and existing WhatsApp component for faithful QA; remains development-only.
- tests/components/homepage-hero.test.mjs — restored single-submit assertion.
- docs/PHASE_STATUS.md and this report.

private/hero-layout-fixture.json contains only read-only public image references/focal positions used by the local development preview; no credentials or operational content. Not a CMS source. Preview uses synthetic fare/date/product for layout; published site data and saved CMS rows were not changed.

## Verification

Lint, typecheck and production build passed. 47 component tests and 10 focused booking/checkout tests passed. Seven Chrome local preview widths 320/375/390/430/768/1024/1440: no page overflow; five amenities share one top edge; photo bottom equals visual-wrapper bottom; card overlaps naturally and fully contains CTA; CTA is #F6C928 and 48px; no WhatsApp/CTA overlap. At mobile widths header bottom 68px and headline top 92px. Desktop card top remains 638px at the tested 900px viewport height. Card height increases only for restored CTA.

The restored CTA opened the existing booking dialog and handed over displayed fixture date plus two adults. Local configuration cannot quote actual departures; the subsequent loading/error state disabled the card action. No booking submitted. Scrolling mobile made header opaque before headline could show underneath logo. Original published mobile and desktop van images rendered without changing CMS focal values; screenshot inspection confirmed prominent van and no separate black strip.

Evidence: /private/tmp/hero-ribbon-fix/hero-375.png, hero-1440.png, widths.json. Physical iPhone Safari and device safe-area rendering were not available; safe-area CSS and measured-header fallback retained. No production deployment, Git push, CMS publication, backend/GPS/configuration or database changes.
