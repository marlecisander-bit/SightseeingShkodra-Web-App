# F04 Catalog ownership result and retirement plan

> Historical planning decision below. The later explicit F04 authorization supersedes the three-control plan and retires all four controls locally, including meta_description. Stored email copy remains preserved. See [CMS-F04-IMPLEMENTATION-RESULT.md](CMS-F04-IMPLEMENTATION-RESULT.md) for current implementation, tests and migration-first release requirements.

16 October 2026. Local work only. **Partial: truthful labels ready for review; retirement migration remains unimplemented.** The user chose “Keep email description; plan retirement of unused controls.” This does not authorize a production migration.

## Established ownership

| Stored property | Current consumer / requirement | Resolution |
|---|---|---|
| products.meta_title | Current save_catalog_v1 requires a nonblank value when publishing; public Website SEO does not consume it | Label as legacy publication title; plan retirement of the editor control and publication requirement |
| products.meta_description | Current publication validator requires it; transactional email snapshot reads it as item description, and V2 email renders “About your ticket” | Keep editable with truthful booking-email wording; preserve the column and email consumer |
| products.og_image | Retained Catalog data; not consumed by the tested public page presentation | Label as legacy image pending compatible retirement |
| products.og_image_alt | Required by current validator when a Catalog image is supplied | Retain alongside image until the validator and editor can change together |

Evidence: src/app/admin/catalog-panel.tsx; supabase/migrations/20260921000900_catalog_management.sql, supabase/migrations/20260924000300_cms_reconciliation.sql; transactional snapshot in supabase/migrations/20261005000400_transactional_email_completion.sql; src/modules/integrations/booking-email-template-v2.ts. Website owns homepage and /book search presentation. Calendar & Pricing owns passenger fares. Product title, status, inclusions and stored history retain their current authorities.

## Implemented and verified

Only Catalog labels/help changed in src/app/admin/catalog-panel.tsx, including the publication guidance below the editor. All existing fields, names, values and submission shape remain. No SQL, server action, permission or catalog concurrency behavior changed. Existing Catalog/database regressions pass. tests/components/editorial-connections.test.mjs additionally proves the saved item description renders, escaped, in the actual V2 email. This is local template evidence; no email was sent.

The F10 four Catalog public-presentation probes remain FAIL. In particular, a working email description is not evidence that Catalog owns public SEO. The finding’s original public-presentation denominator is retained rather than silently reclassified.

## Proposed separate compatible migration

Review an additive replacement of save_catalog_v1 against its actual latest definition and grants. Remove only the published-product nonblank meta_title requirement. Keep the booking-email description requirement unless separately changed by a business decision. Permit clients to omit meta_title, og_image and og_image_alt while preserving existing column values on updates; distinguish an omitted property from an explicit historical-client value. Continue validating supplied historical properties, image/alt pairs, product status, title, type, supplier and inclusions. Preserve operator/role authorization, grants, atomic behavior and all stored rows. Do not drop columns or scrub values.

Only after those RPC compatibility tests pass should the three legacy controls be excluded from the active editor. Existing action parsing must preserve omitted legacy values and must not turn their absence into empty-string overwrites. Test old and new clients, publish with retained old metadata, publish a new product without legacy SEO, reject missing required email copy, wrong tenant/role and invalid supplied legacy image pairs. Verify existing email snapshots/retries, Website /book metadata and Calendar pricing are unchanged. Retiring controls must update the verifier’s declared active Catalog inventory with explicit compatibility evidence; do not hide FAIL entries merely to get a green command.

Rollback requires a reviewed reverse RPC definition plus restoring the three editor controls; retained columns make data restoration unnecessary. No migration file has been created or executed. **Next decision: review and authorize that narrowly scoped local migration implementation.**
