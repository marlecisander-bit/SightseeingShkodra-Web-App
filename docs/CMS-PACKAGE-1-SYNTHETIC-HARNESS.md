# Package 1 synthetic Preview harness

16 October 2026. Separately approved test branch only: `test/cms-package-1-credential-free-preview`, based on exact Package 1 `ba257bc56cbdd6ee7920f603fabf7764accbc822`. Never merge this branch into main or into PR #19.

Route `/package1-harness` reuses actual unchanged HomepageHero, HeroBookingWidget, WebsiteSectionEditor/AmenitiesInput, DestinationsEditor and OverviewPanel. Synthetic local state supplies five amenities, preserved historical descriptions/retired keys, a distinctive booking label, three destinations and owner/admin/content_editor policy props. There is no authentication/session simulation, CMS persistence or operational test data.

All form submissions, uploads, list reorders and fixture admin links are intercepted. Shared booking provider uses its existing preview mode. Production builds and service-bound environments are rejected by a separate build guard. The route is runtime-gated to credential-free Vercel Preview and inherits noindex. Existing server authorization is untouched; disposable SQL/CI remains the actual permission proof. No production configuration or data is used.

Changes beyond Package 1: harness-only page/client/CSS, build safety script and guard regression, package build command invoking that safety check, this document. No existing admin/public component, schema, booking API, migration, dependency version or production configuration was modified. Remove this branch/deployment only with separate cleanup authorization; normal Package 1 release uses PR #19's original two commits and excludes every harness file.

Run lint/types/build and component/identity/database/integration suites before push. Hosted tests cover visible custom hero label and local changes, absent three controls, absent Description and retained synthetic JSON after title edit, both destination move states for owner/publisher/editor, Partners Overview description/order, shared booking preview dialog, empty-date guard and seven responsive widths. Distinguish UI policy props from actual authenticated-role authorization. No real checkout, Auth login, upload or backend write is exercised.
