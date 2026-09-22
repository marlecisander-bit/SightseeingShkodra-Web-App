# Phase status

Updated: 2026-09-22.

CURRENT ACCEPTANCE: Phase 3F usability fixes implemented; Phase 3 audit PARTIAL, no checkpoint. Browser provider has no connected apps/browsers, so interactive/mobile QA remains unverified. See PHASE_3F_REPORT.md and PHASE_3_AUDIT.md. Owner onboarding awaits user email. Earlier notes below are historical.

CURRENT: Phase 3E booking operations implemented; see PHASE_3E_REPORT.md. Browser form/visual QA and owner onboarding remain pending. Next is Phase 3F usability/mobile QA and Phase 3 audit. Earlier notes are historical.

CURRENT: Phase 3D content CMS implemented; see PHASE_3D_REPORT.md. Browser visual/form QA and owner onboarding remain pending. Next: Phase 3E booking operations. Earlier status notes are historical.

CURRENT: Phase 3C departures/capacity implemented with transactional capacity and stale-edit protection; see PHASE_3C_REPORT.md. Browser visual/form QA and owner onboarding remain pending. Earlier status notes are historical.

CURRENT: Phase 3B catalog CRUD implemented; database/quality verification recorded in PHASE_3B_REPORT.md. Browser visual/form QA and owner onboarding remain pending. Earlier progress notes below are historical.

CURRENT: Phase 3A admin shell implemented; HTTP authorization checks pass. Desktop/mobile visual QA and owner onboarding remain pending; see PHASE_3A_REPORT.md. No product-management work started.

CURRENT CHECKPOINT: Phase 2F shared contract complete and Phase 2 server-domain audit PASS. See BOOKING_API_V1.md and PHASE_2_AUDIT.md. Next: Phase 3A admin shell. Prior progress notes below are superseded; no public HTTP booking interface or live payment processing exists yet.

CURRENT PHASE: Phase 2E staff cancellation and refund-review hooks implemented; see PHASE_2E_REPORT.md. Next: Phase 2F shared API types/documentation. Earlier status notes are historical.

CURRENT PHASE: Phase 2D booking lifecycle primitives implemented; see PHASE_2D_REPORT.md. Next: Phase 2E cancellation/refund hooks. Earlier scope notes are historical.

CURRENT: Phase 2C pending orders/items implemented; see PHASE_2C_REPORT.md. Next: Phase 2D lifecycle primitives. Earlier phase notes below are historical.

LATEST PHASE: Phase 2B transactional hold implementation; see PHASE_2B_REPORT.md for capacity locking, retry and expiry policy. Next development scope is Phase 2C orders/items. Earlier status paragraphs are historical.

LATEST: Phase 2A availability/pricing implemented. 81 tests pass; lint/typecheck/build pass (build rerun after transient Windows EBUSY). See PHASE_2A_REPORT.md and BOOKING_AVAILABILITY_V1.md. Next: Phase 2B transactional holds. Earlier scope notes below are historical.

CURRENT ACCEPTANCE: Phase 1 foundations PASS. Hosted proxy cookie refresh, rejected-refresh session removal and successful idempotent privileged RPC are verified; see PHASE_1_PLATFORM_ACCEPTANCE.md. Earlier progress notes below are historical and superseded. Next scope: Phase 2A availability/pricing contract. No Phase 2 implementation yet.

Hosted identity update: real sign-in, refresh-token exchange, cross-operator reads, direct write denial, protected RPC denial and membership deactivation pass against the development project. Synthetic records were removed. Next.js cookie/expired-session integration remains pending; Phase 1 audit stays PARTIAL. See scripts/verify-supabase-development.mjs and SUPABASE_DEVELOPMENT_SETUP.md.

Supabase setup update: fresh development project `ybngoppqqiohcduojfyg` linked; all five migrations applied and remote history verified. Hosted database/API and Auth endpoint smoke checks pass. Real user/session and authenticated tenant-isolation checks remain pending. See SUPABASE_DEVELOPMENT_SETUP.md.

Active scope: Phase 1G fixtures complete; Phase 1H local checks pass (74 tests, lint, typecheck, build). Phase 1 audit is PARTIAL pending real Supabase Auth/PostgREST integration. Native PostgreSQL concurrency is verified for existing hold and event/audit primitives. No checkpoint or Phase 2 work yet. See PHASE_1_AUDIT.md and DECISIONS.md. No legacy imports or production changes.

## Roadmap execution checklist

- [x] Bootstrap source-of-truth files — COMPLETE
- [ ] Phase 0 manual preparation — LEGACY PREPARATION SKIPPED by approved fresh-project decision; cloud setup deferred
- [ ] Phase 0.5 existing-systems audit — SKIPPED by approved fresh-project decision (not audited/passed)
- [x] Phase 1A structure — COMPLETE; see PHASE_1A_REPORT.md
- [x] Phase 1B schema — COMPLETE; see PHASE_1B_REPORT.md for validation and platform limitations
- [x] Phase 1C holds/states — COMPLETE; see PHASE_1C_REPORT.md for evidence and remaining domain work
- [x] Phase 1D auth roles — COMPLETE locally; see PHASE_1D_REPORT.md for integration limitations
- [x] Phase 1E RLS — COMPLETE locally; see PHASE_1E_REPORT.md for evidence and platform limits
- [x] Phase 1F outbox/audit — COMPLETE locally; see PHASE_1F_REPORT.md
- [x] Phase 1G fixtures — COMPLETE; see PHASE_1G_REPORT.md
- [x] Phase 1H tests — PASS; see PHASE_1H_REPORT.md and PHASE_1_PLATFORM_ACCEPTANCE.md
- [x] Phase 1 audit/checkpoint — PASS; checkpoint-phase-1-foundations; see PHASE_1_AUDIT.md
- [x] Phase 2A availability/pricing — COMPLETE; see PHASE_2A_REPORT.md
- [x] Phase 2B holds — COMPLETE; see PHASE_2B_REPORT.md
- [x] Phase 2C orders/items — COMPLETE; see PHASE_2C_REPORT.md
- [x] Phase 2D lifecycle — COMPLETE; see PHASE_2D_REPORT.md
- [x] Phase 2E cancellation hooks — COMPLETE; see PHASE_2E_REPORT.md
- [x] Phase 2F API/types — COMPLETE; see PHASE_2F_REPORT.md
- [x] Phase 2 audit/checkpoint — PASS; checkpoint-phase-2-booking-api; see PHASE_2_AUDIT.md
- [ ] Phase 3A admin shell — IMPLEMENTED; visual QA pending; see PHASE_3A_REPORT.md
- [ ] Phase 3B product management — IMPLEMENTED; browser QA pending; see PHASE_3B_REPORT.md
- [ ] Phase 3C departures/capacity — IMPLEMENTED; browser QA pending; see PHASE_3C_REPORT.md
- [ ] Phase 3D CMS — IMPLEMENTED; browser QA pending; see PHASE_3D_REPORT.md
- [ ] Phase 3E booking operations — IMPLEMENTED; browser QA pending; see PHASE_3E_REPORT.md
- [ ] Phase 3F mobile QA — PARTIAL; code fixes applied, browser acceptance pending
- [ ] Phase 3 audit/checkpoint — PARTIAL; see PHASE_3_AUDIT.md; no checkpoint
- [ ] Phase 3.5 design foundation — NOT STARTED
- [ ] Phase 3.5 audit/checkpoint — NOT STARTED
- [ ] Phase 4A homepage — NOT STARTED
- [ ] Phase 4B product page — NOT STARTED
- [ ] Phase 4C booking selection — NOT STARTED
- [ ] Phase 4D hold/customer/order — NOT STARTED
- [ ] Phase 4E Explore/SEO — NOT STARTED
- [ ] Phase 4F public QA — NOT STARTED
- [ ] Phase 4 audit/checkpoint — NOT STARTED
- [ ] Phase 5A Stripe test setup — NOT STARTED
- [ ] Phase 5B webhooks — NOT STARTED
- [ ] Phase 5C atomic confirmation — NOT STARTED
- [ ] Phase 5D refunds — NOT STARTED
- [ ] Phase 5E notifications — NOT STARTED
- [ ] Phase 5 audit/checkpoint — NOT STARTED
- [ ] Phase 6A tracking reuse audit — NOT APPLICABLE to fresh project; see DECISIONS.md
- [ ] Phase 6B shared map — NOT STARTED
- [ ] Phase 6C public tracking — NOT STARTED
- [ ] Phase 6D admin/regression — NOT STARTED
- [ ] Phase 6 audit/checkpoint — NOT STARTED
- [ ] Phase 7A URL migration — NOT APPLICABLE to fresh project; see DECISIONS.md
- [ ] Phase 7B staging crawl — NOT STARTED
- [ ] Phase 7C readiness — NOT STARTED
- [ ] Phase 7D cutover (explicit approval only) — NOT STARTED
- [ ] Phase 7E stabilization — NOT STARTED
- [ ] Phase 7 audit/checkpoint — NOT STARTED
- [ ] Phase 8A product extension — NOT STARTED
- [ ] Phase 8B supplier inventory — NOT STARTED
- [ ] Phase 8C partner credentials — NOT STARTED
- [ ] Phase 8D AI.TEP contract — NOT STARTED
- [ ] Phase 8 audit/checkpoint — NOT STARTED
