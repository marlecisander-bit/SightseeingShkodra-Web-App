# Compact hero amenities — local only, 14 October 2026

The existing hero now defaults to five features in order: published stop count, All Day, Hop On/Off, Audio Guide, and the saved tracking label. Audio Guide reuses the existing headphones stroke icon and brand-red circular background. No navigation destination was added.

Mobile uses `repeat(5, minmax(0, 1fr))`, 4px gaps, 28px circles, centered labels below icons and 9–11px responsive typography. Labels may wrap within a column. Desktop/tablet uses a single flex row with icons beside labels. Existing image sources, focal positions, overlays, headline, hero heights and booking controls were preserved.

CMS: the existing hero.amenities editor is restored under Website > Homepage > Hero amenities, with corrected help text. No duplicate field or table. Saved custom rows retain their labels, icons, ordering and visibility; an entirely hidden custom list remains hidden. Empty custom configuration uses the existing service-default fallback, now centrally resolved in hero-amenities.ts. If a saved custom list omits Audio Guide, add a row with the headphones icon through this editor and preview before publication; no saved/cloud content was modified by this local task.

Files changed for this task:
- src/modules/content/hero-amenities.ts
- src/components/public/homepage-hero.tsx
- src/components/public/homepage-hero.module.css
- src/modules/content/website-schema.ts
- src/app/admin/hero-amenities-input.tsx
- src/app/admin/website-workspace.tsx
- src/app/admin/website-section-card.tsx
- src/app/dev/hero-preview/page.tsx (development-only preview now supplies its missing booking provider and the five service defaults)
- tests/components/homepage-hero.test.mjs
- tests/components/homepage-flow.test.mjs
- tests/components/editorial-connections.test.mjs

Validation: lint, typecheck and production build passed; 47 component tests passed, including CMS order/draft suppression, five default benefits and hiding all configured amenities. Chrome local hero preview at 320, 375, 390, 430, 768 and 1440px: all five item tops equal, no page overflow, no overlapping items; row height 55.5px at 320, 45–47px at 375–430, 28px at 768/1440. Hero visual height remains 560px mobile, 620px tablet and 702px at the tested desktop viewport. Header booking dialog opens/closes; tracking shortcut retains /route. Decorative icons retain aria-hidden; feature labels remain accessible text. Existing white-on-red and white-on-photo treatment preserved. Screenshots visually inspected after image loading.

Evidence: /private/tmp/compact-hero-amenities/hero-320.png, hero-1440.png and measurements.json. Preview uses the existing bundled default lake photograph and synthetic product title; it does not validate the production CMS van photograph. Actual public CMS unavailable in local configuration, so the development-only preview renders the same hero component for layout acceptance.

No deployment, push, commit, migration, environment or production CMS changes. Existing workspace modifications preserved.

## Production release — 14 October 2026

User authorized publication. Isolated release from production e760655; PR #15 https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/15 merged as 9018e71c88b41f2925a6de854d35dd17e1231882. Final release b8e5d54 includes the corrected integration expectation for the restored existing amenity editor. All 393 tests pass: 229 component/identity/domain, 140 integration, 24 disposable local Postgres. Lint/types/build and GitHub CI pass. Preview BUSHssz8jSgEk6mv8JdrH5oF9HoY Ready; CMS-unconfigured shell only. Production 9wQB6tgQMeKi6WGn9XD2ps2ciHED Ready, source 9018e71. Existing Git integration used; no provider/environment/database/tracking changes. Previous production AFG419JsqpnZZtwnUVvgh1ogYroQ retained. Original dirty workspace untouched by release checkout.

Live homepage now has a saved custom CMS list: Free Wifi, 5 Stops, 7 Langueges Audioguide. It overrides the default five-feature list, as required by CMS ownership. The pre-release read showed four defaults; this discrepancy is recorded without overwriting current saved content or inferring who changed it. Five default features were verified locally; production currently renders three custom items in the five-column layout. To show the originally requested five features on production, the saved amenity configuration needs to be reconciled through Website > Homepage > Hero amenities. No production CMS writes were performed.

Live checks at 320/375/390/430/768/1440: current three items remain on one row with no page overflow. Mobile long custom label wraps within its own column, row height 57–67px; desktop row 28px. Current published van photograph is visible; image rendering/focal/headline code untouched. Homepage header booking action focuses existing date input, matching the established homepage behavior (not a modal while the hero widget exists). No reservations submitted.

After screenshots visually inspected: /private/tmp/compact-hero-live/after-320.png and after-1440.png; measurements in widths.json. Browser stalled once and verification completed after reconnecting.
