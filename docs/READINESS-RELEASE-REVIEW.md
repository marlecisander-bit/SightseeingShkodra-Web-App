# Readiness maintenance release — review packet, unpublished

Baseline main/origin/main 18c48d0d88736de7dc9aae3a6fd7c8feb0054022. No package/lockfile update, commit, push, deployment or cloud mutation in this preparation. The approved same-source credential rotation is a preceding completed task, not a new release here.

## Proposed release boundary

Safety: existing isolated target guard, its six regression tests, six guarded hosted entry points and blank/false .env.example opt-in defaults. Guard prevents the known production ref even when labelled development; URL/ref/completeness/communications/host checks fail before clients. It does not authenticate credential provenance or sandbox the entire local app. Keep privileged production bindings unset; owner has declined an isolated backend.

Documentation: original safety/development/platform reports, current all-44 evidence notices, reconciliation and acceptance proposals, append-only phase/decision entries. Historical conclusions remain explicitly superseded instead of erased. No architecture or roadmap rewrite.

Presentation: src/app/admin/email-panel.tsx changes inaccurate universal delivery-pause copy only; configuration/booking/notification behavior unchanged. Include only if owner approves this named file with the release.

CI: local workflow plus branch-policy proposal; no rules activated. Can be reviewed separately from safety/docs if preferred. First GitHub/Linux execution and plan enforcement remain pending. Do not claim CI gates an independent Vercel redeploy.

No unrelated source edits found. Existing maintenance branch/stash preserved. No private files, .env.local, node_modules, .next, tsbuildinfo, catalog exports, screenshots or package files included. No broad git add; stage only separately approved named files after final diff review. Do not switch branches/stash automatically with this working tree.

## Exact review candidate list

- `docs/DEVELOPMENT.md`
- `docs/ISOLATED-PREVIEW-PROPOSAL.md`
- `docs/MAC-MAINTENANCE-REPORT.md`
- `docs/MIGRATION-RECONCILIATION.md`
- `docs/SCHEMA-AUDIT-FOLLOWUP-READONLY.sql`
- `docs/SCHEMA-AUDIT-READONLY.sql`
- `docs/STAGE-A-MAC-STABILIZATION.md`
- `scripts/isolated-development-target.mjs`
- `tests/integrations/isolated-development-target.test.mjs`
- `.env.example`
- `AGENTS.md`
- `DEPLOYMENT.md`
- `README.md`
- `docs/BOOKING-EMAILS.md`
- `docs/DECISIONS.md`
- `docs/EMAIL-ACTIVATION-PREPARATION.md`
- `docs/NETLIFY-MIGRATION-INVENTORY.md`
- `docs/PHASE_STATUS.md`
- `docs/VERCEL-ENVIRONMENT-INVENTORY.md`
- `scripts/initialize-website-content.mts`
- `scripts/prepare-owner-setup.mjs`
- `scripts/verify-public-checkout.mjs`
- `scripts/verify-public-homepage.mjs`
- `scripts/verify-public-seo.mjs`
- `scripts/verify-supabase-development.mjs`
- `src/app/admin/email-panel.tsx`
- `.github/workflows/project-ci.yml`
- `docs/CI-AND-BRANCH-PROTECTION.md`
- `docs/SUPABASE-RECONCILIATION-PROPOSAL.md`
- `docs/PRODUCTION-ACCEPTANCE.md`
- `docs/READINESS-RELEASE-REVIEW.md`

## Approval decisions

1. Approve safety/docs release boundary and whether the one admin copy edit and CI draft belong in it. Separate authorization needed for branch creation, staging/commit/push/PR; a push can trigger Preview and main merge production.
2. Approve CI trial after review, then main ruleset and emergency PR-only bypass only after a successful observed run; no second reviewer required.
3. Approve reconciliation evidence review first, not repair. Historical data checks and any later metadata/privilege mutation need explicit scope.
4. Supply production acceptance selections privately and approve maximum one booking, two seats, one modification/cancellation and six intended automatic emails. Nothing executed yet.
5. Local/Preview hosted functionality remains unavailable under no-new-backend decision. Hosting commercial eligibility, restore drill and account recovery/permissions remain separate unresolved operational items.

## Verification

Validation results will be appended after local checks. Production audits are reused, not repeated. Private configuration is never loaded into an isolated check copy.

## Final local validation — 8 October 2026

PASS: secret-free temporary copy, npm ci, npm run check (lint, Next type generation/TypeScript and production build), npm test: 372 tests, 372 passed, 0 failed, 0 skipped. Workflow YAML parsed via installed js-yaml; triggers, read-only permission and six steps verified. Linux/GitHub execution is still PENDING. Install lifecycle-policy warnings remain; no force upgrades or allowScripts changes.

PASS: git diff --check, no package/lockfile diff, nothing staged, HEAD unchanged at 18c48d0; .env.local/private ignored. Reviewed candidate credential-pattern scan found no secret keys/private-key blocks; relative documentation links resolve. This is a bounded pattern scan, not a guarantee about arbitrary sensitive prose. Existing private files were not read or changed.

Logs: /private/tmp/shkodra-readiness-review-install.log, shkodra-readiness-review-check.log, shkodra-readiness-review-test.log. Evidence reuses the completed hosted audit; no live schema/cloud audit repeated. Original 26 review candidates plus five new workflow/proposal files = 31 named files. Prior production-only audit zero is reused, not claimed as a fresh registry audit.

## Local-only continuation and reconciliation evidence

Owner explicitly selected Keep everything local: no branch/commit/push/PR or CI/protection activation. Fresh hosted read-only aggregates are clean; current function default ACLs plausibly account for extra service grants. See SUPABASE-RECONCILIATION-PROPOSAL.md for evidence and remaining provenance limits. No production data, history or cloud configuration change. No source/test change since 372 passing tests; documentation-only continuation checked with git diff --check.

## Publication authorization — 8 October 2026

Owner subsequently instructed to finish and publish the reviewed changes. This supersedes the local-only restriction for the 31 named maintenance files, CI trial and release. Migration/history/grant changes, booking/email tests, new resources and protection configuration remain outside this publication scope. Historical validation statements above retain their original timing.
