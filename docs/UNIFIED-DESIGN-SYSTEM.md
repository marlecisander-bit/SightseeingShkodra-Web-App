# Unified van-inspired design system

2026-09-24. Visual refactor only; no database or operational logic changes.

## Audit and architecture
Public UI is shared public.css plus reusable Header, BookButton, BookingFields, ActionLink, Media, RoutePreview and CheckoutFlow. Admin uses CSS modules. No Tailwind configuration. Previous system centralized bright red but retained olive neutrals, serif display typography, inconsistent radii, local borders and shadows. Reused these existing components and the existing root token import; no new dependencies.

## Tokens and changes
Canonical source: src/app/brand-tokens.css. Raspberry #B91546 replaces #E71922. Yellow #F6C928 is used selectively for booking actions. Turquoise #18AFC1, green #78B82A and purple #7351A3 supply small destination/navigation/status accents. White #FFFFFF, cream #FFF8EE and sand #F2EADF dominate surfaces; charcoal #25232A is the text color.

Shared tokens cover hover/active/soft colors, accessible ink variants, focus, overlays, spacing, 16px card radius, 10px control radius, shadows, 44px minimum targets, 48px buttons, container widths and typography. Legacy brand-red names remain aliases to the canonical raspberry tokens, not independent colors.

Existing Arial sans-serif is reused for readable bold headings/body. Header is raspberry with white navigation and yellow booking CTA; light logo artwork retained. Compact 68px mobile/76px desktop header plus safe-area inset. White/cream cards use light borders/shadows; destination identity drives small colored circles and borders, without changing CMS order or content. Booking fields, dialog, progress and footer share the design. Admin remains neutral with raspberry actions/selected states. Local inactive map defaults use turquoise routes and green healthy vehicle markers; labels remain intact.

## Files changed in this task
- src/app/brand-tokens.css
- src/app/globals.css
- src/app/(public)/public.css
- src/components/public/booking.tsx
- src/components/public/checkout-flow.tsx
- src/components/public/route-preview.tsx
- src/components/public/live-map.module.css
- src/app/admin/admin.module.css
- src/app/admin/website-editor.module.css
- src/app/admin/schedule.module.css
- src/modules/tracking/shared-map.module.css
- src/modules/tracking/map-canvas.tsx
- src/modules/tracking/published-map.ts
- tests/integrations/tracking-reuse.test.mjs (existing default-color expectation)
- docs/DECISIONS.md, docs/PHASE_STATUS.md and this report.
Earlier CMS, schedules and upload changes remain separate existing work.

## Accessibility and mobile
White/raspberry 6.44:1; charcoal/yellow 9.84:1; raspberry/cream 6.11:1; charcoal/turquoise 5.87:1; charcoal/green 6.42:1; dark turquoise/white 6.36:1. Bright accent colors are not small white text backgrounds. Status labels remain alongside colors. Header keyboard focus uses yellow; other focus rings use dark turquoise. Navigation active state has an underline and aria-current. Booking progress wraps at narrow widths; controls remain touch sized, including CMS upload/source controls.

DOM width checks at 320, 375, 390, 430, 768, 1024 and 1440 found no page-level horizontal overflow on homepage, booking selection, booking dialog, live page and CMS (collapsed and expanded hero editor). Screenshots inspected for desktop homepage/destinations/CMS/live tracking and narrow homepage/menu/booking. Existing responsive CMS stacks naturally. Temporary viewport overrides reset after checks.

## Verification and limits
Lint and typecheck passed. Initial optimized production build passed; final build result recorded in phase status. 15 identity, 35 integration, 77 database and 19 real PostgreSQL tests passed (146 total). Five existing schedule tests failed because fixed 2026-09-24 fixtures expect the already-past 09:00 departure; no scheduling code was changed for this visual task. Full suite is therefore not green.

Authenticated owner CMS loaded saved Supabase content and its current hero image; public page showed that image. Opened editor and switched destination; no content was saved/published by this task. Booking dialog/selection renders; full reservation remains unavailable with draft/unpriced product. Live iframe loaded tiles, van and at-stop status. Fresh CMS/live browser console had no errors; an earlier tab logged hydration errors during dev-server restarts from build verification, not reproduced on fresh navigation.

Intentionally unchanged: logo artwork, CMS copy/images/order, URLs, database, authentication, booking calculations, GPS/ETA, explicit published GeoJSON colors and independent hosted map internals. The iframe cannot inherit this app's tokens; no external map deployment was made. Browser image-upload transport and full checkout are not certified by this visual refactor.
