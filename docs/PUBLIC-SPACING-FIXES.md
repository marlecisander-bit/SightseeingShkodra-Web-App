# Public spacing fixes - 29 September 2026

- Restored responsive section padding above homepage Today, at a glance.
- Aligned the cream Live Map band with the shared content gutters.
- Adjacent white sections now share one vertical spacing interval; Tour reviews use one set of gutters.
- All Explore destination action pairs use a wrapping 16px gap.

Verification: homepage at 320, 390, 768 and 1440px; Tour at 390 and 1440px; all four Explore button pairs at 320, 390, 768 and 1440px. No document overflow observed. Desktop screenshots inspected. Six component and nine public-homepage integration tests passed. Working-tree lint, typecheck and production build passed. Physical-device validation remains outstanding.

Scope: presentation only; no booking, CMS persistence, email, database or independent map-engine changes.

The isolated release checkout also passed lint, typecheck and production build before publication.
