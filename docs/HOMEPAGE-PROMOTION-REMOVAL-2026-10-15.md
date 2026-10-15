# Homepage ticket promotion removal — 15 October 2026

Implemented locally only. No deployment, hosted CMS write, database migration or environment change.

Removed the complete `#home-ticket` section from `HomepageView`: introductory copy, product description/inclusions, stop/departure support, ticket/FAQ links, fare card and its booking CTA. This removes its section padding and beige card from the DOM, rather than hiding them through CSS. Existing adjacent sections retain their normal spacing.

Removed unused card-specific CSS and the ticket-only departure portal/target from `DayPlannerStrip`. The shared strip's polling, clock, schedule/live data, hero portal and other presentations remain unchanged. Shared `ExpandableText`, booking price controls and other reusable components remain available to their other consumers.

CMS: retired Homepage → A day with possibilities, its visibility switch and the now-unused inclusion-heading control. Retained all persisted `intro.*` and `tourPage.includedTitle` values/schema keys for existing documents and SQL validation compatibility. They have no homepage render path and cannot restore the promotion, regardless of stale true/false visibility. Existing shared product records, visitor action labels, pricing and other page data remain unchanged. Saving an obsolete intro editor is no longer accepted by the existing editable-section allowlist.

Preserved hero image/widget/yellow submit, global navigation booking, booking page/modal/engine, date/passenger selection, pricing/availability and confirmations. Partners, final invitation, footer and other homepage sections remain. No booking implementation or backend file changed.

## Task files modified

Application:
- `src/components/public/homepage-view.tsx`
- `src/components/public/day-planner-strip.tsx`
- `src/app/(public)/public.css`
- `src/modules/content/website-schema.ts`
- `src/modules/content/editorial-fields.ts`
- `src/app/admin/website-editor.tsx`
- `src/app/admin/website-section-card.tsx`

Regression expectations:
- `tests/components/homepage-flow.test.mjs`
- `tests/components/cms-visibility.test.mjs`
- `tests/components/editorial-connections.test.mjs`
- `tests/components/tour-removal.test.mjs`

Evidence/docs:
- this report
- `docs/CMS-RECONCILIATION.md`
- `docs/PHASE_STATUS.md`

The workspace already contains previous published work and the local Partners implementation; those changes were preserved, not reset or included in a new commit.

## Validation

- `npm run check`: lint, Next type generation/type-check and optimized production build passed, repeated after removing the temporary QA route.
- Component/identity tests: 69/69 passed. Integration tests: 143/143 passed. Includes existing hero, booking, CMS visibility/publication and other-page checks.
- Regression assertions verify the promotion is absent with stale `intro.showOnHomepage` set to either true or false; hero submit remains; obsolete controls are absent while stored data stays valid.
- Local Chrome shared-component fixture checked 320, 375, 390, 430, 768, 1024 and 1440px: no promotion wrapper/text, no horizontal overflow, no gap between the adjacent service/reviews section boxes; yellow hero submit remains #F6C928; Partners remains before the footer.
- Hero submit opened the existing dialog. Mobile navigation booking entry and desktop navigation booking entry also opened that shared dialog in the development preview. No booking submission, hold or confirmation created.
- Existing backend is not bound for live local availability: its honest unavailable state remains intact. Browser preview intentionally disables checkout mutations. Live availability, physical-device Safari and an actual booking transaction were not revalidated for this targeted removal.
- Screenshots and geometry: `private/promotion-removal-evidence/`. Screenshots use clearly synthetic local content/photographs, not production/CMS partner records. Temporary QA route removed after inspection. Viewport restored.

Logs: `/private/tmp/promotion-removal-check-final.log`, `/private/tmp/promotion-removal-tests.log`, `/private/tmp/promotion-removal-integrations.log`.
