# Final CMS release gates

16 October 2026, Europe/Tirane. **GO for review of the tested recovery procedure; NO-GO for remote release execution until the owner decisions below are approved.** This work performed local tests and authenticated read-only Vercel inspection only. No push, PR, merge, hosted SQL, restore, deployment, cloud-setting change or PITR purchase occurred. The original IDE workspace was untouched.

## Candidate and current baseline

Fresh `git ls-remote origin refs/heads/main` returned **8f71e2743bff64cc04018fb433f4c51066394b23**, matching the production source recorded in the hosted readiness report. Local branch remains `implementation/cms-final-completion-2026-10-16` in `/private/tmp/shkodra-cms-completion-20261016`:

- Implementation: **ff56557ea8d2b01a6b9577e42e4088e2ebc06a33**.
- Readiness/HEAD: **5fb987b83f3a575a65d1fb77a96acc6731c97468**.

No new commit was created. This report, the new recovery reference and its regression test are local/uncommitted additions; the earlier hosted read-only report and readiness pointer are also uncommitted. They are not silently included in those reviewed SHAs. Any eventual release manifest must explicitly review these additions and identify its final commit. Existing implementation/migration text is unchanged.

## Tested production-capture rollback

Executable reference: `docs/release/CMS-F04-PRODUCTION-FUNCTION-ROLLBACK.sql`, outside automatic migrations. It restores only `public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)` using the captured production definition and its exact source from the read-only JSON result. The dashboard definition display and decoded source are distinct representations; the decoded source preserves the actual CRLF bytes and quoted literals. The older `CMS-F04-ROLLBACK-CATALOG.sql` remains a repository-baseline reference; use the production-capture reference for this recovery plan.

| Artifact/check | Value |
|---|---|
| Captured routine definition evidence SHA-256 | `3d723a1adc14b8f3f3bd53662d3c891b320267f18727303bbc4dc4b0f4f68f45` |
| Exact captured `prosrc` MD5, reproduced after recovery | `85ce52d344f294065de2ad4b843bc964` |
| Recovery SQL SHA-256 | `5c3a9549d70a9e43095bfe71c211dd09ec1ad7bddd416b7b2091531c298df029` |
| Forward migration | `20261016000100_catalog_presentation_retirement.sql` |
| Forward SHA-256 | `942835f1fb73e87ec0d0026c17c89ce27a3fd0143c856e61f1563e3b5179d808` |
| Owner | `postgres` |
| Security / search path | Explicit `SECURITY INVOKER`; `search_path = ''` |
| Execution ACL | `postgres=X/postgres, service_role=X/postgres`; PUBLIC/anon/authenticated denied |

The recovery SQL is one transaction, with five-second lock and thirty-second statement timeouts, CREATE OR REPLACE FUNCTION, explicit owner restoration, revoke from PUBLIC/anon/authenticated and service_role EXECUTE grant. It does not drop the routine, alter columns, update rows, change RLS or restore a database. Errors require transaction rollback and investigation; do not ignore timeout or permission errors. Before real use, obtain a fresh definition/owner/ACL/config capture and compare it to this reference. Any intervening routine or grant change invalidates automatic use of this static artifact.

Rehearsal: `node --test tests/postgres/catalog-function-recovery.test.mjs`, using disposable embedded PostgreSQL and loopback-only connections. All baseline migrations and development fixtures were installed, then the actual captured production routine established as the old-version baseline. Synthetic data included a published legacy product with all four retained fields, EUR 1200-cent pricing, capacity three, a consumed hold and confirmed booking with an occupied seat. The test:

1. Snapshots every public-table row and every public function definition, owner, ACL and security configuration.
2. Applies the forward migration; proves all existing public rows unchanged, all other routines unchanged, target owner/security/grants unchanged and commercial availability unchanged.
3. Exercises old-client publication inside a rolled-back local transaction, and successfully publishes a metadata-free product under the new routine.
4. Restores the captured production function; proves exact pre-upgrade routine metadata/source restoration and preserves every current row, including the post-upgrade product. Public product loading and commercial availability still work; anonymous/authenticated execution remains denied and service_role execution remains allowed.
5. Confirms that the old validator rejects the new editor's metadata-free publication; reapplies the forward routine and proves rows remain unchanged and upgraded routine definitions are restored.

The first test attempt compared the response's changing `as_of` timestamp; the corrected assertion compares all commercial fields while checking that a timestamp remains present. No application or SQL rule was changed to make the test pass. This is local recovery evidence, not a production restore drill or proof of hosted execution privileges at release time.

### Operational rollback order and limits

If an application regression occurs after release, first restore the separately approved previous Ready Vercel Production artifact and verify it read-only. The forward SQL is compatible with that old application, so retaining it is the default recovery choice. Do not restore the stricter old SQL while the metadata-free new editor is serving writes. If SQL recovery is required, prevent Catalog editing through an approved operational procedure, establish the old application is current, compare fresh function state to the expected forward routine, and execute the separately authorized function-only rollback transaction. Recheck owner/ACL/config/source, public availability and aggregate fingerprints afterward. Coordinate in-flight Catalog writes; use timeouts rather than unbounded locking.

Function recovery does not undo legitimate Catalog edits, bookings or products created since upgrade. Such metadata-free products remain readable/published but old-client future publication may require legacy fields. Do not backfill or delete them automatically. It cannot repair unrelated corruption, restore Storage objects, reverse external notifications or prove all business workflows. No entire-database restore is needed for this function-only DDL reversal. Do not delete or rewrite migration history as part of rollback: record a compensating operational event and reconcile a reviewed follow-up migration before any future migration automation. Never replay the migration ledger blindly.

## Database recovery limitations

The prior authenticated read-only report observed eight Physical daily backups (9–16 October), latest **16 October 02:09:30 UTC / 04:09:30 Europe/Tirane**. At that observation it was about 7h34 old; that is historical evidence, not its present age or an accepted RPO. PITR was not enabled. Storage objects are excluded. Dashboard Restore availability is not evidence of a successful restore, achievable RTO, download integrity or every recovery privilege. No restore was performed here.

Function-level recovery substantially narrows this migration's recovery scope but does not replace broader backup readiness. A whole-database restore may lose legitimate bookings and changes since the snapshot. Owner acceptance of daily-backup/RTO/Storage limits remains required; no full restore, paid add-on or new project is implied or recommended as an automatic action. Recheck backup availability and current recovery access at release time. Raw captures remain ignored/private under `private/cms-production-readonly/`.

## GitHub and Vercel procedure

Fresh read-only Vercel inspection confirmed Production tracks **main**, Preview tracks **All unassigned git branches**, Ignored Build Step is **Automatic**, Node is 24.x, Next.js build overrides remain off, and no Deployment Checks are configured. A non-main push can trigger Preview; a separate URL proves no isolation. No production secrets were revealed or new environment-isolation claim made. The independent public Live Map remains an external service even without Supabase credentials.

Safest proposed review path requires separate owner approval to set the existing Vercel Ignored Build Step to **Only build production** before any feature-branch push. The option is present but was not selected or saved. After approval, verify the effective control and provider behavior: non-main builds must be skipped and must not launch the application; canceled/skipped deployment records may still exist. This is build suppression, not a new staging environment or a guarantee that no provider bookkeeping occurs. If the requirement is zero deployment records, or suppression cannot be confirmed, keep review local and stop before pushing. Do not improvise a direct main push.

With an approved and verified suppression procedure, push only the reviewed temporary branch, open a draft PR, and run existing GitHub CI with development origin, communications/indexing disabled and disposable local databases. Preserve all branch protections, required approvals and status checks. If a required Vercel status cannot pass because Preview is intentionally skipped, stop for an approved compatible procedure; do not remove required checks or use an administrator bypass. No cloud settings are changed by this proposal. Owner must also decide whether the suppression setting stays in place or is restored later under explicit approval.

`.github/workflows/project-ci.yml` remains unchanged: Node 24, `npm ci`, `npm run check`, `npm test`, production dependency audit. Vercel's normal build remains `node scripts/check-deployment-env.mjs && next build`; strict `verify:cms` is not in the production build. Main CI and automatic Vercel promotion run independently, so pre-merge green checks on the exact candidate are essential. Do not promote a Preview artifact to Production.

## Exact future release order — requires new authorization

1. Approve the final scoped manifest/commits, Preview suppression/review procedure, recovery limits, migration execution, release and contingency rollback scope. Recheck remote main and stop on drift. Prepare PR/green CI under the approved suppression procedure; do not merge yet.
2. Recheck the production schema, exact routine body/security/grants, nullable retained columns and backup availability. Check migration history: seven already documented baseline gaps must not be replayed or repaired by unrestricted `db push`. Confirm new version `20261016000100` remains absent. Capture aggregate product and relevant commercial/history fingerprints privately without exposing customer data.
3. Capture a fresh `pg_get_functiondef`, exact decoded source, owner, config and ACL; verify recovery artifact applicability and usable previous Ready Vercel artifact. Prior recorded app target is `dpl_31a1BBpeXgCaAbZ8SBLfPJk1aqAH`, source `8f71e2743bff64cc04018fb433f4c51066394b23`; availability must be reverified, not assumed from the earlier report.
4. Apply **only** the explicitly approved forward SQL through the existing controlled Supabase process. Review full statement text/hash before execution. Record this migration accurately using that process; SQL Editor execution alone does not automatically prove ledger registration. Stop if the approved ledger procedure is unclear. Do not replay missing historical migrations or change unrelated configuration.
5. Before deploying the editor, verify source/security/grants and unchanged row fingerprints. Confirm the existing production application's homepage, public product loading, booking UI/date/passenger entry and admin login remain operational read-only. Do not create bookings or synthetic CMS publications. Local tests establish old-client compatibility; read-only hosted checks cannot prove a live save/publish transaction.
6. Only after migration and old-app gates pass, approve/mark ready and merge the exact reviewed PR through normal protected GitHub procedure. Preserve production branch main and require green CI/audit. Do not bypass protections or add strict verifier build hooks.
7. Allow automatic Vercel Production deployment; record merge SHA, deployment ID, immutable/domain URLs, Ready/current state and actual source match. Recheck no configuration drift. If build fails, old app remains compatible with the forward function; stop and diagnose rather than reverting SQL reflexively.
8. Perform read-only desktop/mobile homepage, `/book`, representative Route/Explore/FAQ/legal routes and admin-login checks. Verify booking modal and date/passenger controls without submitting a booking. Check relevant metadata, no overflow, no temporary verification route in source or public routing, and no new errors. Authenticated read-only admin inspection may confirm retired controls and retained active fields where a suitable session exists; do not save/publish live content to prove persistence. Record any inaccessible authenticated checks as UNTESTED.
9. Produce the final release result with exact SHAs, migration/history evidence, deployment, acceptance results, remaining limits and rollback reference/outcome. If a confirmed regression requires recovery, follow the explicitly authorized app-first/function-conditional order above. Never reset/force-push main or restore the whole database as an automatic fallback.

## Validation and remaining decisions

Fresh validation: focused real-PostgreSQL recovery test PASS; complete `npm test` PASS with **439 tests, zero failures/skips** (64 component, 17 identity, 145 integration, 181 database, 25 real-PostgreSQL, 7 verifier). `npm run lint` PASS with zero warnings; `git diff --check` PASS. Logs: `/private/tmp/cms-final-recovery.log`, `/private/tmp/cms-final-gates-tests.log`, `/private/tmp/cms-final-gates-lint.log`. Existing TypeScript/production-build and strict local F10 report PASS evidence is retained from implementation/readiness; those commands were not rerun for this test/SQL-reference/documentation-only addition. No hosted persistence acceptance is inferred. The new recovery case accounts for the increase from 438 to 439. No production bindings were used. The existing development-only dependency advisory remains disclosed in prior readiness evidence; future production dependency-audit CI must pass and was not freshly run here.

F04's four Catalog controls are genuinely retired; retained values have compatibility evidence, not invented public-rendering PASS claims. F10 retains its separate active/compatibility/entity denominators and historical protected-code UNTESTED inventory. F09 still needs approved first-stop editorial association/photo or explicit placeholder acceptance. Physical-device/accessibility and broader hosted-edit tests retain their documented limitations.

Owner decisions still required: approve a precise Preview-suppression mechanism before remote review; accept recovery limits or authorize additional evidence; approve final commits and the migration-first execution/contingency rollback scope; resolve or explicitly defer F09. **NO-GO for production execution now.** No release action is authorized by this report, and none was taken. This task ends with local evidence and this report.
