# Stage A — local Mac stabilization, 8 October 2026

## Current baseline — 8 October 2026, superseding historical findings below

Source baseline is main/origin/main `18c48d0d88736de7dc9aae3a6fd7c8feb0054022`; dependency security patches are already published. The approved credential rotation subsequently redeployed this same source and revoked the exposed server key. Old deployment snapshots require current credentials before rollback. No secret values belong in these documents.

The fresh read-only **44-migration** comparison found matching final application structure: 350 columns, 121 indexes, 264 comparable constraints, 38 triggers, 27 policies, 34 RLS tables and 89 functions with equivalent executable definitions. `bookings.meeting_point_snapshot` exists. The previously reported email-function drift and proposed function replacement are **superseded; do not execute that repair**. Seven migration-history entries remain unrecorded; eleven explicit service-role trigger grants differ. Neither is permission to replay SQL or change privileges. Historical QR aggregate checks were clean but are not a fresh data audit.

Production Auth URLs were corrected under separate approval. Production delivery is observed active; preserve it. Inbox acceptance, historical data-update provenance, isolated functional development/Preview, CI/protection activation and hosting eligibility remain pending. Owner declined new/duplicate backends. Local production mutation bindings stay unset; communications stay disabled locally/Preview. The historical statements below describe their original inspection stage, including obsolete commit IDs, dependency-release status and disabled-delivery advice; they are not current operational instructions.

See [reconciliation proposal](SUPABASE-RECONCILIATION-PROPOSAL.md), [controlled acceptance](PRODUCTION-ACCEPTANCE.md) and [review packet](READINESS-RELEASE-REVIEW.md). No migration/history/grant/cloud change is authorized by this update.

## Historical record — preserved, superseded where noted above


Completed under explicit stage-A approval. Main remains at 4a2e50d; nothing committed, pushed or deployed.
Existing edits/private files preserved; .env.local untouched. No cloud settings, migration or live verifier run.

## Changes

- Configured repository-local GitHub Desktop GCM; remote read and push dry-run succeeded.
- Retained compatible Next/eslint-config-next 16.3.8, sharp 0.35.5 and source-map-js 1.2.2 patches; clean npm ci passed in the real clone.
- Added scripts/isolated-development-target.mjs and six regression tests. All six hosted development entry points guard before creating clients. Production, missing opt-in, wrong ref/URL, incomplete keys, hosted environments and enabled communications are denied. Owner setup now uses isolated PUBLIC_OPERATOR_ID.
- Added docs/DEVELOPMENT.md and private opt-in placeholders in .env.example. Updated README/AGENTS, deployment/email/environment/Netlify guidance, DECISIONS and PHASE_STATUS.
- Corrected stale admin email explanatory copy; configuration gates and behavior unchanged. Preserved observed active Supabase scheduler; earlier disabled decision remains historical evidence, not retroactive activation approval.

## Evidence

Credential-free disposable copy: npm ci, npm run check and npm test passed; 372 tests, zero failures/skips.
After adding homepage/SEO guards, focused six-test suite, script syntax, final full lint and diff whitespace checks passed.
Production-only audit reports zero vulnerabilities. Five high dev-chain findings and lifecycle-policy warnings remain; no force fix or allowScripts change.
`git ls-remote origin refs/heads/main` matches HEAD. `git push --dry-run origin main`: Everything up-to-date; no push occurred.
Logs: /private/tmp/shkodra-stage-a-install.log, shkodra-stage-a-check.log, shkodra-stage-a-tests.log, shkodra-stage-a-final-lint.log, shkodra-stage-a-prod-audit.json.

## Remaining

Local/Preview functional setup needs an approved isolated backend and private bindings. Production Auth redirects, fresh 44-migration reconciliation, plan eligibility and controlled booking/inbox acceptance remain separate work. Published dependencies remain vulnerable until an explicitly approved release. No cleanup/deployment is included in stage A.
