# Phase status

Updated: 2026-09-22.

CURRENT REVIEW: Phase 4D expiring seat holds and validated pending orders implemented; see PHASE_4D_REPORT.md. Signed private sessions, retry-safe holds/orders, countdown, release and reload recovery verified. Lint/typecheck, final isolated build, 17 integration tests and 14 native PostgreSQL tests passed; hosted HTTP and mobile browser checks passed. Synthetic holds released/catalog archived; immutable test order/audit history retained under an isolated operator. Next: Phase 4E Explore/SEO. Real content remains unpublished; local/development only, no payments or full Phase 4 checkpoint. Older notes below are historical.

CURRENT ONBOARDING: Activation and password-setup pages implemented and checked with a temporary account in Chrome, including token replay denial, password sign-in and 390px layout. Lint/typecheck/build and 15 identity tests pass. The owner's private setup file is ready; the user still needs to redeem it and choose a password. No email sent. See OWNER_ONBOARDING.md. Phase 3 remains PARTIAL pending the full admin acceptance matrix.

CURRENT ACCEPTANCE: Phase 3F usability fixes implemented, including inline mutation errors, in-page draft retention and pending submission guards; Phase 3 audit PARTIAL, no checkpoint. All 95 tests, lint/typecheck/build and development hosted Auth/local HTTP checks passed after the form changes. Chrome is now connected and `/admin` reached staff sign-in, but full interactive/mobile QA remains unverified. The user-specified pending owner account and active membership now exist; activation/password setup is still pending. See OWNER_ONBOARDING.md, PHASE_3F_REPORT.md and PHASE_3_AUDIT.md. Earlier notes below are historical.

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
- [x] Phase 3A admin shell - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3B product management - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3C departures/capacity - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3D CMS - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3E booking operations - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3F mobile QA - ACCEPTED; see PHASE_3_BROWSER_REVIEW.md and PHASE_3_AUDIT.md
- [x] Phase 3 audit/checkpoint - PASS; checkpoint-phase-3-admin; see PHASE_3_AUDIT.md
- [x] Phase 3.5 design foundation - COMPLETE; see PHASE_3_5_REPORT.md
- [x] Phase 3.5 audit/checkpoint - PASS; checkpoint-phase-3-5-design-foundation; see PHASE_3_5_AUDIT.md
- [x] Phase 4A homepage - CONNECTION COMPLETE; manual business content pending; see PHASE_4A_REPORT.md
- [x] Phase 4B product page - CONNECTION COMPLETE; manual business content pending; see PHASE_4B_REPORT.md
- [x] Phase 4C booking selection - COMPLETE; see PHASE_4C_REPORT.md
- [x] Phase 4D hold/customer/order - COMPLETE; see PHASE_4D_REPORT.md
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
