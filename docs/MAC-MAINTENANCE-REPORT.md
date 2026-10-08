# Mac maintenance and readiness report

## Current baseline — 8 October 2026, superseding historical findings below

Source baseline is main/origin/main `18c48d0d88736de7dc9aae3a6fd7c8feb0054022`; dependency security patches are already published. The approved credential rotation subsequently redeployed this same source and revoked the exposed server key. Old deployment snapshots require current credentials before rollback. No secret values belong in these documents.

The fresh read-only **44-migration** comparison found matching final application structure: 350 columns, 121 indexes, 264 comparable constraints, 38 triggers, 27 policies, 34 RLS tables and 89 functions with equivalent executable definitions. `bookings.meeting_point_snapshot` exists. The previously reported email-function drift and proposed function replacement are **superseded; do not execute that repair**. Seven migration-history entries remain unrecorded; eleven explicit service-role trigger grants differ. Neither is permission to replay SQL or change privileges. Historical QR aggregate checks were clean but are not a fresh data audit.

Production Auth URLs were corrected under separate approval. Production delivery is observed active; preserve it. Inbox acceptance, historical data-update provenance, isolated functional development/Preview, CI/protection activation and hosting eligibility remain pending. Owner declined new/duplicate backends. Local production mutation bindings stay unset; communications stay disabled locally/Preview. The historical statements below describe their original inspection stage, including obsolete commit IDs, dependency-release status and disabled-delivery advice; they are not current operational instructions.

See [reconciliation proposal](SUPABASE-RECONCILIATION-PROPOSAL.md), [controlled acceptance](PRODUCTION-ACCEPTANCE.md) and [review packet](READINESS-RELEASE-REVIEW.md). No migration/history/grant/cloud change is authorized by this update.

## Historical record — preserved, superseded where noted above


8 October 2026. Open `/Users/aleksandermarleci/Desktop/Projects/SightseeingShkodra-Web-App-git` in VS Code. Original ZIP folder preserved. Local branch: `maintenance/mac-readiness-2026-10-08`; changes remain uncommitted and unpushed. No force upgrade, migration execution, deployment or cloud configuration change.

## Compatible security patches

| Affected dependency | Exposure | Compatible local fix |
| --- | --- | --- |
| `next` 16.3.5 | Direct production framework; audit includes critical next/og RCE, image SSRF, cache/content disclosure/poisoning, plus development MCP disclosure. Feature-specific exploitability was not penetration-tested. | 16.3.8, within existing 16.3 line; associated env/SWC packages patched. [Official release](https://github.com/vercel/next.js/releases/tag/v16.3.8). |
| `sharp` 0.35.4 | Transitive production image processing, vulnerable librsvg dependency | 0.35.5 and bundled native/libvips artifacts via lockfile. [Advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). |
| `source-map-js` 1.2.1 | Transitive dependency in Next's production tree via PostCSS, primarily build/source-map handling; indexed-map input can cause event-loop DoS | 1.2.2 via lockfile. [Advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). |
| `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch`, `braces` | Five reported affected nodes in a development-only lint dependency chain, one underlying high stack-exhaustion advisory in Braces <=3.0.3. Malicious nested glob inputs can exhaust the stack; lint trusted repositories/patterns. | eslint-config-next/plugin aligned to 16.3.8, but no patched Braces version published at inspection. Keep finding open and monitor upstream; npm's suggested downgrade to eslint-config-next 14.2.35 is a major incompatible change and was not used. [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |

Commands: `npm install --save-exact next@16.3.8`; `npm install --save-dev --save-exact eslint-config-next@16.3.8`; `npm update sharp source-map-js`. Lockfile review shows only these package families/native artifacts changed. No arbitrary overrides, audit force or unrelated direct dependency upgrades.

Before audit: eight findings (one critical, seven high). After `npm audit --json`: five high in the lint chain, no critical. `npm audit --omit=dev --json`: zero findings. These results describe this local branch, not the currently deployed baseline. Registry audit is not a full security assessment.

## Verification

- Current terminal after `source "$HOME/.zprofile"`: Node `v24.21.0`, npm `11.19.0`, compatible with package engine `>=24 <25`; native Apple Silicon setup retained.
- `npm run check`: PASS (lint, typecheck, optimized production build). Log `/private/tmp/shkodra-maintenance-check.log`.
- `npm test`: PASS, 356 tests: components 28, identity 17, integrations 129, database 158, PostgreSQL concurrency 24. Zero failures/skips. Log `/private/tmp/shkodra-maintenance-test.log`. Temporary test databases closed; no hosted data used.
- `git diff --check`: PASS. `.env.local` and `private/schema-reference-42.json` are ignored. No secret values in this report or tracked changes.
- Read-only catalog SQL successfully run against an isolated reference built from all 42 migrations; temporary PGlite database closed.
- Deployment docs corrected in DEPLOYMENT.md and NETLIFY-MIGRATION-INVENTORY.md: `git log --all -- netlify.toml` returns no history at fetched baseline `f4f0ded`. Legacy adapters tracked since `5ee001c` remain, as do external hosted services.

## Migration reconciliation

All 42 repository version IDs compared to 35 hosted records. Seven are unrecorded. Hosted QR/check-in columns/functions, manual-review columns/settings table, CMS inclusions column and hero helper exist, so treating all seven as missing schema would be incorrect. The received export now matches the seven entries’ effective schema/validator bodies, columns, indexes, constraints, RLS/policies and triggers. Follow-up confirms all four QR/backfill/check-in counts are zero, and the 11 trigger functions have direct service-role EXECUTE grants rather than inherited owner privileges. The separate hosted email function references nonexistent bookings.meeting_point_snapshot; isolated validation returns SQLSTATE 42703. Keep email/background delivery disabled and require separately approved forward correction. See [complete comparison and safe reconciliation plan](MIGRATION-RECONCILIATION.md). No replay or history repair authorized.

## Secure GitHub authentication

Git's configured helper is `osxkeychain` from Apple's system Git configuration (`git config --show-origin --get-all credential.helper`). GitHub Desktop is installed. `gh` and Git Credential Manager are absent. Earlier noninteractive credential check found no usable terminal HTTPS credential; browser sign-in/public clone does not verify terminal authentication or push permission. Git user identity is configured; it is not authentication.

Recommended existing-app route:

1. In GitHub Desktop, open Settings → Accounts → Sign In to GitHub.com. Complete browser authentication/2FA privately and review the app authorization yourself. Do not paste passwords, codes or tokens into chat. [Official instructions](https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/authenticating-to-github-in-github-desktop).
2. File → Add Local Repository → choose the `SightseeingShkodra-Web-App-git` folder. Do not initialize/publish the ZIP folder. Confirm owner/repository `marlecisander-bit/SightseeingShkodra-Web-App`, origin unchanged, maintenance branch selected.
3. Fetch Origin is a read-only GitHub action; no Push Origin/Publish Branch/merge/main changes. Desktop's successful fetch of this public repo alone still does not prove authenticated write access.
4. Desktop authentication and command-line HTTPS authentication are separate verification targets. If terminal authentication is wanted, choose GitHub CLI's browser/device login after separately approving its installation, then `gh auth login --hostname github.com --git-protocol https --web`, `gh auth setup-git`, and `gh auth status`. Never use `gh auth token` in reports. No CLI was installed or helper changed here. An SSH route would require a separately reviewed key/account setup; no keys created.

No push probe was performed: it would affect external state and can trigger deployment. No access token requested in chat.

## Readiness and remaining decisions

Local setup: runnable/buildable/testable; compatible security patches verified. Five development audit findings remain without a compatible published Braces fix. Source and lockfile changes need owner review/commit later; no push.

Functional readiness: NOT certified with real Supabase Auth/PostgREST/Storage or browser booking/admin. No isolated backend is available/configured in the clone. Embedded database tests validate important contracts/concurrency but do not replace real hosted acceptance.

Deployment readiness: NOT certified. Previously read-only verified correct Vercel Git repository/main connection, Next preset, Node24.x and existing production deployment. Preview/Development scopes had no project/shared variables; Preview tracked all unassigned branches. No configured cron jobs were visible (platform cron feature itself enabled); communications/background delivery remain disabled by project decision. Current task made no cloud changes. Local patches have not reached the existing deployment. Complete schema parity, isolated acceptance, exact Preview origin/scope configuration and the Vercel plan decision remain blockers. [Current Hobby terms](https://vercel.com/docs/plans/hobby) restrict use to non-commercial personal projects, conflicting with this commercial booking site; owner previously chose Hobby. An eligible-plan/provider confirmation decision is needed, not an automatic upgrade.

Priority next steps:

1. Initial catalog export received and compared. Follow-up received and compared; propose reviewed history repair for the seven entries separately from a forward correction for the hosted email-function drift. Neither is authorized for execution.
2. Complete private GitHub Desktop sign-in; choose whether terminal authentication is also wanted.
3. Review [isolated Preview proposal](ISOLATED-PREVIEW-PROPOSAL.md): approve/amend test Micro project (~$10/month incremental compute), region/name, test-only schema/data/Auth/Storage and scoped environment/redirect changes. Select trusted acceptance branch, exact origin, private test-user identities, and eligible Vercel plan decision.
4. After explicit resource/configuration approval, provision only the isolated test backend and run local hosted booking/admin acceptance. Any Preview deployment needs separate authorization. Production remains untouched.
