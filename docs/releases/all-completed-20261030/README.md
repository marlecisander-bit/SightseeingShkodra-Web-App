# Completed developments release — 31 October 2026

User authorized publishing all completed developments. Prepared in an isolated worktree from production 59eb2aba067140971bb941871e93fd8d803110eb. Original IDE checkout is preserved; its file hashes are retained in the ignored private preparation manifest.

## Scope

Preserves the already published product checklist, unified Stops & Destinations, full-history search and consistent editor actions. Adds responsive booking filters, date/time controls, button wrapping, notification and booking/cancellation dialog containment. Adds owner-only permanent booking deletion including paid bookings while retaining financial and audit history. No real booking is deleted during release acceptance.

Website-side Live Map contract/panel preparation is included, but `websiteExternalStatusEnabled = false` remains the public gate. The usable existing iframe remains. No companion project changes or deployment; external panel connection still requires paired acceptance and a later activation decision. Mock senders and preview routes are development-only. See LIVE-MAP-WEBSITE-HANDOFF.md.

## Database applied before application

Applied guarded `apply.sql` to existing production Supabase ybngoppqqiohcduojfyg. Source migration 20261030000400 adds a service-only RLS identity registry, repoints two historical notification foreign keys, adds a transactional owner/operator/reference-checked deletion RPC and excludes deleted reservations from search. Registry backfilled34, bookings remain34, deleted0. Before/after fingerprints of booking/order/payment/refund/item/hold records matched. Payment records remain1. Migration alone deletes no booking.

Verified exact source hashes, invoker mode, RLS, authenticated registry SELECT denial, anon/authenticated RPC execution denial and service execution privilege. Existing cancellation source unchanged. Read-only scoped search still total30 and empty0. Production metadata verification returned all true. Full migration compatibility, paid/unpaid, queue guards, authorization, idempotency and PostgreSQL capacity-race tests pass in isolated disposable databases. Applying the migration was dry-run locally first with historical schema.

## Validation

Final combined candidate: npm run check (lint/typecheck/build), npm test664 (163 component,24 identity,225 integration,217 database,28 PostgreSQL,7 CMS), npm audit --omit=dev --audit-level=low0 vulnerabilities, git diff --check. Production server smoke homepage200 and dev deletion404. Browser review uses native Chrome responsive emulation, not physical iPhone/Safari. Earlier admin acceptance and responsive-control reports/evidence retained; candidate booking dialog rechecked at390px. No customer emails, actual booking deletion, payment or real content writes during acceptance. Actual hosted owner safe reads are checked after release. Fixture acceptance is not real companion-map acceptance.

Vercel settings rechecked: Node24.x, Only build production with `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`. Feature branch is not staging. Database first, feature PR CI then squash main, production Ready and safe post-release checks. Main branch CI enforced manually before merge.

## Rollback

Prior production59eb2ab / Vercel7STL7SzgYWL12LASPZUG4x3YBNqa is retained as application rollback target. The new registry/search migration is compatible with the old application and should remain during rollback. Once deletion is used, dropping the registry or reverting SQL cannot restore a removed reservation/token; restore from backup is required for actual data recovery. No real deletion was performed for this release. Historical search rollback safely refuses the upgraded function; historical rollback/reapply and current refusal are tested. Do not run historical rollback.sql against this release.

Publication commit, PR, deployment URL and safe production results are recorded in publication.json after release.
