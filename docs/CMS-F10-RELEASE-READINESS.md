# F10 release readiness

16 October 2026, Europe/Tirane. **GO for a separately authorized draft-PR/isolated-Preview review of the verification tooling. NO-GO for an all-CMS-fields-work claim or unattended production release.** Only local commits are authorized so far; no push, PR, merge, deployment, production data or configuration mutation occurred.

## Candidate and baseline

- Isolated checkout: `/private/tmp/shkodra-cms-f10-20261016`.
- Branch: `implementation/cms-f10-verification-2026-10-16`.
- Verified remote main and direct parent: `a890a6a944886fce5b5adcdf893fe6e4f4666d00`.
- **Implementation commit: `924e9709d1aa65b9055cc93135b4144bfa696681`** — `Add isolated F10 CMS field verification tooling`.
- Remote main was checked read-only during preparation and still equals that baseline; no intervening changes to reconcile.
- This readiness document will be committed separately after the implementation, so its own containing commit is discoverable with `git log -1 -- docs/CMS-F10-RELEASE-READINESS.md`. A document cannot contain its own Git object SHA. The implementation SHA above identifies the exact tested code, package scripts, tests and evidence.

The 16-file candidate was inspected before staging and after staging. Its report tool hashes match the committed verifier files. Only verification scripts, synthetic tests/fixtures, package scripts and documentation are included. No `src/`, Supabase migration, lockfile, GitHub workflow, Vercel configuration or environment-file change exists relative to main. No temporary preview route is present; the browser fixture is under tests, outside routing. Generated caches and ignored private evidence are excluded. Manual synthetic-value review and credential-pattern scanning found no production credential values/private keys/JWTs; secret variable names in refusal tests are intentional. The original dirty IDE checkout was not modified or included.

## Exact implementation manifest

- `docs/CMS-F10-FIELD-RESULTS.json`
- `docs/CMS-F10-IMPLEMENTATION-RESULT.md`
- `docs/CMS-F10-VERIFICATION-PLAN.md`
- `docs/CMS-F10-VERIFICATION-RESULT.md`
- `package.json`
- `scripts/cms-verification/assertions.mjs`
- `scripts/cms-verification/cases.json`
- `scripts/cms-verification/entities.mjs`
- `scripts/cms-verification/fixtures.mjs`
- `scripts/cms-verification/render.mjs`
- `scripts/cms-verification/safety.mjs`
- `scripts/cms-verification/verify.mjs`
- `scripts/verify-cms-fields.mjs`
- `tests/helpers/cms-verification/audit-reference.json`
- `tests/helpers/cms-verification/browser-fixture.tsx`
- `tests/verification/cms-fields.test.mjs`

The only additional file in the separate readiness commit is `docs/CMS-F10-RELEASE-READINESS.md`. Review the eventual branch delta with `git diff --stat a890a6a944886fce5b5adcdf893fe6e4f4666d00 HEAD` and `git diff a890a6a944886fce5b5adcdf893fe6e4f4666d00 HEAD -- package.json scripts tests docs`.

## Fresh local validation

`npm run check` passed ESLint with zero warnings, TypeScript and the production build. The complete `npm test` chain passed **419 tests, zero failures/skips**: 57 components, 17 identity, 144 integrations, 172 database, 24 embedded-PostgreSQL concurrency, 5 F10 verifier tests. Concurrency used disposable loopback PostgreSQL with permission to open local sockets. No hosted bindings were used. Staged diff whitespace checks passed. Logs are ignored local evidence at `/private/tmp/f10-release-check.log`, `/private/tmp/f10-release-test.log` and `private/f10-evidence/`.

The implementation-stage browser evidence remains valid for unchanged source: synthetic editors at 320/375/390/430/768/1024/1440px; no sampled overflow; role-derived moves and dirty/discard state checked. It is not a new authenticated hosted acceptance run. No browser forms were submitted during readiness preparation.

`verify:cms` intentionally returns **1** for its four existing F04 findings. Its behavioral active-control results remain **121 PASS, 0 FAIL, 5 UNTESTED**; 84 retained keys pass stored compatibility; 20 independent checks pass. Separate entity probes and the four catalog findings retain their own denominators. Strict finding status is not converted to success and no assertion or ownership rule changed during release preparation.

Known FAIL properties: `catalog.product.meta_title`, `catalog.product.meta_description`, `catalog.product.og_image`, `catalog.product.og_image_alt`. Known UNTESTED active controls: `route.eyebrow`, `route.title`, `routePage.mapAction`, `bookingDialog.title`, `bookingDialog.text`. Historical protected-code entries remain UNTESTED reference evidence. Full limitations and fixture scope are in `CMS-F10-IMPLEMENTATION-RESULT.md`; generated reports record the precommit baseline plus matching tooling hashes. A fresh non-writing run against the implementation commit is retained separately in ignored `private/f10-evidence/release-results.json`.

## Pipeline compatibility

Inspected `.github/workflows/project-ci.yml` (the actual workflow; no `ci.yml` exists). It triggers on main PRs, main pushes and manual dispatch, with Node 24, local development origin, communications/indexing disabled and no service bindings declared. It runs `npm ci`, `npm run check`, `npm test`, then `npm audit --omit=dev --audit-level=low`.

- `npm run check` invokes lint, typecheck and build. `build` remains `node scripts/check-deployment-env.mjs && next build`.
- `npm test` adds only `test:cms-verification` to the existing chain. That five-test suite verifies exact known FAIL/UNTESTED sets and rejects unexpected failures. It does **not** invoke the strict report command or ignore its exit status.
- `verify:cms` is a separate explicit reporting command. There is no prebuild/postbuild/prepare hook or workflow step invoking it. Its expected exit 1 cannot currently fail the normal build/test path.
- Vercel Build and Deployment settings were freshly inspected read-only at [the project settings](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/settings/build-and-deployment): Next.js preset, Node 24.x, empty root directory, build/output/install/development overrides off, Ignored Build Step Automatic, no configured Deployment Checks. No setting was edited or saved. The default Next.js/package build path uses the existing build script and does not call the strict verifier.
- No root `vercel.json` exists or is introduced. No new deployment pipeline or worker is added.

**Conclusion: the expected nonzero finding report does not block the current configured production build.** Adding `verify:cms` directly to a build/CI command would make that command fail, and its environment guard would also reject production bindings. Do not add it to the production build or run its disposable-data probes with hosted credentials. Keep findings visible through reports and verifier contract tests.

The dependency audit step was inspected but not freshly run during this preparation; future GitHub checks must pass, including any newly disclosed advisory. No hosted GitHub check or Vercel build has been triggered for these local commits. Local pipeline compatibility does not guarantee a future remote runner or dependency-audit result.

## Controlled next-release checklist

1. Obtain explicit authorization for pushing the scoped branch, opening a draft PR and any automatic Vercel Preview it may trigger. Before push, recheck remote main, exact branch SHAs, scope and clean tree; stop for unexpected drift.
2. Recheck Vercel Git/Preview bindings and confirm Preview is credential-free or uses approved isolated synthetic services with communications/indexing disabled. A Git push/PR can automatically trigger Preview; if isolation cannot be established, do not push. Do not copy production credentials or change cloud settings under this preparation approval.
3. Push only this branch and its implementation/readiness commits; open a draft PR against main with the four FAIL and five UNTESTED findings prominently disclosed. Never bypass repository protections.
4. Require all actual GitHub checks, including dependency audit, to be green. Confirm Vercel Preview build success at the reviewed SHA and absence of temporary routes. Preview shell availability is not authenticated CMS persistence proof.
5. Perform read-only public/booking UI/admin-login route checks on the isolated Preview, plus the local verifier contract. Do not create real bookings or edit production CMS content.
6. Present exact PR/Preview URLs, SHAs, checks and remaining limitations. Stop for separate production authorization before readiness promotion, merge or production deployment.

## Post-release verification plan (not executed)

If a later production release is authorized: record the merge SHA, Vercel deployment ID/URL and Ready/current status; confirm the deployed revision matches review. Read-only check homepage, representative Route/Explore/FAQ/legal pages, booking entry UI/date/passenger controls without reservation submission, and admin login redirect/form. Confirm no new test route is exposed and no unexpected errors or layout regressions appear. Do not edit live content to prove persistence and do not claim hosted CMS edit/publish acceptance. Run the verifier only locally without production bindings; retain four FAIL and five UNTESTED until separately approved work resolves them. Record PASS/FAIL and limitations in a future release-result document.

No application, Catalog ownership, booking, pricing, capacity, GPS/ETA, Live Map, RLS, environment or delivery/indexing behavior was changed by this release preparation.

## Rollback

Before push: production needs no rollback. Preserve these local commits/evidence; do not reset the original IDE workspace. Abandon only the isolated release branch if requested.

After a separately approved merge: create a rollback review branch from then-current main and revert implementation commit `924e9709d1aa65b9055cc93135b4144bfa696681` (or its actual squash equivalent), plus the readiness documentation commit if appropriate. Run `npm run check` and the remaining test chain; review and deploy only with authorization. If rollback is urgent, an authorized operator may restore the then-verified previous Vercel Production deployment; reverify its availability at that time rather than assuming a historical deployment still exists. There are no migrations, production records or secrets to roll back. Never reset shared main or alter the independent map.

## Decision and stop

**GO for the next separately approved review/isolated-Preview step; NO-GO for production without successful hosted checks and new explicit authorization.** The four F04 failures and five untested interactive/request-bound controls prevent complete CMS acceptance, but are truthfully reported by this tooling-only release. No push, PR, merge, deployment or production mutation is authorized by this document.
