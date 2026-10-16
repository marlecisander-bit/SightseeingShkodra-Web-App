# F04 local implementation result

16 October 2026, Europe/Tirane. **GO for review of the local F04 candidate. NO-GO for an application-only rollout or any hosted change under this authorization.** No commit, push, PR, Preview, merge, hosted migration, deployment or production data/configuration change occurred.

## Baseline, scope and amended decision

Checkout: /private/tmp/shkodra-cms-completion-20261016. Branch: implementation/cms-final-completion-2026-10-16. HEAD and read-only remote main: 8f71e2743bff64cc04018fb433f4c51066394b23. Main still matched at implementation start. The checkout already contained the previously reviewed, uncommitted completion-program changes; they were preserved. No unrelated changes from the original dirty IDE workspace were imported or modified. This is an additional local F04 package, not a claim that the combined branch contains F04 alone.

The latest explicit authorization supersedes the earlier plan to keep the description control editable: **all four controls are retired**, including meta_description. Stored descriptions remain available to the existing email snapshot/template consumer. New products can publish without that historical description; the unchanged template omits its optional About your ticket row when absent. No new description field, duplicate SEO owner or email-setting service was introduced.

## Implementation

- `src/modules/content/catalog-fields.ts` extracts the existing active Catalog editor inventory and explicitly identifies four compatibility-only keys. Product title, status, inclusions, protected slug/type bindings and supplier selection retain their existing owners.
- `src/app/admin/catalog-panel.tsx` removes the four controls from new/existing product forms, removes their upload presentation and unnecessary active-editor query columns, and explains Website SEO / Calendar pricing ownership. No hidden legacy input replaces them; missing properties really remain absent.
- `src/app/admin/catalog-actions.ts` retains optional older-form parsing through the shared compatibility-key list. Missing form values are not synthesized as empty strings. Authorization, protected product binding, RPC arguments, archive/delete confirmation and pricing action remain unchanged. Failure guidance now names active controls.
- The new SQL routine allows publication without legacy presentation values while retaining all columns, records and existing consumers.

## Exact SQL migration

File: `supabase/migrations/20261016000100_catalog_presentation_retirement.sql`.
SHA-256: `942835f1fb73e87ec0d0026c17c89ce27a3fd0143c856e61f1563e3b5179d808`.

The migration runs in a transaction and replaces only `public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)`. It removes the published-product nonblank meta_title/meta_description requirement. Each of the four legacy column assignments uses `CASE WHEN p_data ? key THEN existing legacy normalization ELSE stored_column END`, preserving omitted values exactly, including historical whitespace. Existing callers may still explicitly supply valid legacy values or explicit blank/null values under the old nullable write contract; retirement is not a new immutability rule for privileged legacy clients. There is no bulk UPDATE, data rewrite, column removal or fixture content in this migration.

An existing product row is locked before validating partial legacy image/alt edits. An omitted sibling is read from that same scoped row, and supplied image pairs retain HTTPS/nonblank-alt validation. Unusual historical image values are not newly revalidated when both image keys are omitted. Existing length limits for explicitly supplied legacy title/description remain. Active title/status/type/slug/inclusions validation, database constraints, supplier/operator foreign keys, developer-controlled binding trigger, archive behavior, activity/audit recording and role checks remain. Supplier and stop branches are unchanged. Function signature, invoker security, empty search_path and service-role-only execution grants are preserved explicitly.

## Data preservation and compatibility evidence

`tests/database/catalog-retirement.test.mjs` constructs the pre-migration schema using all existing migrations, loads disposable development fixtures and creates a legitimately published old-client Catalog record. It snapshots **every seeded public table row and column definition**, plus every public function definition/security/grant attribute, before and after applying the new migration. All seeded rows/column definitions compare equal. Only save_catalog_v1's body changes; function grants/security attributes compare equal. This is local synthetic preservation evidence, not an inspection or migration of hosted records.

Additional tests demonstrate:

- Owner/admin publication with none of the four legacy properties; their new stored values are NULL.
- Existing published products remain readable through the real public homepage RPC, including the retained email description.
- The actual loadHomepage DTO accepts a newly published metadata-free product and preserves unavailable pricing status rather than inventing a fare.
- Current active-only saves preserve all legacy values, commercial pricing/capacity JSON, supplier and protected bindings; injected pricing keys do not update commercial configuration.
- Older full/partial metadata callers remain compatible, with omitted siblings retained and invalid explicit image/title/description values rejected.
- Unusual historical spacing and an old non-HTTPS image remain byte-for-byte intact when omitted by current forms.
- Empty/oversized titles, invalid status/type/slug, oversized inclusions, invalid/foreign suppliers and malformed bodies are rejected without changing the product. A valid-looking attempt to change an existing protected slug still receives the existing developer-migration denial.
- Content editors, operations, unknown/disabled staff, wrong operators, cross-tenant records and anonymous/authenticated SQL roles cannot publish. Supplier validation remains intact.
- Rendering the actual CatalogRecordEditor for both new and existing records proves all four controls and historical values are absent while active fields remain.
- The real local email queue prepares a V2 snapshot containing retained Catalog copy; an active-only Catalog save preserves both that stored description and the frozen prepared message's snapshot/rendering. Mocked transports only; no email sent.

## F10 changes and counts

The four previous public-SEO FAILs were not turned into public-rendering PASS. Pre-retirement evidence is archived in `docs/CMS-F04-PRE-RETIREMENT-FINDINGS.json`. The current verifier asserts the actual shared active editor inventory excludes all four keys, saves an old-client record, edits it with a current metadata-free payload, reads the retained values, publishes a new metadata-free product, checks Website ownership of /book metadata and rejects unauthorized roles.

Those properties now appear in a **separate retired-Catalog compatibility collection: 4 PASS**, explicitly carrying no active public-rendering claim. Reintroducing a legacy control fails the inventory contract. Current active Website behavior remains **126 PASS / 0 FAIL / 0 UNTESTED**. Separate representative entity/boundary rows remain 5 PASS. Retained Website compatibility remains 84 PASS. Historical protected-code reference entries remain 41 UNTESTED. Independent checks: 21 PASS. These denominators overlap; no exhaustive all-CMS or protected-algorithm certification is asserted.

`npm run verify:cms` now genuinely exits **0** after retirement and compatibility proof. No ignore-exit wrapper or production build hook was added. Its finding/safety failures still yield nonzero status. The five former request/client gaps retain their executable local evidence from the prior completion work; no status was inferred from storage alone.

## Validation

| Check | Final result |
|---|---|
| npm run check | PASS: ESLint zero warnings, generated route types / TypeScript, production build |
| npm test | **438 PASS**, zero failures/skips: 64 component, 17 identity, 145 integration, 181 database, 24 PostgreSQL concurrency, 7 verifier |
| npm run verify:cms | PASS, exit 0; 126 active PASS and 4 separate retained-Catalog compatibility PASS |
| Focused Catalog/form/migration checks | 11 PASS; final strengthened publication/DTO check rerun: all 8 migration-suite tests PASS |
| Final lint / git diff --check | PASS |

Initial checks correctly failed the previous test that required Catalog SEO before publication; its expectation was updated to the newly authorized contract, retaining the negative legacy-image check and updating the audit-event count for the additional successful save. A new invalid-slug test initially expected the table format error but encountered the existing protected-binding trigger; the test now distinguishes invalid new slugs from prohibited existing-binding changes. Initial lint found unused destructured test variables; those were corrected. No application validator was weakened to satisfy these test-adapter/expectation issues.

Logs: /private/tmp/cms-f04-check.log, cms-f04-tests.log, cms-f04-verifier.log, cms-f04-catalog.log, cms-f04-publication-final.log and cms-f04-final-lint.log. No new authenticated hosted, physical-device or browser-persistence acceptance is claimed. Actual new/existing Catalog markup was rendered locally; broader prior responsive evidence remains separately scoped. No temporary route was introduced for this package.

Dependencies did not change during F04. The preceding local production-only audit was clean; the previously disclosed development-only ESLint/braces advisory remains a separate dependency-review issue, not newly resolved here.

## F04 affected-file manifest

- supabase/migrations/20261016000100_catalog_presentation_retirement.sql
- src/modules/content/catalog-fields.ts
- src/app/admin/catalog-panel.tsx
- src/app/admin/catalog-actions.ts
- scripts/cms-verification/entities.mjs
- scripts/cms-verification/verify.mjs
- tests/components/catalog-retirement.test.mjs
- tests/database/catalog-retirement.test.mjs
- tests/database/catalog.test.mjs
- tests/integrations/booking-emails.test.mjs
- tests/verification/cms-fields.test.mjs
- docs/CMS-F04-PRE-RETIREMENT-FINDINGS.json
- docs/CMS-F04-IMPLEMENTATION-RESULT.md
- Regenerated docs/CMS-F10-FIELD-RESULTS.json and CMS-F10-VERIFICATION-RESULT.md
- Current completion/ownership/status documentation updated to distinguish this authorized four-control retirement from the earlier three-control plan.

The full combined candidate manifest remains in CMS-FINAL-ACCEPTANCE-REPORT.md; prior completion changes are uncommitted and have not been silently included in a release.

## Release risk, ordering and rollback

**Do not deploy the new editor before the compatible SQL migration.** The old routine requires legacy presentation values for publication and overwrites absent values on drafts. An app-only release could therefore fail saves or erase omitted draft metadata. A future separately approved rollout must first apply/review this narrow migration against hosted Supabase, verify the RPC signature/grants and retained data, and only then deploy the corresponding reviewed application revision. No hosted migration or Vercel action has been authorized or executed now. Non-main pushes automatically create Preview in this single-production project, so do not push for review without separate release authorization.

The migration is compatible with the old editor, making migration-first ordering practical. If an authorized future application release regresses, restore the verified previous Ready app deployment while retaining the compatible SQL routine initially. Reverting the SQL to its old validator can prevent publication of newly created products with NULL legacy fields; do not invent/backfill values or run a destructive rollback. A separately reviewed SQL rollback must restore only the previous save_catalog_v1 definition/grants extracted from 20260924000300_cms_reconciliation.sql, **not rerun that whole historical migration**. No columns or stored data need restoration. Never reset/force-push main. Any hosted rollback still requires explicit authorization.

**Recommendation: GO for local F04 code/migration review; NO-GO for application-only deployment, unapproved hosted migration or a full-CMS acceptance claim.** F09 approved first-stop content and the broader disclosed manual/device/dependency limits remain outside this F04 implementation. Await separate authorization for GitHub publication, hosted Supabase migration and Vercel deployment.
