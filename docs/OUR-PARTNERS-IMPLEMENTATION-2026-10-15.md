# Our Partners — local implementation, 15 October 2026

Implemented the supplied written brief. No mockup image was attached to this request; styling follows its white background, centered introduction, light borders and responsive logo-grid requirements. No deployment, hosted migration, CMS write or partner seed was performed. Existing unrelated workspace changes remain intact.

## Public presentation and placement

One server-rendered `PartnersSection` presents active, publishable partners in deterministic display-order/id order. It renders nothing when disabled or empty, including no heading, grid or CTA. Two columns below 640px, three from 640px, four from 1024px and six from 1280px. Each image has a fixed-height, proportion-preserving `object-fit: contain` slot, optimized Next Image output, lazy loading and meaningful alt text. Names and descriptions wrap; links cover the logo and name, use HTTPS, new tabs, `noopener noreferrer` and visible keyboard focus. Partners without websites remain unlinked. Optional red outlined CTA supports approved internal routes or HTTPS, hidden by default until configured.

The existing final booking invitation was extracted into `FinalBookingInvitation` without changing its markup. Homepage renders that shared invitation before Partners; the shared Footer suppresses its homepage invitation copy while retaining existing behavior on other pages. This places Partners immediately before the actual global footer and avoids duplicate invitations. A rendering regression test verifies the ordering and exactly one invitation.

No booking engine, live map, GPS, operational suppliers, infrastructure or existing section content was modified. Editorial partners are distinct from product suppliers.

## CMS and administration

`/admin/[operatorId]/partners` appears under Website navigation. It reuses the existing shell, role filtering, operator authorization, form styles, image uploader and error handling. Owners/admins can add/edit name, logo, HTTPS website, optional description, numeric order, active status, and delete through an explicit two-step confirmation. Saves affect the partner immediately; the UI explains this. Concurrent edits/deletes use `updated_at` matching and operator filters. Content editors have read-only partner access; they retain existing draft permissions for the section's text.

Website → Homepage → Our Partners owns exactly seven fields: `partners.eyebrow`, `partners.title`, `partners.description`, `partners.showOnHomepage`, `partners.ctaEnabled`, `partners.ctaLabel`, `partners.ctaUrl`. Manage-partners link opens the dedicated collection. These fields use the existing website document, optimistic save/publish RPC, private draft preview and layout invalidation. No section-ordering mechanism exists, so placement is fixed as requested. Existing publications gain defaults at read time; no stored content is rewritten by the migration.

Logo upload/replace reuses `ImageField`, `prepareWebsiteImage`, `uploadWebsiteImage` and the existing operator-prefixed `website-media` bucket. Original nonhero limit 8 MiB, upload limit 4 MiB; oversized supported images optimize to WebP with transparency. Server validates file signatures for PNG/JPEG/WebP/AVIF. Existing uploader rejects SVG/HTML. No external image host is introduced. Old/shared media files are retained on replacement/deletion; destructive automatic cleanup is deliberately absent because references may be shared. Abandoned uploads follow existing CMS retention behavior.

## Prepared database migration and security

`supabase/migrations/20261015000100_homepage_partners.sql` creates `public.partners` with UUID id, required operator ownership, name, logo URL, website URL, description, integer order, active flag and timestamps. Partial index supports public ordering. Required name/active logo and safe URL/media constraints apply in SQL and application validation. Remote logos must reference this operator's media path.

RLS permits public SELECT only of active rows with a logo. Staff can read inactive rows only for their own operator through `private.has_staff_role`. Anon/authenticated have no write grants or write policies. Privileged writes occur only after `withOperatorService(operatorId, 'content.publish')` authenticates and authorizes the actor; every update/delete scopes operator/id/stamp. No browser service credentials. This matches the existing Reviews management security model. Prepared migration also extends existing website validation, preserving prior validator behavior and old documents. Apply it in an isolated environment before hosted acceptance; it has NOT been applied to production.

## Validation and evidence

- Lint, Next type generation/type-check and normal optimized production build passed.
- Component, identity, database and integration suites passed; exact final counts are recorded in the completion note below.
- Disposable PGlite database applied actual migrations and verified constraints; anonymous inactive-row exclusion; denied browser INSERT/UPDATE/DELETE; cross-operator inactive-row isolation; service CRUD, logo replacement, URL/order updates, deactivation and deletion; old publication compatibility; unsafe settings rejection; private draft then publish and hide/show round trips.
- Existing image preparation integration tests passed, including upload size limits and oversized raster optimization.
- Public query tests verify explicit operator/active/logo filters, no-store reads and zero database requests when section is disabled.
- Local Chrome tested 320, 375, 390, 430, 768, 1024 and 1440px. No page/card overflow; expected 2/3/4/6 columns; images loaded with contain; safe external links. Empty/hidden states render no section. Twenty-item stress test at 320/1440px passed. Keyboard Tab produced visible focus. Viewport override reset.
- Screenshots: `private/partners-evidence/partners-375.png`, `partners-1440.png`; geometry: `partners-widths.json`. Development-only fixture uses existing photographs to exercise different aspect ratios and clearly labels them as layout samples, not approved logos/partners. No sample records are seeded. `/dev/partners-preview` returns notFound outside development.

Limitations: physical iPhone Safari/Android devices were not available; Chrome viewport checks are not physical-device certification. No authenticated hosted upload/save/delete was performed because the migration is local and production mutations/deployment are outside this brief. Admin CRUD is exercised against a disposable database; browser end-to-end authenticated admin acceptance remains for isolated staging. Real partner logos/names/URLs must be supplied by an authorized administrator. The public section correctly remains empty until then.

## Exact task files

Created:
- `src/modules/content/partners.ts`
- `src/modules/content/partner-settings.ts`
- `src/modules/content/partners-server.ts`
- `src/modules/content/website-links.ts` (existing link validators extracted unchanged)
- `src/components/public/partners-section.tsx`
- `src/components/public/partners-section.module.css`
- `src/app/admin/partner-actions.ts`
- `src/app/admin/partners-editor.tsx`
- `src/app/admin/partners-panel.tsx`
- `src/app/dev/partners-preview/page.tsx`
- `supabase/migrations/20261015000100_homepage_partners.sql`
- `tests/components/partners.test.mjs`
- `tests/database/partners.test.mjs`
- `tests/integrations/partners.test.mjs`
- this report

Modified within this task:
- `src/modules/content/website-schema.ts`, `src/modules/content/editorial-fields.ts`
- `src/modules/identity/admin-navigation.ts`
- `src/components/public/homepage-view.tsx`, `src/components/public/ui.tsx`, `src/components/public/final-invitation.tsx`
- `src/app/(public)/page.tsx`, `src/app/(public)/layout.tsx`
- `src/app/admin/[operatorId]/[section]/page.tsx`, `src/app/admin/[operatorId]/website-preview/page.tsx`
- `src/app/admin/admin-shell.tsx`, `src/app/admin/website-editor.tsx`, `src/app/admin/website-section-card.tsx`
- `tests/components/homepage-flow.test.mjs`, `tests/components/cms-visibility.test.mjs`
- `tests/identity/admin-navigation.test.mjs`, `tests/database/core-schema.test.mjs` (new navigation/table expectations)
- `docs/CMS-RECONCILIATION.md`, `docs/PHASE_STATUS.md`, `supabase/migrations/README.md`

These paths include files with prior unrelated changes; the full workspace diff is not a safe release manifest. A future publication must isolate this task against current production source and include the migration explicitly.

Completion evidence: final component/identity/database regression run passed 239/239 tests; integration suite passed 143/143 (382 total). Final `npm run check` passed lint, type-check and optimized production build. Logs: `/private/tmp/partners-regression-final.log`, `/private/tmp/partners-integration-final.log`, `/private/tmp/partners-check-final.log`. No deployment performed.
