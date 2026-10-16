# CMS Package 1 release readiness

16 October 2026, Europe/Tirane. Preparation only. All work performed in `/private/tmp/shkodra-cms-package1-20261016` on `implementation/cms-package-1-2026-10-16`. No push, PR creation, merge, deployment, production mutation or cloud setting change has occurred. The original IDE workspace was not edited or imported during this release preparation.

## Candidate and exact manifest

Implementation commit: **`843fcb433b2e48633204cacd29a4853162c862b5`** — `fix(cms): make Package 1 existing controls truthful`.
Parent / audited baseline: **`2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd`**.
Implementation tree: `9b3aabde528a61abd0c76de252f8fa49c024fed7`.

The implementation commit contains exactly 11 files, 139 insertions and 11 deletions:

| Status | File | Reviewed scope |
|---|---|---|
| M | `src/components/public/homepage-hero.tsx` | Pass `hero.book` into existing widget |
| M | `src/components/public/hero-booking-widget.tsx` | Required string prop and submit label only; quote/submit logic identical |
| M | `src/modules/content/website-schema.ts` | Filter three obsolete controls from editor projections; retain schema/data |
| M | `src/app/admin/hero-amenities-input.tsx` | Remove Description input; explain compact icon/title presentation |
| M | `src/app/admin/destinations-editor.tsx` | Add existing publisher condition to Move later |
| M | `src/app/admin/overview-panel.tsx` | Place Partners after Website and reuse navigation description |
| M | `tests/components/homepage-hero.test.mjs` | Saved CMS label must render |
| A | `tests/components/cms-package1.test.mjs` | Overview role/order/description and retained amenity description |
| M | `tests/database/public-admin-connections.test.mjs` | Publisher/editor reorder authorization and historical content persistence |
| M | `tests/integrations/website-editor-contract.test.mjs` | Retired editor controls absent; all 210 schema keys retained |
| A | `docs/CMS-PACKAGE-1-IMPLEMENTATION-RESULT.md` | Local implementation evidence and limits |

This readiness document is a separate documentation-only follow-up commit, not part of the implementation SHA above. The complete prepared branch therefore adds only this twelfth file beyond the reviewed implementation; its follow-up SHA is available with `git log -1`. No application changes are made by the follow-up.

Verified exact staged diff before implementation commit and clean worktree immediately afterward. Explicit file-by-file staging was used, with no blanket import from the dirty original workspace. No temporary preview route, environment file, ignored evidence, dependency lockfile, migration, CSS or unrelated audit file is included. Review with `git show --stat 843fcb433b2e48633204cacd29a4853162c862b5` and `git diff 2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd..HEAD`.

## Latest main and hosted baseline

Fresh read-only `git ls-remote origin refs/heads/main` returned `2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd`. **Zero remote-main changes since the audited baseline; no rebase/conflict resolution needed.** This is a point-in-time check and must be repeated immediately before any authorized push and merge.

Authenticated read-only Vercel inspection confirmed deployment **`E5jvsjL7QdhRt5h7UsmRiorxH7qA`** is **Ready / Production / Current**, source main `2714ea9`, serving `sightseeingshkodra.app`.

- [Verified production deployment](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/E5jvsjL7QdhRt5h7UsmRiorxH7qA)
- Immutable deployment URL: `https://sightseeing-shkodra-web-nzet4l25v-aleksander-marleci.vercel.app`

## Deployment triggers: a push is a deployment boundary

Read-only inspection of the existing Vercel project confirmed:

| Action | Current integration behavior | Authorization now |
|---|---|---|
| Local Git commit | No Git-hosted deployment trigger | Authorized and completed |
| Push this implementation branch | Preview Branch Tracking is checked; covers all unassigned branches. Expect automatic Preview deployment | **Not authorized; not performed** |
| Open/update PR targeting main | GitHub/Vercel PR integration may create/update Preview and deployment comments; a draft PR is not a deployment-suppression mechanism | **Not authorized; not performed** |
| Merge/push to main | Production page explicitly says every commit pushed to main creates a Production deployment; Auto-assign Custom Production Domains enabled | **Not authorized; not performed** |
| Manual deploy/promote/rollback | Mutates hosted deployment state | **Not authorized; not performed** |

Git repository remains connected to `marlecisander-bit/SightseeingShkodra-Web-App`; no deploy hooks are configured. No `vercel.json` deployment override exists. GitHub Project CI runs on PRs to main and pushes to main; it performs checks/tests/audit without a separate Vercel deployment step. Native Vercel Git integration acts independently of that workflow: a CI pass is not a manual production hold.

Observed Preview has **no project environment variables and no shared variables linked**, no custom domains, and enabled branch tracking. An authorized branch push would currently be expected to build the credential-free configuration-unavailable shell. It cannot establish authenticated CMS or real booking acceptance. Do not copy Production credentials into Preview. Functional hosted Preview requires separately authorized isolated bindings/data with communications and indexing disabled; provisioning/configuration is outside this approval. Preserve the existing build safety checks.

Sources: [Vercel Git integration](https://vercel.com/docs/git), [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github), authenticated project [Git settings](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/git), [Preview settings](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/environments/preview) and [Production settings](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/environments/production). Settings were only read; no Save, toggle, deployment or secret-reveal action was used.

## Production configuration and risk assessment

Production environment variables, Supabase configuration, booking API implementation and the independent Live Map are **unchanged by this package and release preparation**. Source diff is empty for `src/app/api`, `src/modules/booking`, `supabase`, `netlify`, `.github`, `scripts`, dependency manifests, `.env.example`, `next.config.ts` and `DEPLOYMENT.md`. No hosted API mutation or configuration operation was executed. Production secret values were not revealed or copied. This is not a global secret/configuration drift certification against every external actor; no such values snapshot was taken.

The Supabase backend/Auth/Storage/Realtime, delivery scheduler, Resend, capacity/payment/idempotency rules and retained independent map remain under their existing configuration. Do not apply a migration, change production variables, turn off observed active delivery, rotate credentials or alter the external Netlify map as part of this release.

Material risks and controls:

- A push or PR is not inert: automatic Preview is enabled. Obtain explicit approval covering that deployment before pushing.
- A merge to main publishes automatically with domain assignment. Obtain separate production approval; do not rely on an unconfigured manual promotion gate.
- Current Preview lacks isolated service bindings. A successful shell build must not be reported as full hosted booking/CMS validation.
- The saved CMS label will now become visible. Inspect its existing published value read-only before release; an unexpected label is a content issue, not permission to edit production copy.
- Active editor retirement prevents further edits to three keys while retaining historical data. No schema migration or data cleanup is required.
- Hosted role acceptance is pending. Synthetic UI policy checks and local SQL authorization tests passed; they do not replace independently authenticated production-role observation.
- Hobby rollback is constrained to the immediately previous Production deployment. Reconfirm target eligibility before release and prevent intervening releases during the acceptance window.

## Automated and local results

The committed application/test bytes match the locally validated implementation. No source change was made in release preparation; the existing successful suites were verified from their logs, not needlessly rerun.

| Check | Result |
|---|---|
| Lint, TypeScript and optimized production build | PASS |
| Components / identity / disposable database tests | 246 PASS, zero failures/skips |
| Integrations | 144 PASS, zero failures/skips |
| Total | **390 PASS** |
| Exact candidate diff / whitespace | PASS |
| Previous isolated UI and responsive evidence | Owner/admin publisher/editor states; custom public CTA/dialog and empty-date guard; preserved amenity description; 320/375/390/430/768/1024/1440px without sampled overflow |

Logs copied into ignored `private/cms-package1-release/` in this isolated checkout. Details and limits remain in `CMS-PACKAGE-1-IMPLEMENTATION-RESULT.md`. The stale generated preview-route type reference was resolved before the final successful checks. Full embedded-Postgres concurrency, physical-device, hosted save/publish and live checkout/delivery tests were not newly run. No production transaction was created.

## Prepared PR and release procedure — do not execute yet

Prepared PR title: **Fix CMS Package 1 existing controls**.
Base: `main`. Head: `implementation/cms-package-1-2026-10-16`. Draft initially.

Prepared PR description:

> Existing CMS controls now match their public behavior: Hero uses its saved booking label, three obsolete copy controls and amenity Description are retired without deleting stored data, destination moves share publisher rules, and Partners has a useful Overview description and position. Booking logic, authorization, existing entities and external map are preserved.
>
> Validation: lint, TypeScript, build and 390 local tests passed; isolated role/compatibility/responsive evidence is documented in the implementation and readiness reports. No migrations or environment changes. Preview currently has no isolated bindings, so a credential-free deployment cannot demonstrate full CMS/booking acceptance. Do not merge until separate production approval.

Future sequence, each boundary subject to explicit approval:

1. Re-read latest main and verify the exact reviewed implementation SHA plus documentation-only follow-up; stop and reassess if main or candidate changes. Reconfirm Vercel branch rules and Preview safety read-only.
2. **Next approval requested:** push this isolated branch and create the drafted PR, expressly allowing the resulting automatic **credential-free Preview deployment only**. No merge or production permission is implied. If full hosted Preview is required first, obtain a separate decision on isolated environment configuration before push; do not provision it implicitly.
3. After approval only, push the named branch (no main push or force-push), create the draft PR with the text above, inspect its exact diff and GitHub Verify project check, and record the Preview source SHA/URL/build result. CI additionally runs `npm test`, including its real-Postgres suite, and production dependency audit; those hosted CI results do not exist yet.
4. Perform appropriate Preview checks. Treat unconfigured CMS/booking as unavailable, never as passing. Use isolated data only if separately approved and verified.
5. Present PR/CI/Preview evidence, remaining limits and freshly verified rollback target. Request a separate explicit approval for merge **and the automatic Vercel Production deployment**.
6. Only after that approval, merge through GitHub using the approved method, record resulting main SHA and Vercel deployment ID, verify Ready/Current/source/domain and complete the acceptance checklist. No extra manual deploy, schema changes or environment edits.

## Precise rollback procedure — prepared, not authorized or run

Trigger: failed booking/date/passenger/dialog behavior, missing/incorrect hero CTA, unexpected editor permission exposure, public errors or layout regression attributable to this package. Stop further releases and collect source SHA, deployment ID and sanitized failure evidence.

1. Obtain explicit approval for the production rollback. Reconfirm current target is the Package 1 deployment and previous Production is still the verified `E5jvsjL7QdhRt5h7UsmRiorxH7qA` / source `2714ea9`. If another release intervened, reassess rather than rolling back unrelated changes.
2. In Vercel project's Production deployment controls, select **Instant Rollback** to the previously verified immutable deployment `https://sightseeing-shkodra-web-nzet4l25v-aleksander-marleci.vercel.app`, confirm its source and target domain before the final action. Verify `sightseeingshkodra.app` now points to that deployment and public booking/navigation checks recover. No rebuild, environment rewrite, database restore or map rollback is required for this presentation-only package. Confirm eligibility at execution: Hobby only supports the immediately previous production deployment. See [Instant Rollback](https://vercel.com/docs/instant-rollback).
3. Reconcile Git so a later deployment does not reintroduce the defect. On a new isolated branch from latest main, if the approved merge method preserved `843fcb433b2e48633204cacd29a4853162c862b5`, run `git revert 843fcb433b2e48633204cacd29a4853162c862b5`. If squash merged, revert the actual recorded squash commit instead. If main has moved, review the revert diff for unrelated changes/conflicts. Do not reset or force-push main. The documentation-only readiness follow-up may remain.
4. Validate the revert and prepare a PR; its push may itself deploy Preview and needs approval. Merging the revert triggers another Production deployment and requires explicit authorization. Verify source/domain again afterward. Do not assume that Instant Rollback changes Git history or restores CMS data.

If the old artifact is unavailable/ineligible, prepare the reviewed source revert/build via normal Git/Vercel procedure and request approval; do not substitute the legacy main Netlify site. Historical Website/amenity values are retained throughout. Data/content edits made independently after release are outside this code rollback and must not be overwritten.

## Post-release acceptance checklist

Record exact deployed main SHA/ID, time, browser widths and pass/fail evidence; do not mark these complete now.

- [ ] Vercel Ready / Production / Current matches approved merge SHA; HTTPS domain, canonical/robots behavior and no unexpected runtime errors.
- [ ] Homepage hero button equals current published `hero.book`; one widget remains, navigation booking remains, date/passengers/quoted fare/error/loading/empty-date guard and shared dialog work. Inspect normal availability read-only; do not create a real hold/booking/payment/email for acceptance without specific authorization.
- [ ] Hero photograph/headline and compact five-icon row remain intact at 320/375/390/430/768/1024/1440px with no page overflow or clipped CTA/labels.
- [ ] Admin owner/editor/publisher isolated sessions: obsolete three controls and Description absent; Hero booking label present; destination move directions both disabled for editor and both permitted for publisher except boundaries; Partners follows Website with description on desktop (existing mobile presentation may hide card descriptions).
- [ ] Role checks use existing authorized accounts only; do not impersonate, change roles or create production staff. If no permitted session exists, record pending rather than weakening access.
- [ ] Admin saved-draft/publication and historical-description retention already passed locally. Repeat edit/save/publish tests only in approved isolated data; do not publish marker content or reorder production destinations as a test. Reconfirm server authorization through existing isolated regressions.
- [ ] Partners/footer/other public pages remain intact, destination links resolve, Route/map embed and external map origin are unchanged; no GPS/ETA mutation or physical-van correctness claim.
- [ ] Production environment/Supabase/delivery configuration unchanged; no migration or operational change appeared in release. Check sanitized error trends against baseline.
- [ ] Any requested real transaction/inbox acceptance is separately scoped and approved, or explicitly remains untested. Record rollback decision and close acceptance only with accurate limits.

## Final recommendation

**GO for the prepared candidate and an explicitly approved branch push / draft PR / automatic credential-free Preview. NO-GO for Production at this stage:** production permission is withheld, remote CI and hosted acceptance remain pending, and no fully functional isolated hosted Preview currently exists. This is a controlled-release gate, not a newly discovered implementation failure. The earlier local implementation GO and 390 passing tests stand.

Stop here. Required next decision: approve the named branch push and draft PR **including its automatic Preview deployment**, or keep the package local. No production merge/deploy/configuration authority is inferred from that decision.
