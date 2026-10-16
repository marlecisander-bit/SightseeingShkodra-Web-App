# Final CMS hosted read-only readiness checks

16 October 2026, approximately 11:43 Europe/Tirane (09:43 UTC). **Scoped schema/build checks PASS. Production execution remains NO-GO pending owner recovery-risk acceptance and an approved Preview/push procedure.** The user's “yes” authorized read-only Supabase backup/schema and Vercel configuration checks, not migration, backup creation, restore, settings changes, push, PR or deployment.

Implementation commit remains ff56557ea8d2b01a6b9577e42e4088e2ebc06a33; readiness commit remains 5fb987b83f3a575a65d1fb77a96acc6731c97468. This report and its readiness pointer are local uncommitted documentation only. No application code, migration text, tests or original IDE workspace changed during this inspection; the preceding 438-test/build results are not represented as a new test run.

## Supabase backup/recovery findings

Inspected the authenticated [scheduled-backup listing](https://supabase.com/dashboard/project/ybngoppqqiohcduojfyg/database/backups/scheduled) for sightseeing-shkodra-webapp, main / Production, project ybngoppqqiohcduojfyg. Dashboard project health was Healthy.

- Eight **Physical** backups were listed, dated 9–16 October 2026, with Restore controls available.
- Latest listed backup: **16 October 2026 02:09:30 UTC = 04:09:30 Europe/Tirane**. The UI did not expose a separate provider backup ID or completion log in this view; timestamp/project/type identify the observed entry. Do not invent an ID or claim a download/integrity check was completed.
- At inspection the latest snapshot was about 7 hours 34 minutes old. A whole-database recovery to that snapshot could lose intervening legitimate bookings/changes. This is the observed recovery-point age, not an accepted business RPO.
- The page says projects are backed up daily around regional midnight and can be restored. Visible entries establish backup availability in the dashboard; they do not prove a successful restoration, recovery duration, all restore privileges or a retention guarantee beyond the observed listing.
- The [Point in time page](https://supabase.com/dashboard/project/ybngoppqqiohcduojfyg/database/backups/pitr) displayed “Point in Time Recovery is available as an add-on” / “Enable the add-on.” PITR is **not enabled**; no add-on link was activated and no subscription changed.
- The backup page explicitly states **Storage objects are not included**: only their database metadata is backed up. No Storage object is modified by the proposed function-only migration, but this exclusion prevents a blanket full-site-backup claim. Auth/other recovery coverage was not separately exercised.

No Restore, Restore to new project, download/export, backup-creation or infrastructure-provisioning action was taken. A restore drill remains unperformed. The owner still needs to accept the observed daily-backup recovery limits and untested restore/RTO limitation, or authorize obtaining safer recovery evidence through the existing process. This report does not require or authorize PITR purchase or a new staging environment.

## Read-only schema preflight

Used the existing authenticated SQL Editor. Each submitted query explicitly began **BEGIN READ ONLY**, used a **15-second transaction-local statement timeout**, and ended COMMIT. Returned transaction_read_only was **on**. Queries returned function/column metadata, privileges, migration version/name entries and a product count/hash only; no customer rows, tokens, prices or Catalog content values were returned. No DDL, DML, function mutation, synthetic booking or CMS save was executed.

The SQL Editor automatically created an Untitled query entry while editing/executing query text; no explicit Save was used. That is dashboard query metadata, not a database schema/application-content/configuration change. No existing saved query was overwritten. An initial editor fill contained incomplete/stale text; it was cleared through normal keyboard controls, and the complete visible transaction was compared exactly with the intended SQL before Run. No partial/stale query was executed.

| Check | Observed result |
|---|---|
| Database / session | postgres; role postgres; PostgreSQL 17.6; read-only transaction on |
| Catalog routine | save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean), owned by postgres |
| Routine security | SECURITY INVOKER; empty search_path; ACL postgres/service_role only |
| Execution | anon false; authenticated false; service_role true |
| Current routine body | Matches pre-F04 20260924000300_cms_reconciliation.sql after SQL-token normalization preserving quoted literals; differences are formatting/CRLF/indentation |
| Current source MD5 | 85ce52d344f294065de2ad4b843bc964 (byte hash of hosted prosrc, not the normalized comparison) |
| Retired columns | All four exist as nullable text; no column removal required |
| Commercial columns | pricing_rules and capacity_rules remain non-null jsonb; passenger_pricing remains present |
| Current connection capability | Public-schema CREATE privilege true; current role also owns the target routine. Feasible existing controlled SQL Editor path; no write was attempted to prove execution |
| Products | Five rows; private aggregate fingerprint captured, with no row values returned |
| Proposed new migration | 20261016000100 absent from history, as expected; forward routine not applied |

Captured the **actual current pg_get_functiondef output** privately for narrow recovery review, plus its owner/ACL metadata. Captured definition SHA-256: 3d723a1adc14b8f3f3bd53662d3c891b320267f18727303bbc4dc4b0f4f68f45. This is a routine-definition capture, not a database backup, and no returned CREATE statement was executed. Before a future migration, recheck for drift and capture a fresh definition/grant snapshot; these observations are not a permanent guarantee.

### Migration history

Hosted history contains **38 entries**, through homepage_partners (20261015000100), against 45 baseline migration files. The same seven previously documented baseline versions are absent from history:

- 20260924000100
- 20260924000200
- 20260924000300
- 20260924000400
- 20260928000100
- 20260930000100
- 20261001000100

No extra hosted versions were found relative to the baseline; this narrow check compares version/name entries, not full statement/checksum provenance or every schema object. The missing history entries are not proof those effects are missing—the hosted Catalog body already matches the reconciliation source. Do not replay them or run unrestricted db push. Only the separately approved new migration/history entry may be considered under a future controlled release. No ledger entry was inserted, changed or removed.

## Vercel configuration findings

Freshly inspected [Build and Deployment](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/build-and-deployment), [Git settings](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/git), [Environments](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/environments) and the [current deployment](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/31a1BBpeXgCaAbZ8SBLfPJk1aqAH).

| Check | Result |
|---|---|
| Framework/runtime | Next.js; Node 24.x |
| Build/install/output/development overrides | Off; command fields disabled/empty; root directory empty |
| Ignored Build Step | Automatic |
| Deployment Checks | No checks configured |
| Git repository | marlecisander-bit/SightseeingShkodra-Web-App remains connected; UI describes deployments for pushed commits |
| Production branch | main; domain sightseeingshkodra.app |
| Preview branch tracking | **All unassigned git branches** |
| Current deployment | dpl_31a1BBpeXgCaAbZ8SBLfPJk1aqAH; Ready / Latest / Production / Current |
| Current source | main, 8f71e2743bff64cc04018fb433f4c51066394b23 |
| Immutable URL | https://sightseeing-shkodra-web-7s9n5ghe3-aleksander-marleci.vercel.app |
| Retention setting | Production and pre-production deployments each show 30 days; future rollback target availability must be rechecked |
| Rollback UI | Project overview offers an enabled Instant Rollback control; no rollback action or restore operation was performed |

With default Next.js settings and the reviewed unchanged package build (`node scripts/check-deployment-env.mjs && next build`), **verify:cms is not executed by the production build**. No custom deployment check is presently configured to gate automatic Production promotion. Main CI and Vercel still need the existing pre-merge checks; no push/new hosted run was triggered here.

A non-main branch push remains deployment-triggering. This project has no dedicated staging database, and a Preview URL does not establish isolated external services. Environment variable values and secret stores were not revealed or inspected in this pass, so no new Preview credential-isolation guarantee is asserted. The prior independent public map binding remains untouched. An approved deployment-control/Preview procedure is still required before pushing/opening a new PR.

No Save, deployment/rollback action, environment edit, domain change, integration change or “Only build production” setting was applied. Current Production is a recorded possible future app rollback target; an actual rollback to it after a later release is not yet tested or guaranteed.

## Updated release decision

**Scoped schema compatibility and normal production build: PASS.** Backup existence is now supported by fresh dashboard evidence, and the actual Catalog recovery definition is captured. This clears the earlier “no current backup listing/schema/settings evidence” uncertainty only to the extent stated above.

**Production execution remains on hold:** owner acceptance of the daily snapshot recovery point/Storage exclusion and untested restore/RTO limit is outstanding; Preview/push handling is unresolved; production mutation/release approval is still absent. Do not infer permission to migrate from approval of these read-only checks. F09 approved editorial content/placeholder acceptance remains separately outstanding.

The required future order remains backup/recovery gate → approved migration → read-only old-app verification → reviewed main merge → automatic Vercel Production build → read-only acceptance. Do not deploy the metadata-free editor before the migration. No synthetic hosted publication acceptance is claimed.

## Private evidence and local state

Ignored, mode-600 evidence under `private/cms-production-readonly/`: schema-preflight.json, column-preflight.json, preflight-readonly.sql, catalog-production-definition.sql, scheduled-backups.txt, pitr.txt, vercel-production.txt, vercel-environments.txt, vercel-build.json, vercel-build-controls.json, vercel-build-snapshot.txt and evidence-summary.json. These files are not staged/committed or deployed. Some raw dashboard text includes account labels; it stays private.

No application/migration/test change and no further commit was made. The two existing local release commits remain unchanged. Only this report and a current-evidence pointer in the readiness document are uncommitted for review. No GitHub push/PR/merge, Preview, hosted migration, database restore or Vercel deployment occurred.
