# Phase status

2026-09-25: Removed the four-step ?Keep it beautifully simple? homepage section. Shared how.* content remains on Tour; its existing editor moved from Homepage to Public pages > Tour ? How it works, with Tour preview target. Stored data preserved. Typecheck and focused ESLint passed.

LATEST USER TASK: Dynamic day planner connected to existing passenger quotes, effective schedule and independent published map stops. Responsive dialogs and Tirane clock update upcoming times. User-authorized read-only map bridge published as 6ab63a9701d7ac2c166d59a4; only public-presentation.js changed, actual derived status received in the website. 19 focused/regression tests plus bridge checks passed; lint/typecheck/isolated build passed. Desktop/tablet/mobile and dialog checks passed. No physical-van transition field test claimed. See DAY-PLANNER.md for data ownership, release and limitations.

LATEST USER TASK: Shared workspace admin header aligned into brand/identity and account-action groups. Removed Administration sublabel, added neutral divider, kept workspace/role visible on mobile, styled workspace switch as ghost action and sign-out as outline. Actual height 93px desktop/tablet, 149px mobile; all eight requested widths without overflow. Desktop/mobile screenshots inspected and workspace chooser navigation verified. Sign-out form remains bound to the same server action; live sign-out not invoked to avoid ending the owner's session. Lint/typecheck passed. AdminShell/admin.module.css only; public header/authentication unchanged.

LATEST USER TASK: Shared photographic footer compacted through spacing only. Removed CTA minimum heights, reduced padding/transition gap, tightened headline margins, brand spacing and navigation gaps. Actual Chrome heights: 621px at 1920/1440/1366, 581px at 1024, 548px at 768, 722px at 430/393. All seven widths had no horizontal overflow and metadata ended 28px above the footer bottom. Desktop/mobile visuals inspected; full-width image, font size, content, links, progressive fade and CMS bindings preserved. CSS-only application change in public.css; no rigid height or viewport-height rule introduced.

LATEST USER TASK: Public Guest Reviews now wraps heading/cards/actions in the shared p-container inside p-section. The global public section reset previously overrode the module's margin/padding/max-width. Removed the conflicting custom container; cards cap at 420px, tablet uses two grid columns, existing mobile rail/dots remain. Eight requested widths verified with centered container, safe gutters, card widths 289-383px and no page overflow. Desktop screenshot and Read more/less behavior checked; content, links and CMS logic unchanged. Lint/typecheck passed. Files: guest-reviews.tsx and guest-reviews.module.css.

LATEST USER TASK: Guest Reviews reuses CatalogCreate and catalog record styles for plus Add review and neutral existing rows. Shared control accepts an optional label/settings variant; neutral gear settings expose expanded state. Review author, wrapping source/stars, existing published/draft badges and muted order replace the pipe-separated summary. Original forms, CRUD and data unchanged. Desktop/mobile screenshots and keyboard toggles checked; mobile targets 48px with no overflow. Lint/typecheck passed. Files: reviews-panel.tsx, catalog-create.tsx, catalog.module.css.

LATEST USER TASK: Products & Suppliers hierarchy improved locally. Shared CatalogCreate uses the existing Button with plus, aria-expanded/controls and preserved mounted forms. Existing records retain native details/summary keyboard/disclosure semantics in neutral bordered rows; muted list labels separate them from create actions. Forms/actions/data unchanged. Chrome Enter/Space create toggles and both record toggles verified without saving; 1440/768/430/390px checks passed, 48px create targets and no overflow. Lint/typecheck passed. Files: catalog-panel.tsx, catalog-create.tsx, catalog.module.css.

LATEST USER TASK: Global photographic footer implemented locally in shared Footer: one CMS image and progressive fade contain CTA plus existing footer information. Removed duplicate homepage CTA and obsolete beige/footer styles. Eight responsive sizes checked without overflow; seven public routes returned one footer, HTTP 200. CMS fields/routes preserved; lint/typecheck passed. See PHOTOGRAPHIC-FOOTER.md.

LATEST USER TASK: Shared CMS navigation layout corrected locally: dedicated wrapping navigation row, normal-flow header, token-based 24px gaps, independent wrapping header actions. Seven viewport widths and three CSS zoom scales passed geometry checks without overlap/overflow; section switching preserved active states. Native browser zoom not separately verified. No CMS/backend behavior changed. See CMS-NAVIGATION-FLOW.md.

LATEST USER TASK: Homepage hero image-layer correction completed locally. Removed two stacked full-image gradients (up to approximately 85% combined bottom-left darkness); preserve natural image rendering with text-only shadows for readability. CMS assets, layout, crop, responsive behavior and backend unchanged. Actual Chrome checks at all six requested desktop/mobile sizes plus tablet showed loaded images, no dark overlay and no horizontal overflow. See HERO-IMAGE-RENDERING.md.

LATEST USER TASK: Dynamic Destinations CMS and Calendar & Pricing implemented locally, with three migrations applied to development Supabase. Destinations support draft/preview/publication/archive/reorder, preserved aliases and optional read-only stable map-stop associations. Calendar reuses existing schedule/inventory with base/range/date/departure overrides, offers, confirmed booked closures and Adult/Child/Infant snapshots; all passengers consume seats and an adult is mandatory. Existing content, orders and departures passed preservation comparisons. 213 automated tests passed; final lint and isolated production build (including TypeScript) passed. Actual calendar/destination browser checks completed partially; final responsive/public-booking checks remain blocked by a Chrome native dialog/connection. Child/Infant prices require owner configuration. No production deployment or external-map modification. See DESTINATIONS-CALENDAR.md for evidence, ownership, files and limitations.

LATEST USER TASK: Resend transactional booking emails implemented with the existing outbox/notification queue, separate customer/owner jobs, creation/modification/cancellation templates, bounded idempotent retries, retention and authorized manual resend. Prerequisite queue and new 20260925000100 migration applied to development Supabase; delivery remains disabled and no real email was sent. Database 106, integrations 57, identity 15 and PostgreSQL 21 tests passed (199 total); lint/typecheck/final isolated production build passed. Six email variants fit 320/375/768/1280px; actual admin disabled-resend feedback verified. Configuration/scheduler and controlled inbox checks remain required before launch. See BOOKING-EMAILS.md for architecture, exact environment/DNS settings, changed files and verification.

Updated: 2026-09-25.

LATEST USER TASK: Missing 25 September 09:00 traced to a persisted cancellation-test date exception, not timezone filtering. Restored normal schedule using guarded/audited RPC; availability and public dropdown now show 09/11/13/15, with 8/8/8/5 seats remaining and existing reservations preserved. Production booking logic unchanged. Added isolated clock-controlled SQL regression tests; fixed fixture date dependence. Focused tests 16/16, full DB suite 92/92 and lint passed. See DEPARTURE-0900-INVESTIGATION.md.

LATEST USER TASK: User requested text-only buttons across the platform. Removed decorative action arrows and leading CTA icons, retired icon props/reserved gutters from shared Button/ButtonContent, and removed arrows from CMS/discovery actions. Button text remains centered and responsive; icon-only functional controls and independent map GPS controls remain intact. Homepage checked at 1440/768/430/390/320px with no action arrows, clipping or overflow; CMS checked at 320px. Typecheck/lint passed. Local only.

LATEST USER TASK: Live-map fallback UI refined locally: matched primary reload and outline external-link buttons using the shared button system, map-container responsive stacking, and centered muted 14px helper text with an 18px gap. Browser checks at 1440/768/430/390/320px verified matching 48px heights, centered labels/group and no overflow; homepage helper overrides the older 400px paragraph restriction. Typecheck and lint passed. Reload callback, iframe URL, link target and tracking behavior unchanged.

LATEST USER TASK: Global button system implemented locally. Shared Button/ButtonContent and CSS tokens center labels independently of decorative arrows, preserve semantic icon groups and support responsive sizing/wrapping. Public, admin, CMS, booking and local tracking controls integrated; specialized navigation/stepper/map controls preserved. Nine requested widths checked across available public/admin routes, plus translation/state fixtures and booking dialog. Lint/typecheck/build and 50 identity/integration tests passed. Full checkout and populated-order controls remain unavailable for end-to-end QA. See BUTTON-SYSTEM-AUDIT.md.

LATEST USER TASK: Admin desktop audit/refactor implemented locally across all five management sections and workspace chooser. Shared branded shell, grouped permission-filtered navigation, compact desktop forms, usable overview links and container-responsive CMS. Seven routes checked at seven widths (375 to 1920px) with no horizontal overflow; expanded booking and schedule forms also checked. Lint/typecheck/build, 15 identity tests and 35 integration tests passed. No application logic intentionally changed; populated order interactions and full business regression are not claimed. See ADMIN-DESKTOP-AUDIT.md.

LATEST USER TASK: User explicitly authorized publishing the independent map centering fix. Netlify release 6ab4f2992136aa205e5470b2 published from current production manifest; exactly one of 104 files changed (css/live-map/tourist-layout.css). Previous deploy 6ab2613ad3fad446e0efa95b retained for rollback. Actual homepage iframe verified centered (0px offset, previously -93px), including 320/375/390/430/768/1024/1440 viewport widths with no clipped controls. Map tiles, live van and ETA rendered. No tracking JavaScript/backend changes. This supersedes the pending-publication note below.

LATEST USER TASK: Reusable widget action bar centering added to all LiveMapEmbed recovery controls. Independent map source patched locally to resolve embed/mobile width-position conflict for Find Me/Find Van/Route/Stops. Both bars verified at seven widths with 0px offset, no clipping; resize/reload and Route interaction checked. Typecheck/lint and 35 integration tests passed. Hosted map publication remains pending; parent CSS cannot change cross-origin iframe internals. See WIDGET-CONTROLS.md. No tracking logic or remote deployment changes.

LATEST USER TASK: Unified van-inspired visual system implemented with raspberry primary, selective yellow booking CTAs, white/cream surfaces, shared typography/radii/spacing and destination accents. Existing components and CMS content preserved. Seven requested widths checked on homepage, booking selection/dialog, live and CMS; no horizontal overflow. Authenticated CMS/Supabase content and live embed rendered. Lint/typecheck and final optimized build passed. Existing tests: 146 passed, five schedule tests failed due fixed-date 09:00 fixtures already in the past; operational code unchanged. Full checkout remains blocked by draft/unpriced product; external map internals unchanged. See UNIFIED-DESIGN-SYSTEM.md. Local only.

LATEST USER TASK: CMS image upload handling corrected. Hero originals have no application file-size cutoff: originals over 8 MB are prepared in-browser as web-ready images (maximum 3840px long edge, preserving aspect ratio) before upload. Other sections enforce 8 MB before transport with actual-size/remedy feedback. Upload exceptions stay inside the editor rather than reaching the workspace error boundary; current edits remain. Existing authenticated server validation/storage limits preserved. Typecheck, lint and three focused upload tests passed. Actual browser file-upload transport verification remains pending; no content publication or external deployment.

LATEST USER TASK: Bright red brand tokens implemented across local public/admin/CMS/booking/tracking presentation. Primary #E71922 with shared hover/active/soft/border variants replaces old burgundy literals; small accent text uses a contrast-safe darker alias. Logos, semantic colors and independent iframe styles preserved. Lint/typecheck, 32 integration tests and isolated build passed. Chrome visual checks passed for desktop homepage, booking selection, live tracking, admin overview and CMS, plus mobile homepage/booking/CMS. Later booking steps remain unavailable with the draft/unpriced product. See BRAND-COLORS.md. No functional/schema change or external deployment.

LATEST USER TASK: Recurring service schedules implemented in existing departures/booking architecture. Scoped schedules and exceptions use requested-day inventory, existing capacity guards and shared public availability. Migrations 20260923000200/20260923000300 applied to development. Requested 24 Sep-31 Oct daily 09/11/13/15 schedule saved; 25 Sep 09:00 exception verified; original departure ID preserved. 148 automated tests passed, plus browser save/date checks, lint/typecheck and isolated build. Product remains draft/unpriced, so public booking is not enabled. See SERVICE-SCHEDULES.md for semantics, migration evidence and limitations. No external deployment or map change.

LATEST USER TASK: Desktop CMS usability refactor completed on the existing content route. Wide 1600px workspace, compact section cards, paired image/short fields, sticky toolbar, contextual sidebar, section navigation and discard state reuse existing CMS actions. Browser save/publish, exact restoration of all 123 content values, workspace switching and navigation verified. Four desktop widths checked; three screenshots visually inspected. Lint, typecheck, 15 identity tests and isolated optimized build passed. See CMS-DESKTOP-USABILITY.md. Required images remain replacement-only; the earlier browser upload-permission limitation is still open. No public website redesign or external deployment.

CURRENT USER TASK: Existing homepage connected to structured Website content cards, draft/published snapshots, same-component private preview, separate desktop/mobile hero sources and media upload action. Development migration 20260923000100 applied and current local content imported. All 123 fields passed actual browser Admin → Supabase → `/` publication checks; original content restored exactly. 141 automated tests and isolated optimized build passed. Mobile/admin checks recorded in HOMEPAGE-CMS-CONNECTION-AUDIT.md. Browser file-upload transport verification remains pending Chrome extension file-URL permission; do not mark the entire user definition of done complete until that check passes. No external deployment or map-service change.

CURRENT READINESS: Phase 7C local readiness assessment completed; production NO-GO. Fresh 139-test regression and isolated optimized build passed. See PHASE_7C_READINESS.md for configuration review, backup/restore and rollback rehearsal, and launch blockers. Staging/content, recovery evidence, monitoring, deployment smoke tests and notification launch scope remain pending. No deployment or hosted changes. Next: resolve these acceptance gates; Phase 7D is not ready.

CURRENT VALIDATION: Phase 7B local checks PASS; full staging acceptance PENDING. Seven public pages and 141 internal links passed the read-only crawl, with local noindex/robots/sitemap and unknown-page 404 checks. Corrected sample-ticket wording for payment at the meeting point. 32 integration tests, lint and typecheck passed. See PHASE_7B_REPORT.md. Next: staging validation with approved published content when a deployment is available. No external deployment or Phase 7 checkpoint.

LATEST AUDIT: Phase 6 PASS for the approved local independent-map embed scope; see PHASE_6_AUDIT.md. 139 tests, lint, typecheck and isolated build passed; four HTTP placements and mobile/keyboard recovery checked. Upstream GPS/ETA, intermittent tile reliability and publication propagation are not certified. Next: Phase 7B local site validation, then staging checks when available. No external deployment.

CURRENT APPROACH: Existing public tracking app embedded on `/live` by explicit user decision. Original tracking admin/backend stay independent; deeper consolidation is superseded. Local iframe, fallback link and responsive layout verified in Chrome, including changing upstream distance/ETA and Route control. Lint/typecheck/isolated build passed. See LIVE_MAP_EMBED.md and DECISIONS.md. No external deployment or tracking-service changes. Earlier port entries are historical.

LATEST INTEGRATION: First local public tracking port implemented; see TRACKING_PUBLIC_PORT.md. Original GPS-health/parked-stop behavior ported with baseline parity tests; published GeoJSON routes/stops/POIs render through the shared component. `/live` now mounts it with an explicit unconnected state; fictional geometry stays in the dev preview. 32 integration tests, lint/typecheck and initial isolated build passed. Backend reads, realtime/ETA and admin integration remain pending; no hosted changes.

LATEST DIRECTION: User supplied the existing tracking app and authorized reuse to form one product. Phase 6A source reuse audit completed locally; see TRACKING_REUSE_AUDIT.md and DECISIONS.md. Found incompatible tracking/tenant schemas and multiple source modes requiring reconciliation. Phase 6B's new-map foundation remains available, but its reuse acceptance must now be revisited. Next: local port of the supplied public tracking behavior and shared tests; no live service changes or migration authorized.

LATEST BUILD: Phase 6B shared map foundation implemented and locally verified; see PHASE_6B_REPORT.md. Shared view/manage-selection interfaces, existing vehicle_positions reader and development-only fictional preview added. 29 integration tests, lint, typecheck, isolated build and desktop/narrow Chrome checks passed. No migrations or hosted writes. Next: Phase 6C public read-only tracking connection. Earlier entries below are historical.

LATEST REVIEW: Phase 5 audit PARTIAL; local meeting-point booking/notification checks pass, live messaging remains deferred. Two retry defects fixed; 132 tests, lint and typecheck passed. See PHASE_5_AUDIT.md. No Phase 5 checkpoint. Next separately scoped build: Phase 6B shared map under the fresh-project amendment; legacy reuse audit is not applicable.

CURRENT PHASE: Phase 5E local notification foundation implemented; live delivery pending by user decision. Queue, retry worker ports, email fallback simulations and admin status display added. All 129 tests, lint, typecheck and isolated production build passed. Migration tested locally only, not applied to hosted Supabase. No messages sent or providers connected. See PHASE_5E_REPORT.md. Earlier entries below are historical.

CURRENT SETUP: Owner sign-in verified. Van-tour price editor implemented under Products & stops; see ADMIN_BOOKING_SETUP.md. Exact EUR pricing, owner/admin permission, audit and stale-edit guards verified. Eleven targeted database tests, lint/typecheck and isolated build passed; migration applied to development Supabase. Real catalog remains empty for manual entry. Next: enter operational content/tours/stops/departures; notification delivery remains separately scoped. No external deployment.

PREVIOUS AMENDMENT: Pay-at-meeting-point booking implemented and verified; see MEETING_POINT_BOOKINGS.md and DECISIONS.md. Public/staff reservations confirm immediately without online payment; confirmed seats retain capacity, staff record full collection and cancellation releases inventory. Migration applied to development Supabase. 119 tests across completed runs, hosted HTTP/RPC and mobile confirmation/reload checks passed. Real content remains pending. Stripe/online payment phases skipped by user decision. Next: operational booking setup and separately scoped notifications; local/development only.

PREVIOUS CHECKPOINT: Phase 4 public implementation audit PASS for local/development scope under recorded amendments; see PHASE_4_AUDIT.md. All 116 tests, lint, typecheck and isolated production build passed. Real content and production readiness remain pending. Next: Phase 5A Stripe test-mode setup; no live payments or external deployment authorized.

PREVIOUS REVIEW: Phase 4F local public QA completed; see PHASE_4F_REPORT.md. Responsive checks, keyboard/menu/dialog focus, reduced motion, image behavior and continuous selection verified in Chrome. Distinct route titles and deferred checkout loading implemented. Lint/typecheck, isolated production build and 20 integration tests passed. Field Core Web Vitals and physical-device checks remain unverified. Next: Phase 4 audit; no full checkpoint or production deployment.

PREVIOUS REVIEW: Phase 4E Explore guides and SEO implemented; see PHASE_4E_REPORT.md. Published guide routes, canonical metadata, safe structured data and gated robots/sitemap verified. Lint/typecheck, isolated production build and 20 integration tests passed; hosted HTTP checks passed and temporary fixtures were removed. Localhost remains non-indexable. Real content entry and full public QA remain pending. Next: Phase 4F. No production deployment or full Phase 4 checkpoint.

PREVIOUS REVIEW: Phase 4D expiring seat holds and validated pending orders implemented; see PHASE_4D_REPORT.md. Signed private sessions, retry-safe holds/orders, countdown, release and reload recovery verified. Lint/typecheck, final isolated build, 17 integration tests and 14 native PostgreSQL tests passed; hosted HTTP and mobile browser checks passed. Synthetic holds released/catalog archived; immutable test order/audit history retained under an isolated operator. Next: Phase 4E Explore/SEO. Real content remains unpublished; local/development only, no payments or full Phase 4 checkpoint. Older notes below are historical.

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
- [x] Phase 4E Explore/SEO — IMPLEMENTED; see PHASE_4E_REPORT.md; manual content and Phase 4F QA pending
- [x] Phase 4F public QA — LOCAL QA COMPLETE; see PHASE_4F_REPORT.md for scope and limits
- [x] Phase 4 audit/checkpoint — PASS for local implementation; checkpoint-phase-4-public; see PHASE_4_AUDIT.md
- [ ] Phase 5A Stripe test setup — SKIPPED by pay-at-meeting-point amendment
- [ ] Phase 5B webhooks — SKIPPED; no online payment provider
- [x] Phase 5C replacement: atomic unpaid meeting-point confirmation — IMPLEMENTED; see MEETING_POINT_BOOKINGS.md
- [ ] Phase 5D provider refunds — SKIPPED; collected cancellations request manual refund review
- [ ] Phase 5E notifications — LOCAL FOUNDATION VERIFIED; live providers and activation pending
- [ ] Phase 5 audit/checkpoint — PARTIAL; local checks pass, live notifications deferred; see PHASE_5_AUDIT.md
- [x] Phase 6A tracking reuse audit — SOURCE REVIEW COMPLETE under tracking reuse amendment; active hosted mode remains unverified
- [x] Phase 6B shared map — LOCAL FOUNDATION VERIFIED; see PHASE_6B_REPORT.md
- [x] Phase 6C public tracking — EMBED VERIFIED locally under approved independent-app amendment; see LIVE_MAP_EMBED.md
- [ ] Phase 6D admin/regression — ADMIN MERGE SUPERSEDED; existing tracking admin retained; full tracking regression remains external
- [x] Phase 6 audit/checkpoint — LOCAL EMBED SCOPE PASS; checkpoint-phase-6-live-map; see PHASE_6_AUDIT.md
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

## 2026-09-24 - Booking QR pass amendment
Implemented persistent unique QR credentials, confirmation pass, admin QR/status and staff-only atomic lookup/check-in foundation. Development migration applied and existing booking backfilled. Database 97, PostgreSQL 20, integration 39 and identity 15 tests passed; lint/typecheck/production build passed. Browser desktop/mobile QR screenshots decode correctly; no horizontal overflow at tested widths. Camera scanner UI and physical scan/print validation remain deferred. See BOOKING-QR-PASSES.md.

## 2026-09-24 - Homepage simplification complete locally
Three homepage presentations removed with corresponding obsolete CMS headings hidden; shared destination editing preserved. Database 97 and integration 39 tests passed; lint/typecheck/build passed. Eight responsive widths checked. Tracking frame loads but current GPS feed is stale; full guide routes remain publication-gated. See HOMEPAGE-SIMPLIFICATION.md.

## 2026-09-24 - Manual guest reviews implemented
Existing reviews model extended; development migration applied. Role-scoped editor, publish/order/delete, settings, source-attributed cards, mobile carousel and hidden empty state implemented. Database 101, integration 42 and identity 15 tests passed, with responsive/browser verification. No real reviews supplied or invented; Google API remains unimplemented by request. See MANUAL-GUEST-REVIEWS.md.

## 2026-09-24 - Public/admin CMS reconciliation
Development migration 20260924000300 applied; public/shared editor connections implemented. Structured CMS proof 134/134; database 101 plus reconciliation 2; integrations 42; PostgreSQL 20; identity 15 passed. Lint/typecheck/build passed. Six admin modules and seven published public pages checked, four guides correctly publication-gated. Responsive CMS/Live checked at 375/390/768/1440px. External map loaded but GPS stale/ETA unavailable; all-operational-field browser editing and remote media binary comparison are not claimed. Full matrix, historical orphan inventory and owner decisions: CMS-RECONCILIATION.md.

## 2026-09-24 - Homepage Hero V2
Implemented locally and development migration 20260924000400 applied. Hero/header, active navigation, image focal controls and dedicated amenity editor verified. Database 106, integrations 42, identity 15 and expanded CMS proof 138 passed; lint/typecheck/build passed. Twelve requested viewport sizes and 0-12 amenity counts checked. Real amenities remain empty until owner publishes approved entries. See HOMEPAGE-HERO-V2.md for evidence and browser/device limits.
