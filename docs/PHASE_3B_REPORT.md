# Phase 3B catalog management

Implemented catalog forms within the protected admin workspace for product create/edit/archive, supplier create/edit/delete and stop create/edit/delete. Includes product type, slug, publication state, supplier link, SEO title/description, HTTPS social image URL and alt text; stop product link, coordinates and ordering. Controls have labels, keyboard focus, expandable editors and explicit archive/delete confirmation checkboxes.

Server Actions reauthorize catalog.manage and derive operator/actor from verified staff context. save_catalog_v1 independently verifies active owner/admin membership and updates only whitelisted columns. SQL validates publication/SEO/image requirements, names, types, and relies on existing tenant foreign keys, coordinate checks and unique slugs/stop positions. Mutation and catalog.changed event/audit commit atomically. Referenced suppliers cannot be deleted; archiving products preserves orders/bookings. Failed writes return a generic field/link guidance message without database details.

No price/capacity logic is duplicated in forms; existing pricing_rules/capacity_rules are preserved. Publishing catalog content does not by itself configure a saleable experience. No automatic selling price or configuration was invented. Product/supplier type choices are the initial supported V1 set. Lists currently show at most 100 records per group; pagination and stale-edit conflict detection are limitations to resolve as catalog volume/concurrent editing grows.

## Verification and pending checks

Added database tests for create/edit/archive, SEO/alt-text rejection, duplicate stop ordering, referenced-supplier deletion denial, audit persistence, foreign tenant/parent rejection and unauthorized role denial. Build/lint/typecheck pass. No browser is connected for visual QA; desktop/mobile rendering and interactive form submission remain unverified. Phase 3A visual QA and owner onboarding remain pending; no real staff account was provisioned.

Files: catalog-actions.ts, catalog-panel.tsx, admin workspace page/styles; migration 20260921000900_catalog_management.sql; tests/database/catalog.test.mjs. No new environment variables. Next implementation phase is 3C departures/capacity, after reviewing this catalog UI.

Final results: npm test passed 91 tests; lint/typecheck/build passed. Migration dry-run selected only the catalog migration, then development push succeeded. Hosted Auth/local HTTP verifier confirmed the catalog forms render for an authorized owner and existing role/tenant checks still pass. Its initial text assertion required stripping React HTML comment separators; the corrected verifier passed and cleaned temporary accounts. No hosted catalog test data was inserted. Browser form-submission/visual acceptance remains pending.
