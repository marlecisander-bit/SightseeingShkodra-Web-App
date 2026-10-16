# Final CMS production release readiness

16 October 2026, Europe/Tirane. **GO for local candidate review. NO-GO for production execution until the pending backup/recovery, hosted preflight and release-authorization gates below are satisfied.** Only local commits were authorized. No push, PR, Preview, merge, Vercel deployment, hosted migration, production data write or cloud configuration change was performed. GitHub main was checked read-only as requested; no hosted Supabase or Vercel operation was performed.

## Exact candidate and baseline

- Checkout: `/private/tmp/shkodra-cms-completion-20261016`.
- Branch: `implementation/cms-final-completion-2026-10-16`.
- Verified GitHub main/source baseline: `8f71e2743bff64cc04018fb433f4c51066394b23` (F10 production merge). The initial remote check still equals this SHA; no drift required reconciliation.
- **Implementation commit: `ff56557ea8d2b01a6b9577e42e4088e2ebc06a33`** — Complete CMS controls and preserve retired Catalog presentation data. Direct parent is the verified baseline. This commit contains the entire reviewed 54-file local completion candidate, not F04 alone.
- This readiness document is one additional documentation-only local commit. Its containing SHA is obtained with `git log -1 --format=%H -- docs/CMS-FINAL-RELEASE-READINESS.md` and reported in delivery; a file cannot embed its own containing Git object SHA. No application change is added by that second commit.

The original dirty IDE checkout remains untouched. The candidate was reviewed unstaged and staged; only its exact 54 files were staged. No environment file, credential value, private screenshot/dump, generated cache, temporary route, unrelated IDE change or hosted export is included. A bounded credential-pattern/path scan passed; this is not a universal secret-detection guarantee. Development fixtures contain synthetic names/addresses only. The two local SQL reference files are not in the automatic migrations directory.

Generated field reports record the precommit baseline plus matching tool hashes. A fresh non-writing verifier run at `ff56557ea8d2b01a6b9577e42e4088e2ebc06a33` also passed; its result is ignored local evidence at `/private/tmp/cms-final-committed-verification.json`. Reports were not rewritten merely to replace their provenance SHA after committing identical tooling.

## Reviewed changes since released F10

| Area | Reviewed result |
|---|---|
| F03 | Navigation diagnostics share existing normalization, show effective links and explain suppressed duplicate/retired targets. First-link-wins behavior unchanged. |
| F04 | Four Catalog editor controls genuinely retired; existing columns/history/email description consumer retained; compatible save RPC replacement. Website remains /book SEO owner; Calendar remains commercial authority. |
| F07 | Explain/test existing >=1600px center-to-bottom focal transformation; no photograph/composition/CSS change. |
| F08 | Explicitly approved authoritative €0 teaser with existing wording; only selection/presentation, no pricing calculation change. |
| F09 | Existing first-stop fallback identified and association guidance added; no invented/published photo or CMS mutation. Content dependency remains. |
| F10 | Actual request/client contexts prove the five former UNTESTED Website controls, with stale/hidden negative checks and local SQL lifecycle. |
| F11 / F14 | Draft/publish/immediate-update wording and actual visibility scope; action values, permissions and publication models preserved. |
| F13 | Read-only local-snapshot media references; no hosted storage scan or deletion authority. |
| Dependencies/pipeline | Exact dev-only jsdom 30.1.3 and media report command added. No existing dependency version changed. Next.js/Vercel architecture, normal build command and CI workflow unchanged. |

Only one new migration exists. No operational map/tracking files, GPS/ETA algorithms, booking/pricing/capacity implementation, auth/RLS wrapper, provider configuration, environment binding, scheduler, indexing or public route changed. Existing independent Live Map remains untouched. Synthetic test adapters are under scripts/tests, not application routing; server-only interception is confined to the verifier process.

## Migration assessment and exact text

Migration: `supabase/migrations/20261016000100_catalog_presentation_retirement.sql`.
SHA-256: `942835f1fb73e87ec0d0026c17c89ce27a3fd0143c856e61f1563e3b5179d808`.

This is a **backward-compatible routine replacement**, not a table-addition migration: it does not add/drop columns or rewrite records. Applying it executes transactional DDL and grants only; the UPDATE/INSERT statements inside the routine body execute only on later explicitly authorized Catalog calls. There is no migration-time invocation of that routine, no bulk DML, backfill or fixture data.

The old editor can continue supplying all legacy keys after migration. Supplied values retain their old normalization/length/image validation. Current forms may omit them; CASE assignments preserve stored values exactly. Partial old-client image/alt edits use the same scoped locked row for the omitted sibling. Active title/status/type/slug/inclusions/supplier rules, protected binding trigger, role/tenant checks, audit/activity behavior and service-only execution remain. Signature, invoker security and empty search_path remain. Supplier/stop routine branches are unchanged.

**Existing product prices, status/type/eligibility, bookings, capacity and history are not changed by applying the migration.** All unrelated routine definitions remain unchanged in local comparisons. This does not mean an authorized future Catalog edit cannot deliberately change its existing title/status/inclusions; those controls retain their pre-existing behavior. Only the obsolete presentation requirement for future publication is removed. Booking eligibility/pricing algorithms are not replaced.

```sql
-- F04: retire editor requirements only; retain columns, omitted values, permissions and consumers.
begin;
create or replace function public.save_catalog_v1(p_operator_id uuid,p_actor_id uuid,p_entity text,p_id uuid,p_data jsonb,p_delete boolean default false)
returns uuid language plpgsql set search_path='' as $$
declare saved uuid := coalesce(p_id,gen_random_uuid()); changed integer; effective_image text; effective_alt text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin')) then
    raise exception 'Catalog permission required' using errcode='42501'; end if;
  if p_entity not in ('product','supplier','stop') or p_entity is null or jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Invalid catalog request' using errcode='22023'; end if;
  if p_delete then
    if p_id is null then raise exception 'Record required' using errcode='22023'; end if;
    case p_entity
      when 'product' then update public.products set status='archived' where operator_id=p_operator_id and id=p_id;
      when 'supplier' then delete from public.suppliers where operator_id=p_operator_id and id=p_id;
      when 'stop' then delete from public.stops where operator_id=p_operator_id and id=p_id;
    end case;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Record unavailable' using errcode='P0002'; end if;
  else
    if length(btrim(coalesce(p_data->>'name',p_data->>'title',''))) not between 1 and 200 then
      raise exception 'Name or title required' using errcode='22023'; end if;
    if p_entity='product' then
      -- Omitted legacy keys preserve stored values. Lock before validating partial old-client image edits.
      if p_id is not null then
        select og_image,og_image_alt into effective_image,effective_alt from public.products
          where operator_id=p_operator_id and id=p_id for update;
      end if;
      if p_data ? 'og_image' then effective_image:=p_data->>'og_image'; end if;
      if p_data ? 'og_image_alt' then effective_alt:=p_data->>'og_image_alt'; end if;
      if p_data->>'status' not in ('draft','published','archived') or p_data->>'status' is null
        or p_data->>'type' not in ('van_tour','boat_trip','attraction_ticket') or p_data->>'type' is null
        or length(coalesce(p_data->>'slug','')) not between 1 and 200
        or length(coalesce(p_data->>'inclusions',''))>700 or length(coalesce(p_data->>'meta_title',''))>200 or length(coalesce(p_data->>'meta_description',''))>500
        or ((p_data ? 'og_image' or p_data ? 'og_image_alt') and nullif(effective_image,'') is not null
          and (effective_image !~ '^https://[^[:space:]]+$' or length(btrim(coalesce(effective_alt,'')))=0)) then
        raise exception 'Invalid product or retained fields' using errcode='22023'; end if;
      if p_id is null then
        insert into public.products(id,operator_id,title,slug,type) values(saved,p_operator_id,btrim(p_data->>'title'),p_data->>'slug',p_data->>'type');
      end if;
      update public.products set title=btrim(p_data->>'title'),slug=p_data->>'slug',type=p_data->>'type',status=p_data->>'status',
        inclusions=case when p_data ? 'inclusions' then nullif(p_data->>'inclusions','') else inclusions end, supplier_id=nullif(p_data->>'supplier_id','')::uuid,meta_title=case when p_data ? 'meta_title' then nullif(btrim(p_data->>'meta_title'),'') else meta_title end,meta_description=case when p_data ? 'meta_description' then nullif(btrim(p_data->>'meta_description'),'') else meta_description end,
        og_image=case when p_data ? 'og_image' then nullif(p_data->>'og_image','') else og_image end,og_image_alt=case when p_data ? 'og_image_alt' then nullif(btrim(p_data->>'og_image_alt'),'') else og_image_alt end where operator_id=p_operator_id and id=saved;
    elsif p_entity='supplier' then
      if p_data->>'type' not in ('owned','partner') or p_data->>'type' is null then raise exception 'Invalid supplier type' using errcode='22023'; end if;
      if p_id is null then insert into public.suppliers(id,operator_id,name,type) values(saved,p_operator_id,btrim(p_data->>'name'),p_data->>'type'); end if;
      update public.suppliers set name=btrim(p_data->>'name'),type=p_data->>'type' where operator_id=p_operator_id and id=saved;
    else
      if p_id is null then insert into public.stops(id,operator_id,product_id,name,lat,lng,sort_order)
        values(saved,p_operator_id,(p_data->>'product_id')::uuid,btrim(p_data->>'name'),(p_data->>'lat')::double precision,(p_data->>'lng')::double precision,(p_data->>'sort_order')::integer); end if;
      update public.stops set product_id=(p_data->>'product_id')::uuid,name=btrim(p_data->>'name'),lat=(p_data->>'lat')::double precision,
        lng=(p_data->>'lng')::double precision,sort_order=(p_data->>'sort_order')::integer where operator_id=p_operator_id and id=saved;
    end if;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Record unavailable' using errcode='P0002'; end if;
  end if;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'catalog:'||gen_random_uuid()::text,p_entity,saved,
    'catalog.changed',jsonb_build_object('entity',p_entity,'id',saved),'catalog.changed',jsonb_build_object('operation',case when p_delete then 'remove' else 'save' end));
  return saved;
end;
$$;
revoke all on function public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean) to service_role;
commit;
```

## Old-version upgrade and recovery evidence

`tests/database/catalog-retirement.test.mjs` applies all pre-F04 migrations and existing development fixtures, then creates a published old-client record with all four legacy values. The strengthened fixture also creates a real local confirmed meeting-point booking, consumed hold, booking item and occupied seat **before upgrading**. It then snapshots every seeded public table row and column, all public function definitions and target grant/security attributes.

Upgrade preserves every seeded row and column. Only the Catalog function body differs; grants/security attributes are identical. The unchanged availability consumer returns the same **EUR 12.00 quote and two remaining seats from capacity three** before/after. Existing public product loading and historical email description remain available. Old/full and partial form payloads work; new metadata-free publication works; invalid fields and unauthorized/wrong-tenant publication fail. Real queue/template regressions preserve frozen email snapshots. This supplies local evidence that the existing application can operate in the migration-before-app interval; no hosted interval has been claimed tested.

The same eight-test upgrade suite rehearses restoring only the prior Catalog routine from `docs/release/CMS-F04-ROLLBACK-CATALOG.sql`, verifies all rows and prior routine/grant definitions are unchanged/restored, then reapplies the forward migration with identical resulting rows/definitions. It explicitly confirms the old validator blocks metadata-free publication. The prepared read-only pre/post script also executes successfully on the disposable migrated database. No extra test count was invented: these assertions strengthen the existing suite, and all **438 tests** remain passing.

Recovery reference SHA-256: `44fbabf545cf6f39b8019ad84c946c48b1870c4120d08f9349774273e958ee76`. This is a reference/rehearsal artifact, not an authorized hosted rollback command. Prefer retaining forward-compatible SQL when rolling back only the app.

## Fresh local checks

| Check | Result |
|---|---|
| npm run check | PASS: ESLint zero warnings, generated types/TypeScript, production build |
| npm test | **438 PASS**, zero failures/skips: 64 components + 17 identity + 145 integrations + 181 database + 24 embedded PostgreSQL + 7 verifier |
| npm run verify:cms | PASS, exit 0; also passed non-writing at the exact implementation commit |
| Strengthened upgrade/recovery/preflight SQL suite | 8 PASS; final targeted rerun passed after adding read-only SQL reference parsing/execution |
| Final lint / whitespace / tool hashes | PASS |
| New hosted GitHub/Vercel checks | NOT RUN: no push/PR/deployment authorized |

Current F10 evidence: 126 active Website controls PASS, zero active FAIL/UNTESTED; 84 retained Website compatibility PASS; four retired Catalog compatibility PASS; five separate representative entity/boundary PASS; 21 independent checks PASS. Historical protected-source entries remain 41 UNTESTED reference rows. These scopes overlap; no all-collection/all-algorithm/hosted acceptance claim. Former four Catalog FAILs remain archived as historical public-presentation failures rather than relabeled as public-rendering successes.

Fresh logs: `/private/tmp/cms-final-readiness-check.log`, `cms-final-readiness-test.log`, `cms-final-readiness-verifier.log`, `cms-final-upgrade.log`, `cms-final-readiness-lint.log`. Local source reports/screenshots remain in the package documents and ignored private evidence. No fresh physical-device, screen-reader, upload, authenticated hosted edit/save/publish or provider checkout acceptance was performed. Prior synthetic responsive checks are not represented as a new production run.

The previous production-only dependency audit was clean. The disclosed existing full development audit advisory in the ESLint/braces chain remains; no dependency version was changed to suppress it, and no fresh registry audit is claimed here. Future GitHub CI must run its actual production dependency audit and pass; do not bypass it.

## Backup and recovery evidence — production gate NOT satisfied

| Requirement | Evidence currently available | Release status |
|---|---|---|
| Actual current production backup ID/time/completion | None freshly verified in this preparation | **PENDING / blocks release** |
| Retention and usable restore point / accepted RPO | Not established by current repository evidence | **PENDING / blocks release** |
| Account/permissions and approved recovery target | Not freshly verified | **PENDING / blocks release** |
| Restore capability/drill and accepted recovery time | Earlier READINESS-RELEASE-REVIEW.md explicitly leaves restore drill unresolved; no hosted drill performed now | **PENDING / blocks release** |
| Pre-migration Catalog definition/grants export | Read-only SQL reference prepared and tested locally; actual production export not obtained | **PENDING** |
| Routine-level undo/reapply with synthetic old data | Local upgrade suite passes and preserves seeded rows/booking/quote/capacity | **PASS locally only** |

No backup tier, automatic snapshot, PITR entitlement, retention period or storage/Auth coverage is assumed. A local embedded database rehearsal is not a production backup or a full-database restore drill. No production backup or customer-data dump was fetched, created or committed. The absence of verified evidence is not a claim that the project has no backups.

### Required pre-migration backup procedure (future approved operator action)

1. Obtain explicit authorization for the relevant read-only hosted checks, backup/export activity and eventual migration. Confirm the intended existing Supabase project/database and operator scope without displaying secrets. Do not provision another environment or change a subscription/setting to satisfy this checklist.
2. Inspect the **existing** backup/recovery facility. Record the actual successful backup/reference, completion timestamp, retention, recovery point, accessible restore operation/permissions, responsible operator and accepted RPO/RTO. Establish coverage/exclusions for database/Auth/Storage; this function-only migration changes no Storage bytes, but that is not proof of overall backup coverage.
3. Confirm recovery using existing approved evidence or a separately approved safe restore exercise. No restore drill against the live database, replacement project or new infrastructure is authorized by this plan. If a usable recovery path cannot be established, remain NO-GO; a settings upgrade needs a separate decision.
4. Obtain a suitably recent pre-migration backup/export through the existing controlled process. Keep any data-bearing export encrypted/restricted outside Git and record only its identifier/checksum and successful verification in release evidence. Do not place credentials in commands or logs. A routine definition export alone is not a backup of customer records.
5. Execute the prepared **read-only** `docs/release/CMS-F04-PREFLIGHT-READONLY.sql` under separately authorized access. Preserve results privately: actual target identity, current Catalog definition/owner/ACL, role privileges, product-row fingerprint and other routine hashes. Validate against the reviewed baseline; stop for missing objects, unexpected security/definition drift, timeout or access mismatch. The preflight exports no customer rows or secret values.
6. Agree a brief no-Catalog/no-Calendar-edit comparison window with the owner so product fingerprints can be interpreted. Do not disable booking traffic, workers, delivery or scheduler. Normal bookings may continue; never assume operational record counts should freeze across real traffic.

## Existing controlled Supabase application process

Repository evidence in `docs/PUBLIC-ADMIN-CONNECTIONS-REPORT.md` records prior approved migrations applied through the authenticated Supabase SQL Editor and entered into migration history. DEPLOYMENT.md requires reviewed migrations against the intended database. The local migration uses the same supported PostgreSQL transactional routine/grant SQL; no new runner, credentials, infrastructure or Supabase setting is required. Syntax and upgrade/recovery behavior pass locally.

**Feasible through that existing process, conditional on fresh hosted identity/privilege/baseline checks.** Current hosted permissions and migration history have not been inspected here, so execution readiness is not certified. Existing historical ledger discrepancies in the repository are not authorization to replay old migrations or repair history. Do not run an unrestricted `supabase db push`. Apply only the approved new SQL file; register only this reviewed version through the separately approved existing history procedure, preserving all prior rows/checksums. Stop if the operator cannot establish that controlled process. Never rerun the entire old reconciliation migration for either forward apply or rollback.

## Exact future deployment sequence — NOT EXECUTED

1. **Verify production backup/recovery readiness** and record actual evidence described above. Also record the then-current Ready/current Vercel Production deployment ID, source SHA and usable app rollback target. This is currently pending.
2. **Apply only the approved backward-compatible migration** after fresh schema/grant drift checks and separate hosted-migration authorization. Use a bounded, controlled session; do not alter scheduler, delivery, Auth, storage, secrets or unrelated configuration. Review appropriate session lock/statement timeouts with the operator; failure must leave the transaction rolled back, not trigger a blind retry/replay.
3. **Verify the existing production website/booking system before app merge.** Re-run read-only function/grant/product fingerprint checks; expect only the Catalog routine definition hash to change. Confirm homepage, public product availability/quotes, booking date/passenger interface and admin login still work without creating a booking or editing content. Verify normal operational health/worker observations read-only, with no provider send. Stop if any regression. Keep the old app live while assessing recovery.
4. **Merge only the reviewed application candidate into main** through normal protected GitHub review/checks after explicit release authorization. Recheck exact candidate/main SHAs and scope; require actual green PR CI, production dependency audit and any configured checks. Do not bypass protections or force-push. Any candidate/main drift requires reassessment.
5. **Allow automatic Vercel Production deployment from main.** Do not promote a credential-free Preview or issue an extra CLI deployment. Verify normal package build settings; never add verify:cms to production build/request paths. Record actual merge SHA, deployment ID/URL/status and source correspondence.
6. **Verify new controls/public pages/booking interface/publication contract.** Use the acceptance checklist below. Stop on failed gates; invoke only separately authorized rollback. Do not perform synthetic production CMS/booking mutations to fill an acceptance gap.

**Why order is mandatory:** the new editor omits all four fields. The old routine requires legacy title/description for publishing and overwrites absent legacy values during draft saves. The app must not go live ahead of the migration. The forward migration is old-app compatible, so keeping the old application live between steps 2–4 is the safe transitional state.

## Prepared GitHub PR / Vercel procedure — no remote actions taken

Proposed PR title: **Complete CMS control cleanup and retire legacy Catalog presentation fields**.

Proposed body:

> Removes four obsolete Catalog editor controls while retaining stored legacy data and email consumers. Requires the compatible save_catalog_v1 migration before application deployment. Adds effective navigation feedback, truthful scope/action/focal guidance, approved €0 presentation, local media diagnostics and request/client CMS verification.
>
> Local validation: 438 tests, lint, TypeScript, production build and strict F10 pass. F09 approved first-stop content remains outstanding. Production backup/recovery and hosted preflight remain release gates. No hosted persistence or full CMS acceptance claim. Review implementation `ff56557ea8d2b01a6b9577e42e4088e2ebc06a33` against `8f71e2743bff64cc04018fb433f4c51066394b23` and the readiness documentation commit; inspect the single new migration and tested recovery reference.

Keep main the sole permanent production branch; this local feature branch is temporary review infrastructure. A push/new PR can automatically create Vercel Preview, even without a dedicated staging environment. **Do not push/open a PR until the owner separately authorizes a compatible deployment-control procedure or explicitly authorizes the resulting Preview with its real isolation limits.** No settings were changed to solve this issue. Do not substitute a direct main push or bypass protections. Only after that condition and remote-action approval are satisfied should the exact reviewed branch be pushed and a draft PR opened. Keep it draft until required review/checks and migration/readiness gates pass.

Current repository pipeline is unchanged: CI uses Node 24, credential-free development flags, disabled communications/indexing, npm ci, npm run check, npm test and production-only dependency audit. Default build remains `node scripts/check-deployment-env.mjs && next build`; strict verify:cms is a separate local command. No root vercel.json/workflow change exists. Fresh hosted build overrides and any deployment checks must be rechecked under later read-only authorization; local source cannot certify present cloud settings. Main-push CI and Vercel can run independently, so reviewed candidate checks must pass before merging.

## Rollback / recovery procedures

- **Before mutation:** no production rollback needed. Local commits can be retained/reviewed without remote publication. Never reset the original IDE workspace.
- **Migration transaction fails:** confirm it rolled back; retain old app and captured preflight evidence. Stop and investigate; do not replay a migration backlog or broaden privileges.
- **Post-migration issue while old app remains:** use captured actual prior Catalog definition/grants if a separately approved narrow SQL recovery is needed. The local reference `docs/release/CMS-F04-ROLLBACK-CATALOG.sql` is usable only if the actual preflight baseline matches. It restores no table data and must not replace a fresh captured production definition blindly.
- **New app regression:** restore the verified previous Ready app deployment only with explicit rollback authorization, initially retaining the forward-compatible SQL. Reverify read-only routes/quotes/admin entry. Revert source on a reviewed branch through main; never reset/force-push main.
- **SQL rollback after new editor use:** reverting the old validator can block metadata-free products. First restore the compatible old app and assess actual records; do not fabricate missing metadata, delete new products or restore the entire database automatically. A full database restore can discard legitimate intervening bookings and requires a separate recovery decision, accepted recovery point and reconciliation plan.

No automatic rollback, hosted SQL recovery, data restore or branch publication is authorized by this document. No column/data rollback should be needed for a correctly applied function-only migration.

## Production acceptance checklist — future, read-only by default

- [ ] Backup/reference/recovery ownership and verified app rollback target recorded before migration.
- [ ] Expected database/project, baseline function/ACL, migration version and exact migration SHA-256 confirmed.
- [ ] Forward function/grants correct; no unrelated routine hash changed; product fingerprint unchanged across the agreed edit-free window. Investigate normal concurrent changes rather than claiming blanket data equality from counts.
- [ ] Old app after migration: homepage, /book, /route, /explore, /faq, legal pages and admin login load; date/passenger controls, availability/quote errors and booking entry behave as before. No booking submission.
- [ ] Reviewed PR checks green; actual main merge and Production deployment SHA/ID/Ready/current status recorded.
- [ ] New authenticated authorized admin view shows no four legacy Catalog inputs; title/status/inclusions/supplier remain. Existing records load; editor/publisher roles retain policy boundaries.
- [ ] Navigation warnings/effective preview, scope/action wording and wide focal guidance are visible; From €0 appears only when an existing authoritative zero quote is available. No pricing edit to manufacture a test.
- [ ] No new temporary route, overflow or public indexing/configuration regression. Independent Live Map/GPS/ETA authority unchanged; do not operate its admin or simulate live events.
- [ ] Publication behavior is locally proven; actual hosted write/persistence acceptance remains **UNTESTED** unless separately authorized against approved content. Do not create synthetic production records or claim success from read-only views.
- [ ] Final release result records actual IDs/checks, unresolved findings and any authorized rollback outcome.

## F09 and remaining limitations

First stop `point_13634d33-3234-4380-9f11-18d95b3276b2` still needs approved editorial association/photo or explicit owner acceptance of its placeholder. The local helper/diagnosis does not resolve that content decision. No production association was changed. This release must not claim complete CMS content acceptance; owner review must explicitly acknowledge the remaining F09 dependency. Broader hosted/device/upload coverage and the development dependency advisory remain disclosed in the package reports.

## Exact changed-file manifest

Implementation commit `ff56557ea8d2b01a6b9577e42e4088e2ebc06a33` versus `8f71e2743bff64cc04018fb433f4c51066394b23` — 54 files:

| Git status | Path |
|---|---|
| A | `docs/CMS-F04-IMPLEMENTATION-RESULT.md` |
| A | `docs/CMS-F04-OWNERSHIP-RESULT.md` |
| A | `docs/CMS-F04-PRE-RETIREMENT-FINDINGS.json` |
| A | `docs/CMS-F09-ASSOCIATION-RESULT.md` |
| A | `docs/CMS-F10-COMPLETION-RESULT.md` |
| M | `docs/CMS-F10-FIELD-RESULTS.json` |
| M | `docs/CMS-F10-VERIFICATION-RESULT.md` |
| A | `docs/CMS-F13-MEDIA-DIAGNOSTICS-RESULT.md` |
| A | `docs/CMS-FINAL-ACCEPTANCE-REPORT.md` |
| A | `docs/CMS-FINAL-COMPLETION-TRACKER.md` |
| A | `docs/CMS-UX-COMPLETION-RESULT.md` |
| M | `docs/DECISIONS.md` |
| M | `docs/PHASE_STATUS.md` |
| A | `docs/release/CMS-F04-PREFLIGHT-READONLY.sql` |
| A | `docs/release/CMS-F04-ROLLBACK-CATALOG.sql` |
| M | `package-lock.json` |
| M | `package.json` |
| M | `scripts/cms-verification/assertions.mjs` |
| A | `scripts/cms-verification/client.mjs` |
| M | `scripts/cms-verification/entities.mjs` |
| A | `scripts/cms-verification/media.mjs` |
| A | `scripts/cms-verification/request-destinations.mjs` |
| A | `scripts/cms-verification/request-route.mjs` |
| A | `scripts/cms-verification/request-website.mjs` |
| M | `scripts/cms-verification/verify.mjs` |
| A | `scripts/report-media-usage.mjs` |
| M | `src/app/admin/catalog-actions.ts` |
| M | `src/app/admin/catalog-panel.tsx` |
| M | `src/app/admin/destinations-editor.tsx` |
| A | `src/app/admin/navigation-preview.tsx` |
| M | `src/app/admin/partners-editor.tsx` |
| M | `src/app/admin/reviews-editor.tsx` |
| M | `src/app/admin/website-editor.tsx` |
| M | `src/app/admin/website-workspace.tsx` |
| M | `src/components/public/booking-controls.tsx` |
| M | `src/components/public/booking-presentation.ts` |
| A | `src/modules/content/catalog-fields.ts` |
| M | `src/modules/content/hero-fare.ts` |
| M | `src/modules/content/navigation.ts` |
| M | `src/modules/content/website-schema.ts` |
| A | `supabase/migrations/20261016000100_catalog_presentation_retirement.sql` |
| M | `supabase/migrations/README.md` |
| M | `tests/components/admin-simplification.test.mjs` |
| A | `tests/components/catalog-retirement.test.mjs` |
| A | `tests/components/cms-completion.test.mjs` |
| M | `tests/components/editorial-connections.test.mjs` |
| A | `tests/database/catalog-retirement.test.mjs` |
| M | `tests/database/catalog.test.mjs` |
| M | `tests/database/hero-fare.test.mjs` |
| M | `tests/helpers/cms-verification/browser-fixture.tsx` |
| A | `tests/helpers/cms-verification/hero-browser-fixture.tsx` |
| M | `tests/integrations/booking-emails.test.mjs` |
| M | `tests/integrations/booking-presentation.test.mjs` |
| M | `tests/verification/cms-fields.test.mjs` |

The separate readiness commit adds only `docs/CMS-FINAL-RELEASE-READINESS.md` (55 total changed paths across the two local commits). Ignored logs, screenshots, snapshots and generated caches are excluded. Review exact objects with `git diff --stat 8f71e2743bff64cc04018fb433f4c51066394b23 HEAD` and `git show --stat ff56557ea8d2b01a6b9577e42e4088e2ebc06a33`.

## Decision and stop

**Local preparation: GO. Production execution: NO-GO pending verified backup/recovery evidence, hosted baseline/configuration preflight, resolved Preview/push procedure and explicit release authorization.** The migration and old-app transition are locally proven and ready for review; those local proofs cannot establish current hosted recovery availability. F09 remains an acknowledged content dependency, not silently accepted.

Stop here. Request explicit authorization for the next read-only hosted readiness checks before accessing backup/schema/deployment state; any push, PR/Preview, hosted migration, merge or Vercel deployment requires its own clearly scoped approval. No production release sequence has been executed.
