# Permanent Web App working folder — 31 October 2026

Always open **`/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App-canonical`** in VS Code.

Consolidation completed locally on `work/permanent-folder-20261031`, based on `807c4f57221a5d8ff7122497eca70f4d23de211c`. Work remains uncommitted for review. No push, deployment, database operation or folder deletion occurred. No new clone, release source folder or worktree was created. Existing environment files were not copied or overwritten.

## Verified folder inventory

All three paths are real directories under `/Users/aleksandermarleci/Desktop/Projects Dev`, not symlink aliases. AGENTS.md and CLAUDE.md were inspected in each. No applicable ancestor instruction file or additional nested project AGENTS.md was found outside dependencies. Read canonical roadmap V4, decisions, phase status, deployment guidance and installed Next environment-variable guide before changes.

All share remote `https://github.com/marlecisander-bit/SightseeingShkodra-Web-App.git`.

| Folder | Git type | Initial branch / HEAD | Initial work and unique history |
| --- | --- | --- | --- |
| SightseeingShkodra-Web-App-canonical | Main checkout / clone; owns the real `.git` directory and shared object database | main / `5ce856450b785ffba3681119d8693e8f6d9750c3` | 60 modified tracked files, 89 untracked files, 12 useful ignored files. Admin improvements, responsive controls, deletion and gated Live Map work were already present as dirty drafts. Behind verified remote main. |
| SightseeingShkodra-Web-App-admin-release-20261030 | Linked worktree, not independent clone/copy; `.git` file points into canonical/.git/worktrees | release/admin-workflows-20261030 / `511e6477ad7067ca9b3e911682b78067465bf1f5` | No tracked edits; one untracked publication receipt; 13 useful ignored files including 11 screenshots and two helper scripts. One commit beyond original local main; its tree exactly matches published `59eb2aba067140971bb941871e93fd8d803110eb` (#44). |
| SightseeingShkodra-Web-App-release-all-20261030 | Linked worktree sharing canonical/.git | release/all-completed-20261030 / `b623c3f9f2538c570b65b2536e5f36cf65e04b6f` | Eight tracked audit edits, 50 untracked files, seven ignored release helpers. Contains released admin improvements, responsive controls/deletion and latest website Live Map audit. Two commits beyond original main; HEAD tree exactly matches published `807c4f5` (#45). |

No folder is an ordinary copy. Original Git status, file names, sizes and hashes: [before-inventory.json](evidence/permanent-folder-20261031/before-inventory.json). Counts exclude node_modules, .next and generated TypeScript build cache; useful ignored files were inventoried separately. Private file contents and environment values are not in the report.

Read-only `git ls-remote origin refs/heads/main` verified remote main as `807c4f57221a5d8ff7122497eca70f4d23de211c`. Existing cached origin/main already matched it; no fetch or push was required. Patch-equivalence checks show no remaining unique unpublished commit patch in either release branch relative to that main. Their distinct commit IDs/branch references remain in the shared repository for history.

## Deployment and project bindings

No `.vercel/project.json`, `.netlify/state.json`, private `.env` or `.env.local` existed in any of the three folders. Each contains the tracked `.env.example`; it was left unchanged. No local CLI project link or directory-specific credentials were moved.

DEPLOYMENT.md identifies the existing Vercel project `sightseeing-shkodra-web-app` under `aleksander-marleci`, repository above, production branch `main`, production domain `sightseeingshkodra.app`. All three folders have the same repository/deployment configuration. No root vercel.json or netlify.toml creates an alternative deployment binding. Existing Netlify adapter files are legacy; the independent Live Map remains a separate service.

The preserved publication receipts identify admin PR #44 / main `59eb2ab` / Vercel `7STL7SzgYWL12LASPZUG4x3YBNqa`, and combined PR #45 / main `807c4f5` / Vercel `CAUqNxB2ktjV5k3B3qsP2RXtWJRh`. These are historical release evidence, not a new hosted verification or activation decision.

`.github/workflows/project-ci.yml` runs tests/checks on main pushes and PRs to main; it has no deploy step. Documented Vercel Git integration can create Preview from feature pushes and Production from main. Local switching/building creates neither. `gh` CLI is not installed, so a fresh authenticated Vercel/GitHub dashboard-settings audit was not possible here; recheck live project binding and Git deployment settings before an authorized future push. No cloud settings were changed.

## Reconciliation decisions and preserved work

1. Created a recovery snapshot inside canonical's existing ignored private area, then stashed canonical's dirty tracked/untracked draft. Created a branch **inside the same permanent folder** from verified published origin/main. Local main was fast-forwarded from `5ce8564` to `807c4f5`; main's existing origin tracking remains. The working branch has no upstream configured, avoiding an implicit publication target.
2. Kept the published admin baseline: unified Products/setup checklist, shared destination/Route-stop editor, consistent editor actions, full-history booking search, responsive admin/public controls, owner-only retained-history booking deletion and its existing migration/test assets. No SQL was applied; disposable database tests remain local.
3. Canonical's differing admin files were earlier variants, rather than additional unreleased features. Retained published fixes: URL-driven empty-search behavior, controlled synthetic save-action injection for acceptance fixtures, safe admin-acceptance pages, additional search-rollback regression tests and corrected publication notes. Reintroducing the earlier variants would regress those fixes. Their original bytes are preserved in the recovery archive/stash.
4. Imported only the reviewed eight-file website audit delta from release-all, with a per-file base equality assertion before replacement: external readiness requires embeddedDisplay, fixed development-only paired override, visible simulated-data notice, effective Route duplicate-status suppression, regression tests and audit/handoff/status documentation. Added its 49 previously absent report/evidence files; existing publication receipt was identical. The parent/child v1 contract and public gate=false remain unchanged.
5. Restored additive canonical untracked work not already in the published tree: historical publication receipts and Live Map evidence. Existing tracked release versions took precedence over older untracked duplicate source/docs, with original variants archived. Both release publication receipts already matched copies in canonical and were retained.
6. Preserved the admin worktree's 11 unique ignored browser screenshots under canonical's existing `docs/screenshots/admin-workflows-20261030/`. Existing canonical screenshots and local fixtures remain. Archived each release folder's ignored helper scripts/SQL preparation files rather than making historical production-operation scripts active development commands. Nothing was executed from those helpers.

Examples of deliberately superseded earlier canonical paths: `src/app/admin/bookings-workspace.tsx`, `destinations-editor.tsx`, `destinations-workspace.tsx`, `product-details-form.tsx`, `route-stops-editor.tsx`, `src/app/dev/admin-v2/bookings-fixture.tsx`, `tests/components/admin-workflow-improvements.test.mjs`, `tests/database/admin-booking-search.test.mjs`, older publication/status notes and generated next-env declarations. Admin acceptance pages absent from the earlier draft remain present from published main. All other compatible admin improvements matched the published candidate and were reused.

The new permanent-folder policy is in AGENTS.md; README.md and DEPLOYMENT.md point here. Current Live Map handoff/report explain that commands now run from canonical. Dated audit source revisions, historical release-folder paths and screenshot metadata remain historical evidence. The paired runners resolve the same sibling `../live-tracking-app-release` after relocation; syntax and dependency/path checks passed. No operational source/script reference requires either Web App release folder.

## Recovery and preservation proof

Ignored recovery location: `private/permanent-folder-consolidation-20261031/` inside canonical. It contains per-folder `*-before.tar.gz`, binary tracked patches, initial inventory and reconciliation decisions. The directory/files have restrictive local permissions. These are recovery artifacts, not another working checkout.

Canonical recovery stash object: `2779ce59570d37a0e6fe8e4e5f2d67225d10ddeb`, message `permanent-folder-consolidation-20261031 canonical before reconciliation`. Earlier stash objects `698f6d2` and `92190ef` remain; no stash was dropped. Do not blindly apply the recovery stash onto the reconciled tree: it includes superseded drafts.

Verified **240 original useful file records** by SHA-256 against their archives. 208 are identical at active canonical paths; the other 32 original variants are preserved in the archives, including documentation changed during consolidation. [Preservation proof](evidence/permanent-folder-20261031/preservation-proof.json) records every original file's active or archived recovery location. Archive bytes remain the authoritative original recovery copies.

Therefore **both Web App release folders have no remaining unique intended current source, useful untracked files, ignored evidence or helper bytes that are absent from canonical's active tree or its recovery archive**. Old branch IDs/history also remain in canonical's shared Git database. Neither source folder was modified or deleted during consolidation.

## Validation

All checks ran from the permanent canonical directory:

- Full `npm test`: **665 passed, 0 failed**: 163 component, 24 identity, 226 integration, 217 database, 28 PostgreSQL and seven CMS-verification tests.
- `npm run check`: lint, Next typegen/TypeScript and production build passed.
- `git diff --check`: passed; no staged/conflicted files.
- Transferred paired-browser runners: Node syntax checks passed; canonical companion path and installed Playwright dependency resolve.
- Public external-status gate remains literal false. Its production override rejection regression passed with the full suite.
- Build-generated next-env.d.ts restored to the published baseline after checks; no application environment file change.

Logs: [tests.log](evidence/permanent-folder-20261031/tests.log), [check.log](evidence/permanent-folder-20261031/check.log). The earlier actual paired-browser acceptance is preserved, not rerun or relabeled as a new hosted/device pass. Its verdict remains PARTIALLY CONNECTED due to companion follow/stop-command behavior. Consolidation does not authorize fixing/deploying the companion or activating the public gate.

## Before later folder removal

No folder has been deleted and no worktree registration was removed. Both named release folders remain registered linked worktrees. An additional `/private/tmp/shkodra-retire-hidden-20261030` linked worktree also exists; it is outside this three-folder consolidation and was left untouched.

Use Git's worktree-aware removal only after a separate explicit removal instruction and a fresh uniqueness/status check. Raw Finder deletion would leave stale worktree registrations. The release-all folder is deliberately still dirty with the original audit; default Git removal will refuse until that already-preserved state is deliberately handled. No force-removal command was run.

No project dev/start server was listening during the initial audit; no new server was started by consolidation. Final process evidence records VS Code/Codex helpers and node/node_repl processes still using release-all as cwd. Close or switch the old VS Code window/terminals/session to canonical before removal; do not kill unrelated processes. [Process evidence](evidence/permanent-folder-20261031/processes.json) and [final Git relationships](evidence/permanent-folder-20261031/final-state.json) record the inspected state. PIDs are transient; recheck before removing anything.

Keep canonical: it owns `.git` for every registered worktree. Keep the independent Live Map companion; it was not part of folder consolidation. Future routine releases use branches and evidence folders inside canonical, without another local source directory.
