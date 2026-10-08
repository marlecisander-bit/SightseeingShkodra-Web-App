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

### Local /live mobile audit — 25 September 2026
Scoped responsive map-first layout, shared compact planner, visible-page schedule refresh and loading feedback implemented. No tracking engine or database changes. Browser matrix 320–1920px and synthetic booking flow at 360/390px checked; build/typecheck/lint passed. See docs/LIVE-MOBILE-AUDIT.md for evidence and device-testing limitations. Local only; not deployed.

Publication authorized by user on 25 September 2026. Publishing the audited website changes through GitHub main to the existing Netlify website; independent map deployment unchanged.

### Email & Notifications admin - 25 September 2026
Implemented owner-only Settings section around existing Resend event/recipient queue, safe configuration projection, history/filtering, shared resend, six inline previews and allowlisted synthetic test send. No migration, booking engine change, real email or deployment. Existing email 15 + new admin 8 + identity 15 tests passed; responsive fixture 360-1440px, typecheck/lint/build verified. See docs/EMAIL-ADMIN.md for verification limits and missing server setup.

### Resend activation preparation - 25 September 2026
Prepared native Netlify one-minute adapter for existing authenticated worker, bounded owner-readable heartbeat, and activation-boundary filtering of already-queued historical email jobs. New local migration 20260925000500 is NOT applied remotely. Existing provider/queue/retry engine retained; booking engine unchanged. 83 focused tests and 21 embedded PostgreSQL concurrency tests passed; typecheck, lint and production build passed. Exact configuration table and 15 manual setup steps in BOOKING-EMAILS.md; inventory/limits in EMAIL-ACTIVATION-PREPARATION.md. Automatic sending remains disabled; no real sends, hosted configuration changes or deployment.

### Mobile booking dialog - 25 September 2026
Existing booking dialog now uses a mobile When/Guests/Review sheet below 768px, sharing provider/availability/pricing/checkout state and retaining desktop single-form layout. Scoped controls/footer, body scroll lock, focus handling and state preservation implemented. No database/backend/email/tracking changes or deployment. Eight requested viewport sizes checked with simulated availability and existing /book handoff; physical iOS/Android browser controls remain unverified. Lint/typecheck/build passed; targeted domain tests 28 passed with two unchanged legacy public-availability expectations failing. See MOBILE-BOOKING-DIALOG.md for evidence and limits.

Mobile booking publication verified on https://sightseeingapp.netlify.app after GitHub commit 32670c5. Live 390px dialog displays the new When/Guests/Review sheet entry, date field and disabled Continue. No booking submitted. Email admin/activation files, scheduler and migration remain local, excluded from the release.

### Customer booking management and occupied-seat policy - 25 September 2026
Audited existing engine before implementing user's updated rules. Three LOCAL migrations 20260925000600-000800 separate seats/passengers, enforce Tirane 15-minute cutoff and add secure customer management using existing pricing/cancellation/events. Atomic unpaid modifications exclude own seats; paid/checked-in cases require staff. No hosted migration, email activation or deployment. Full suite 246 passed plus five new focused checks; lint/typecheck/build passed. Mobile management flow verified with mocked API at 320/360/375/390/430/768/1440px; engine concurrency tested on local PostgreSQL. Owner-approved Google Maps meeting-point link is shared by confirmation, management and non-cancellation email templates. See BOOKING-MANAGEMENT-AUDIT.md for exact files, tests and release limits.

### Booking management publication - 25 September 2026
User authorized publication. Migrations 20260925000600, 20260925000700 and 20260925000800 applied atomically to linked Supabase; existing fields preserved for 7 bookings, 9 orders/items/holds and 24 departures. Opaque management tokens backfilled; anonymous RPC execution denied, service role allowed. Website release verification pending. Separate email admin/scheduler and migration 005 excluded.

Publication verified: GitHub main commit 9269b19390b1afe2ef654795ee8e3a29096aab97, Netlify deployment 6ab683509124bc000772b363 ready and published at https://sightseeingapp.netlify.app. Exact isolated release passed lint/typecheck/build and 236 tests (15 identity, 71 integration, 128 database, 22 PostgreSQL concurrency). Homepage, /book and /booking/manage returned HTTP 200. Production management endpoint read an existing booking with matching reference and no-store; malformed token rejected with 404. No production booking mutation or email send tested. Separate email-admin/scheduler work remains unpublished.

### Cancellation to new booking fix � 25 September 2026
Local UI fix resets cancelled checkout restoration and shared booking state, adds Book Again and refreshes authoritative availability. Existing transactional cancellation, seat accounting, cutoff and notification events retained. No migration/deployment/email send. Build/lint/typecheck passed; 254 tests passed across runs, six mocked browser flows at 390/1440px passed. See CANCELLATION-REBOOKING.md.

User authorized publishing the cancellation/rebooking fix on 25 September 2026. Release verification pending; unrelated email admin/scheduler remains excluded.

Publication verified: commit 7e21f0169ce83bb4d036c1d75ac6234fb8884ec7, Netlify deploy 6ab68878787ac500083c826a ready at https://sightseeingapp.netlify.app. Homepage/book/manage HTTP 200; existing booking read and invalid token rejection passed. Published 390px UI passed Book Again and stale cancelled-session recovery with mocked booking APIs. No real booking mutation or email send.

### Production admin authentication audit � 25 September 2026
Existing Supabase Auth, SSR cookies, staff_profiles membership and permission/RLS model retained. Added generic recovery-request UI/action using existing verification/password setup, clearer login errors, logout router-cache invalidation and bfcache revalidation. No migration, role assignment, message or deployment. 257 tests and lint/typecheck/build passed; logged-out route/storage-spoof and public-route checks passed. Manual real-account session/email acceptance remains. See ADMIN-AUTH-AUDIT.md, ADMIN-RLS-INVENTORY.md and FIRST-ADMIN-ASSIGNMENT.sql.

### Staff login UI — 25 September 2026
Split-screen brand/photo login with form-first mobile layout implemented on existing route. Only presentation components changed; authentication/authorization/recovery unchanged. Seven viewport checks, submit interaction checks and 17 identity tests passed; isolated lint/typecheck/build passed. Review at localhost:3007/auth/sign-in. No deployment. See STAFF-LOGIN-DESIGN.md.


### Live map responsive presentation ? 26 September 2026
Audited iframe consumers and standalone source. Explicit preview/full intent, container sizing and scroll-safe interaction; independent map owns compact/mini presentation and single overlay-aware observer. Tracking/backend logic unchanged. Thirty homepage/live viewport cases plus standalone and resize/interaction checks passed using local fixtures; lint and isolated typecheck/build passed. Root typecheck fails in pre-existing private nested copy. Physical-device gestures remain unverified. No deployment. See LIVE-MAP-EMBED-RESPONSIVE-AUDIT.md.


### Website responsive release candidate ? 28 September 2026
Hero-only amenities removed (CMS/data retained), logo returns home/top with menu/hash cleanup, checkout flow presentation simplified, landscape menu bounded. 15-size local matrix and 390/1440 navigation passed; seven-width management and six rebooking browser flows passed using synthetic responses. 31 focused local DB/integration and 23 PostgreSQL concurrency tests passed; lint and isolated typecheck/build passed. Hosted map status/loading overlap remains in separate Map App; physical-device and authenticated admin UI acceptance incomplete. NOT READY FOR PRODUCTION. Nothing deployed. See RESPONSIVE-RELEASE-CANDIDATE.md.

### Website publication authorization - 28 September 2026
User requested publication of the responsive website candidate. Publishing website presentation changes only; separate Map App and unrelated email/admin work excluded. Audit limitations above remain; publication does not certify those outstanding checks.

### Homepage section visibility - 28 September 2026
Eight homepage-only visibility flags added to existing structured draft/publication content, with collapsed-card switches and conditional rendering. Global structure and inactive amenities preserved. Optional SQL validator extension tested only in disposable local databases; hosted migration required before saving these fields there. Six visibility/hero and ten existing CMS/content tests passed; five browser widths passed; lint and isolated typecheck/build passed. Root typecheck retains pre-existing private-copy errors. No deployment. See HOMEPAGE-VISIBILITY.md.

### Mobile bottom action bar removal - 28 September 2026
Removed the mobile-only Live van / Book your day container, its CSS rules and the public wrapper's 90px compensating padding. Top header, content links, desktop CTAs and booking/map behavior retained. Dialog-specific safe-area padding preserved. Local browser checks passed at 320/360/375/390/393/412/414/430/768/1440px: no bar DOM, zero wrapper bottom padding, footer reaches document bottom, scrolling, no horizontal overflow, header logo/CTA, modal open/close and map links. Targeted ESLint passed. iPhone Safari hardware/safe-area rendering not exercised; WebKit runtime unavailable. No deployment.

### Admin UI refinement - 28 September 2026
Audited existing modules and ownership; refined shared shell, mobile menu, navigation grouping, CMS card descriptions/field groups, catalog labels/separation, booking reference disclosure and email Advanced sections. Existing routes/actions/permissions and business logic retained; no new settings, tables or metrics. 66 fixture browser cases across 11 widths and 54 regression tests passed. Logged-out access checks passed; actual authenticated mutation/login acceptance remains. Local only, no deployment. See ADMIN-UX-REFRESH.md.

### Publication authorized - 28 September 2026
Publishing homepage visibility, mobile bottom-bar removal and admin presentation improvements, including the existing email admin screen and its safe dependencies. Homepage visibility validator applied to linked Supabase; all six content records verified unchanged. Email automation/scheduler activation and migration 20260925000500 are excluded. Separate Live Map repository unchanged. Release verification pending.

### Admin visual refinement — 28 September 2026
Existing public palette and light logo applied to red header, white grouped sidebar, compact CMS cards, accessible green/grey visibility switches and contextual tips/preview. Shared presentation only; existing services/actions unchanged. Isolated build, targeted lint and 20 identity/CMS tests passed; 22 responsive fixture cases had no overflow. Menu, toggle/discard and editor expansion checked. No production mutation/deployment. See ADMIN-VISUAL-REFINEMENT.md.

Admin refinement continuation: calendar-first presentation, real service-period label, mobile visibility order and standalone admin screen spacing corrected. Expanded local 72-case/12-width layout matrix passed. Existing ownership, login, booking cards and advanced email architecture retained. No deployment.

Admin refinement final continuation: page-level publication status corrected across scopes; repeated per-card Published badges removed; hidden/edit states and normal context scrolling added. CMS ownership traced to existing timetable and destination sources. Twelve additional responsive cases and hidden/edit/discard passed. Local only.

Admin refinement audit continuation (146–208): route/component/data/asset mapping and duplication report completed in ADMIN-VISUAL-REFINEMENT.md. Draft preview labels clarified; expanded CMS cards no longer repeat collapsed Save/Discard controls. Catalog/email list wording simplified. No new data flow, public styling, dependency or deployment.

Admin refactor acceptance continuation (208–260): ownership/duplication table and load review recorded in ADMIN-DUPLICATION-AND-REGRESSION.md. 79 local regression tests passed, covering booking capacity/cutoffs/rebooking/QR, CMS visibility, pricing, review ownership and email/identity authorization. No additional query/write path introduced by the visual diff. Full real authenticated browser acceptance and physical-device checks remain unverified. No production changes/deployment.

Admin recovery continuation: collapsed visibility-save feedback now visible; persisted visibility explicitly shown during unsaved edits. Local denied-save test and exact 12-viewport matrix passed. Asset inventory and remaining performance/device/real-data acceptance limits documented. No deployment.

Final admin refinement report: docs/ADMIN-REFINEMENT-FINAL-REPORT.md consolidates implementation, assets, duplication, data safety, architecture, responsive checks and acceptance gaps. NOT READY FOR PRODUCTION: full safe real-data browser acceptance, physical Safari/PWA and performance profiling remain incomplete. No deployment.

Definition-of-done follow-up: normal production build now passes after excluding ignored private verification copies from TypeScript initial discovery. Strict application checking retained. No source/data deletion or deployment. Real-data/device/performance acceptance remains open.

Authenticated acceptance retry: real Owner CMS and six read-only admin surfaces load. Fixed demonstrated visibility switch CSS specificity collision; actual CMS passes 12 viewport widths without document overflow, switches 40x24px. Shared database remains read-only; no staging exists and emails disabled, so write-based end-to-end acceptance remains NOT TESTABLE. See final report. No deployment or commit.

Final acceptance continuation: Owner logout, protected-route redirect and user-assisted login again passed. Existing /live iframe loaded independent Netlify map and arrival/stop UI. Real calendar presentation verified; limited initial network capture recorded. No application changes or deployment. Isolated-data write tests and safe email delivery remain unverified. See ADMIN-REFINEMENT-FINAL-REPORT.md.

Pre-production closure: corrected infant seat wording only after 14 targeted engine tests passed; eager first CMS thumbnail/context preview verified with no captured warning. Lint, TypeScript and normal build pass. Full suite: identity17/integration87/database128 passed, 5 destination migration setup failures; PostgreSQL23 passed separately. Full regression gate not green. Isolated acceptance plan and classifications recorded in ADMIN-REFINEMENT-FINAL-REPORT.md. No deployment, email enablement or production mutation.

Destination fixture gate repaired: fixed historical homepage fixture replaces moving current defaults; eight newer visibility flags caused historical strict-key validation failure. No app or migration changes. Five isolated tests and 29 related tests pass; complete npm test TOTAL260/PASS260/FAIL0/SKIP0. TypeScript, lint and normal production build pass. CODE GATE PASS; READY FOR ISOLATED ACCEPTANCE TESTING. Mutation/email/physical-device acceptance remains pending. No deployment.

Admin refinement publication authorized by user. Scope: admin presentation, visibility feedback, infant wording, preview loading, historical destination fixture and verification reports. Excludes unrelated email activation/scheduler work, SQL account edits and infrastructure setup. Acceptance limitations retained. Deployment verification pending.


### Authorized online test acceptance - 28 September 2026
Published commit df7e898e415319d00c7b27ec4cb7ab7cf8df1b32 verified in Netlify deployment 6aba6e95863ab500088a1fc5. User authorized controlled mutations in the shared pre-launch TEST backend, superseding earlier no-staging write blockers. Online CMS/visibility/image-address workflow, calendar/pricing/catalog/reviews, booking/capacity/cutoff/QR and login cycle passed. Seven synthetic bookings cancelled, review soft-deleted, original content/configuration restored, exceptions removed. No app/schema/map changes or email activation. File upload remains blocked by browser file-access permission; email and physical-device acceptance pending. Full acceptance remains incomplete. See ONLINE-ACCEPTANCE-REPORT.md for matrix, evidence and limits.


### Standardized booking UI - 29 September 2026
Local frontend changes unify modal and /book in CheckoutFlow with When/Details/Confirm, shared date/passenger/departure controls, authoritative snapshot totals, date-labeled adult discovery prices, responsive summary, existing QR and native cancellation confirmation. User approved private-link management. No backend/schema/map changes or deployment. Existing 260 regression tests passed; final lint/typecheck/build passed; synthetic browser flows and responsive checks passed. Exact cutoff timestamp/season-wide minimum are not exposed; generic policy and date-scoped fares retained. See BOOKING-UI-STANDARDIZATION.md for scope and limitations.

Booking UI continuation 52-121: shared price/caption formatting and snapshot breakdown, management shared summary and actual cutoff, compact QR/reference priority, one progress indicator, required labels and mobile focus behavior. Lint/typecheck/build pass; synthetic flow and twelve requested viewport settings checked. Hardcode audit and limits in BOOKING-UI-STANDARDIZATION.md. No deployment or hosted mutation.

Booking UI continuation 122-192: readable dates, zero-price infant Free labels, cancellation reference/consequences, status and loading copy, unavailable-date recovery and compact mobile entry. Existing pricing/capacity/submission/default/SEO architecture preserved. Typecheck/lint/build pass; synthetic cancellation and infant quote checks pass. No deployment. See BOOKING-UI-STANDARDIZATION.md.

Booking UI continuation 193-276: centralized scarcity and discovery formatting, shared exact-total transaction action, mobile summary density and step focus/scroll. Full regression suite 265/265 passed; lint/typecheck/build passed; delayed local response checks and twelve requested viewport settings passed. No hosted mutations or deployment. Physical device/performance limits remain.

Booking UI 277-349: pricing-source/hardcode/component/protected-backend reports complete; added adult discovery/date-context projection tests and suppressed booking-route marketing invitation. Full267/267 tests and check pass. Full future-season minimum unsupported by existing DTO; date-scoped From retained. Full hosted/device/performance acceptance pending; no deployment.

Booking UI final closure (350-425): removed verified unused modal/management CSS, corrected remaining tour Booking opens soon/per-guest fallback and CTA, completed BOOKING-UI-FINAL-REPORT.md. Final full suite267/267, zero fail/skip, lint/typecheck/build PASS. Exact twelve-size modal matrix passes; final raw network capture unavailable. Online candidate/device/performance acceptance pending. No deployment.

Booking UI continuation 426-514: extracted accessible shared BookingProgress, shared modification review summary and updated-result feedback, safe unexpected management error fallback, readable homepage timetable. Reset and English-only architecture audited. Strict read-only availability conflicts with existing date materialization; full management QR confirmation lacks required response data; future-season minimum remains unsupported. Backend changes deferred per user escalation rule. Final report records these gaps; no deployment or hosted mutations.

Booking UI 426-514 verification: all269 tests passed (17 identity,96 integrations,133 database,23 PostgreSQL), zero failed/skipped; lint, TypeScript and production build passed. Browser reconnection unavailable. Full acceptance remains incomplete; backend escalation details in BOOKING-UI-FINAL-REPORT.md.

Booking UI final specification 514-518 received: explicit surface YES/NO matrix, strict PASS/FAIL acceptance gates and non-negotiable checklist added to BOOKING-UI-FINAL-REPORT.md. Overall final acceptance FAIL (incomplete requirements/evidence, not regression failures). Existing269-test suite and production build PASS. No application edits at this checkpoint, no backend changes or deployment.

Booking UI gap closure: no application edits. Revised brief accepts authoritative updated summary and confirmation-specific QR. Chrome reconnected; eight surfaces x12 viewports (96 layout checks) passed; representative screenshots and targeted keyboard/validation/dialog/contrast checks recorded. Full269 tests and lint/typecheck/build PASS. General From remains BACKEND-DATA LIMITATION; seasonal full acceptance, comprehensive accessibility and physical devices pending. WordPress N/A. No backend changes or deployment. Current statuses supersede historical blanket FAIL labels; see BOOKING-UI-FINAL-REPORT.md.

Booking UI online acceptance - 29 September 2026: published current candidate f9243e96d6ef9854cbd534dde05456bfdf1623ee in ready Netlify deployment 6abb689c8a43870008bd4681. No additional application edits. Online three-step creation, QR, manage, modification, cancellation/restart, capacity recovery and existing seasonal configuration passed. Nine surfaces x12 Chrome sizes passed overflow checks. All three synthetic bookings cancelled; products/schedules/exceptions match baseline. General From remains BACKEND-DATA LIMITATION. Exact real-clock cutoff boundary not replayed; physical devices, comprehensive accessibility/performance and email remain pending. See BOOKING-UI-ONLINE-ACCEPTANCE.md for current scope; historical unpublished checkpoints are superseded.

Mobile homepage hero simplification - 29 September 2026: local CSS/composition changes reuse HomepageHero, CMS photograph/copy, header, BookingPriceIndicator, /book and /live. Mobile header duplicate CTA/secondary copy/date hidden; clear van zone and lower stacked booking/tracking actions. Desktop 1440px geometry matches deployed baseline. Required portrait settings and extra landscape/desktop checks had no document overflow; 393px requested rounded to394 in Chrome. Full269 tests, lint, TypeScript and production build PASS. Physical Safari/Android, actual browser bars/safe areas and comprehensive accessibility/performance remain unverified. Existing CMS image-alt mismatch noted. No deployment or backend changes. See MOBILE-HERO-SIMPLIFICATION.md.

Mobile hero publication - 29 September 2026: user authorized publishing the tested changes. Commit c8e654e8b329268c1ad7885998a39ef3f3d3664d published successfully in Netlify deployment 6abb7648b959450008d62b7b (ready). Live homepage HTTP200, new commercial markup/mobile header and image CSS, /book and /live links verified. Only three hero presentation application files and the hero report were committed; unrelated work excluded. Existing physical-device/accessibility/performance acceptance limits remain.

Mobile hero browser-chrome correction - 29 September 2026: CSS-only local fix puts visible mobile homepage header in flow, derives visual area from width and removes viewport-height surplus/auto-margin positioning. Narrow landscape flow corrected too; desktop unchanged. Five exact widths x5 height states had zero document-position shift; scroll and orientation transitions passed in desktop Chrome. Full269-test rerun and lint/TypeScript/build PASS after a transient PostgreSQL EBUSY cleanup failure on the first run. Physical Safari/Android browser bars remain unverified. No deployment. See MOBILE-HERO-STABILITY.md.

Public booking CTA standardization - 29 September 2026: audited 12 CTA definitions; six route-only entries now use the existing BookingProvider dialog through PublicBookingLink. Header, hero, footer, tour, planner, Explore and cancelled-management entries share CheckoutFlow; /book retained. CMS navigation to /book also shares the opener. No hero styling, backend, database, map or email changes; no deployment. All269 tests and lint/typecheck/build PASS. Browser entry/focus/reopen checks and eight-size dialog plus /book matrices PASS. Synthetic cancelled-management response used only in the test tab and cleared. General From remains BACKEND-DATA LIMITATION; physical devices and comprehensive accessibility/performance remain unverified. See BOOKING-CTA-STANDARDIZATION.md.

Public booking CTA and mobile hero publication - 29 September 2026: user authorized publication. Commit 3e460c40d9e310f95a0f8581dcdef62d136ccace is published in ready Netlify deployment 6abbac37f64be800096ff499 at https://sightseeingapp.netlify.app. Exact release commit production build passed in an isolated checkout with its own installed dependencies. Online desktop header/hero and mobile hero open the same three-step dialog without navigation; Escape restores focus, /book loads directly, and 390px homepage has in-flow header and no horizontal overflow. Only six frontend files and two scoped reports were committed; unrelated email/database work excluded. No data mutation or email activation. Physical-device and comprehensive acceptance limits remain. This publication supersedes the local-only status in the two release reports.

Mobile homepage structural correction - 29 September 2026: restored the existing fixed transparent/red header; size-aware refresh of its existing intersection observer; bounded photo region followed by normal-flow price/Book/Track and 44px Discover. Unified mobile/tablet grid through 900px removes the 700/701 gap. Existing assets/focal points, desktop composition, booking dialog and map integration retained. All269 tests, lint, TypeScript and production build PASS. Eleven required phone/edge/tablet geometry cases, scrolling/menu, height/orientation simulations and public CTA regressions checked in Chrome, including local production build. Physical Safari/Android and comprehensive accessibility/performance remain pending. No deployment or backend/data changes. See MOBILE-HOMEPAGE-STRUCTURAL-FIXES.md.

Mobile homepage structural fixes published - 29 September 2026: user-authorized commit cb483f03ccd223e8ba9866a5a1c173d78838e469 is ready in Netlify deployment 6abbb55432fdf90008d45cfa. Exact isolated release build passed. Online fixed/solid header, menu, photo boundary, compact Discover, five-width layout and canonical booking entry checks passed. No unrelated application or data changes. See MOBILE-HOMEPAGE-STRUCTURAL-FIXES.md.

Public expandable text - 29 September 2026: audited 14 logical text categories; six now use one shared rendered-overflow-based ExpandableText component with 4/5/6 responsive lines, semantic keyboard controls, full SSR content and destination/text reset. Removed review-specific character-count and bounded-scroll behavior. Home eight-size matrix, all four destinations, synthetic short/medium/very-long text, Tour/Explore and booking/map sanity checked. Existing 269-test chain plus 3 new component tests passed; lint/TypeScript/production build passed. No CMS/data writes, protected engine/header/hero changes or deployment. Physical devices and full assistive-technology coverage remain unverified. See PUBLIC-EXPANDABLE-TEXT.md.

Hero CTA, price and navigation - 29 September 2026: mobile commercial controls now sit in the single bounded photo region; compact Discover follows on white. Existing image/focal points, fixed transparent/red observer header and canonical booking retained. Larger logos, accessible hamburger/X, scrollable translucent brand menu, focus/scroll handling and text-width yellow underline implemented. User chose next bookable service date with date shown; hero uses canonical one-Adult quotes and existing date helper, including seasonal/offers, without a schema or pricing-engine change. All276 full-chain tests plus one additional homepage failure test passed; final lint/TypeScript/build passed. Fifteen responsive sizes and real local EUR10 hero/booking comparison checked; EUR10-to-EUR12 and seasonal price changes verified in disposable database. Physical devices remain unverified. No deployment. See HERO-CTA-PRICE-NAVIGATION.md.

## Hero/navigation extended acceptance — 29 September 2026

Full npm test passed277/277, zero failed/skipped (private/hero-nav-complete-tests.log). Added901px boundary, six desktop active indicators, logo return, four menu close scroll-restoration positions and short-screen internal menu scrolling. No additional application changes or deployment. See HERO-CTA-PRICE-NAVIGATION.md for scoped evidence. iPhone Safari / Android Chrome: PENDING REAL-DEVICE VALIDATION. Existing EN is informational; no switch/submenus invented.

Hero/navigation final supplement (79–112) - 29 September2026: fixed menu background pointer interaction with subtle dismissible backdrop; browser tap/focus/dialog/Discover/Live regressions checked and eight review screenshots captured. Final lint/type/build PASS after edit. READY FOR REVIEW, not deployed. Admin-to-rendered-hero-to-dialog price-change propagation is NOT VERIFIED end-to-end; earlier PASS described disposable database projection/quote testing only. Physical-device validation remains pending. See HERO-CTA-PRICE-NAVIGATION.md final supplement.

CMS visibility audit/fix - 29 September2026: identified final.showOnHomepage bypass on secondary routes and unguarded banner image. Shared FinalInvitation now removes complete markup/media on all configured routes; related shared CMS section consumers and anchors use the same flags. Admin scope labels, preview pathname parity, review layout invalidation and fail-closed publication fallback corrected. Controlled canonical save/publish enabled-disabled-enabled cycle and edited fields passed for seven route contexts; 11-width enabled/disabled fixture matrix passed with no invitation gap. Actual local Tour/Explore/Live disabled-state checks and booking/map regressions passed. Full280 tests and lint/type/build PASS. READY FOR REVIEW; no deployment or hosted data writes. Details and limitations: CMS-VISIBILITY-AUDIT.md.

### Public website publication — 29 September 2026
Published bb8cb98df3a28a342aff5c8e7a1437413247536c; Netlify 6abbc3a5a9b9e90008aac707 ready at https://sightseeingapp.netlify.app. Exact isolated release: 273 tests passed, lint/type/build passed. Live mobile hero, expandable text, booking dialog and shared invitation hiding checked. See CMS-VISIBILITY-AUDIT.md publication appendix. Unrelated email/SQL changes excluded; no hosted content writes or email enablement. Physical-device validation remains pending.

### Mobile hero composition correction — 29 September 2026
Local CSS-only hero correction removes the 200vw media minimum and flexible surplus row; content-sized rows, absolute spanning photo, bounded vehicle gap and uniform portrait crop bring the van and commercial block upward. At390x844 photo height977->618px, price top760->401px. Eleven viewport geometry cases and four height simulations passed; desktop1440 geometry unchanged. Header/menu, canonical booking dialog, price display and /live browser regressions passed. All280 working-tree tests, lint, TypeScript and production build PASS. Physical iPhone Safari/Android Chrome: PENDING REAL-DEVICE RETEST. READY FOR REAL-DEVICE RETEST; not deployed. See MOBILE-HERO-COMPOSITION.md. No data, image-asset, header architecture, booking/pricing/map or unrelated work changed.

Mobile hero composition published — 29 September 2026: authorized commit84dc5376bb371a97397c983dfcd47626b30d59f2 verified in ready Netlify deployment6abbc74fe565ae00088616a5. Exact isolated lint/type/build PASS; live390px composition matches local measurements and canonical booking opens. Physical-device retests pending. See MOBILE-HERO-COMPOSITION.md publication appendix. Unrelated email/SQL changes excluded.

### Full-screen mobile hero — 29 September 2026
User phone screenshot supersedes outside-photo Discover requirement. Mobile hero now fills100svh with photo through Discover, hides hero Track live and lowers headline/subtitle20px. Short screens allow readable overflow. Desktop geometry unchanged; 11 viewport and four height checks, menu/booking/Discover checks PASS. Lint/type/build and15 focused tests PASS. Physical Safari/Android retest pending. Local only, no deployment. See MOBILE-HERO-FULLSCREEN.md.

Full-screen mobile hero published — 29 September 2026: commit0d3760115946a42f52f122cd08b9ea92858dbc09 ready on Netlify. Exact isolated lint/type/build PASS; live390x844 full-screen photo/Discover and hidden mobile Track verified. No unrelated email/SQL publication. Physical-device retest pending. See MOBILE-HERO-FULLSCREEN.md.

## Public section spacing correction - 29 September 2026

Reviewed the live Home, Tour, Explore and Live page presentation. The homepage departures section lacked p-section, leaving Today, at a glance directly against the preceding cream band. Added the shared responsive section inset (112px at desktop, 64px on phones). Live Map now uses the same content gutters and responsive vertical spacing as the surrounding sections. Adjacent white sections share one section interval instead of doubled padding; Tour reviews no longer apply a second set of horizontal gutters. Explore story rows already have consistent equal padding and remain unchanged. Hero composition and functional controls are unchanged.

Verified local homepage geometry at 320, 390, 768 and 1440px: aligned section content edges, correct band insets and no horizontal document overflow. Tour reviewed at 390 and 1440px with aligned reviews and consistent section intervals. Desktop color transition visually inspected. Six component tests and nine public-homepage integration tests passed; lint, typecheck and production build passed. Physical-device validation is not claimed. No deployment or data writes performed for this spacing correction. Local geometry evidence: private/section-spacing-geometry.json; verification logs: private/section-spacing-*.log.

## Destination button spacing - 29 September 2026

Added a shared wrapping p-button-group with the existing 16px spacing token around Explore destination actions. All four Read the guide / Book your day pairs now have a measured 16px horizontal gap, or 16px vertical gap when wrapping on narrow screens. Checked at 320, 390, 768 and 1440px with no horizontal document overflow; desktop screenshot inspected. Source review of other public action groups (hero, reviews, live-map controls, booking management/cancellation) and admin action toolbars found existing gap-based layouts; no blanket button margins added. Lint, typecheck and production build passed. Existing section-spacing changes retained. No deployment or data mutation performed.

Public spacing fixes published - 29 September 2026: commit cc58684fe66320e6ae5b311ab4fe1659063e9243 is ready in Netlify deployment 6abbce3e6567730007cf6c9e. Live Explore verified four 16px button gaps; live homepage departures verified 112px desktop top inset. Isolated release lint/typecheck/build passed. Unrelated email/SQL work excluded.

## 30 September 2026 - Route & Live Map local implementation
Canonical /route, /live redirect, merged navigation, compact map-first page, interactive operational stop timeline, CMS stop-linked previews, dynamic departures and existing booking entry implemented. Independent-map presentation bridge extension prepared in sibling Map App; no GPS/ETA algorithm, schema or production data changes. Source ownership and release dependency: docs/LIVE_MAP_EMBED.md.
Verification: full test chain 282 passed; subsequent final component suite 7 passed with added unified visibility test; final lint/typecheck/build passed. Chrome eight-width layout and navigation/redirect/stop-preview/booking-entry checks passed. Hosted map does not yet include the bridge, so live timeline end-to-end and real-vehicle/device acceptance remain pending. Local code only, not deployed; no claim of completed full acceptance.

Route deployment authorized and published - 30 September 2026: isolated website release d26edcd1d030171e97d9c413134acacdff8aee2f, Netlify 6abcd3fa2482eb0008ae2d46; independent map bridge 6abcd3e720e6d27aa477e744. Map manifest preserves all 106 baseline files with only the presentation bridge script changed. Closed-loop stop-ID deduplication and production parent origin corrected during release verification and covered by bridge tests. Unrelated email work excluded; no DB writes or migrations. See LIVE_MAP_EMBED.md.

Route divider spacing correction - 30 September 2026: shared public section reset overrode the new route section padding. Scoped the section selector beneath the route page so the intended 28px desktop/tablet and 24px mobile padding wins. Chrome checked 320, 390, 768 and 1440px: divider clearance is 24/28px to the following label and 24/28px plus the 1px border below the cards, with no horizontal overflow. Desktop screenshot inspected; diff whitespace check passed. CSS only; local, not deployed.

Route divider spacing published - 30 September 2026: commit 396ae6d7a478f0dd16c4be5108a56b4459eb48d8, Netlify ready deployment 6abcd96695100d0008add7f1. Isolated production build passed. Live /route measured 24px mobile and 28px desktop clearance on both sides of the divider (plus its 1px border below cards), with no overflow at 390/1440px. Only the two scoped CSS selectors were deployed; unrelated changes preserved.

## Global footer redesign - 30 September 2026

Local implementation PASS: one shared public Footer, original logo/dark background, configurable social icons, Staff Login, business/VAT/year, and Admin-managed legal pages. Existing Google Reviews source reused with one Footer editor. New additive validation migration prepared, not applied hosted. All 288 tests pass; lint/TypeScript/production build pass. Nine requested footer viewport widths fit without overflow; desktop/mobile visual and keyboard checks passed. Authenticated local editor inspected read-only. No deployment or hosted writes. Details and release prerequisite: GLOBAL-FOOTER-REPORT.md.

Global footer published - 30 September 2026: commit84228d35a19b26eb9efa89f141c63496457df3f9 is ready in Netlify deployment6abcee4e5bfd9b000848dced. Isolated release lint/type/build PASS. Footer validator migration applied to hosted project; existing draft/published validation and new-field validation PASS without content writes. Seven public routes HTTP200 with one shared footer; live mobile390px inspection PASS. See GLOBAL-FOOTER-REPORT.md publication appendix. Unrelated email/SQL work excluded.

## Public platform architecture audit - 30 September 2026

Completed source discovery across 32 page/API route patterns plus robots/sitemap, all 160 Website fields, public sections and cross-system readers. Report: PUBLIC-PLATFORM-AUDIT.md; machine inventory and CMS matrix linked there. Read-only hosted SEO scan checked 15 URLs (14 HTTP 200, one /live 308). Principal CMS/booking/independent-map ownership boundaries remain intact; partial navigation controls, incomplete metadata, map binding drift risk, destination outage handling and performance issues remain recorded, not certified resolved.

Safe local improvements: hid inactive hero amenities/mobile navigation controls while preserving schema/data; changed sitemap eligibility to current published destinations instead of historical guides. Full existing test chain 288 passed; separately added editor compatibility test passed. Final lint/typecheck/production build passed. No deployment, production write, migration, email enablement or booking/map-engine changes. Unrelated working-tree changes preserved. Live scan predates local fixes; no new browser/device acceptance claimed.

## Public platform Phase 1 continuation - 30 September 2026

Implemented bounded ownership corrections after recording the plan: shared independent-map binding with mismatched project rejection; CMS custom route navigation labels respected with duplicate-link guidance; neutral public route error/retry boundary; all-eight-section visibility regression coverage. Browser audit found and fixed footer logo same-page top navigation. No business/booking/GPS rule or schema change.

Report: PUBLIC-PLATFORM-PHASE-1.md (20 audit sections, homepage matrix, ownership diagram, risk/rollback and next-phase plan). Full regression chain 292 passed; final footer component rerun 10 passed; lint/typecheck passed; isolated production build passed with matching application files. Normal build encountered Windows EBUSY in active .next output. Browser checks: 11 public pages at all nine requested widths, no overflow; authenticated local CMS at all nine widths with eight visibility switches, navigation guidance verified read-only; footer top-navigation and mobile Escape/focus passed. No production writes, deployment, migration or email enablement. Physical devices, complete mutation/assistive-technology acceptance and later architectural improvements remain explicitly open.

## Final audit registers and review-reader consolidation - 30 September 2026

Completed the remaining brief's ownership, CMS connection, hardcoded-content, duplication and orphan registers in PUBLIC-PLATFORM-REGISTERS.md. PUBLIC-CONTENT-COVERAGE.json calculates 30/36 defined current editable public-content groups fully connected (83.33%); this is not an all-fields/whole-platform percentage. Exact classification vocabulary and exclusions are documented in PUBLIC-CMS-CONNECTION-MATRIX.md. Final audit status PARTIAL: source trace/contract evidence does not establish all hosted propagation, security, physical-device or accessibility acceptance.

Safe low-risk change: Footer and WebsitePanel read existing review_settings directly; request-scoped shared settings context reused by actual review sections. No duplicated URL/source, persistent cache or schema introduced. 104 integration tests passed; lint/typecheck and isolated production build passed; Home/Tour/Credits local HTTP footer/review sanity passed. Prior 292 full-chain result predates this reader change; no fabricated combined total. No deployment, hosted mutation, migration or email enablement. Unrelated changes preserved.

## Public booking date interaction - 30 September 2026

Local change only: BookingDateSelector now requests the existing native showPicker() on input click, retaining native icon/keyboard behavior when unavailable or restricted. Existing change/input/blur handlers and all booking rules remain unchanged. Shared consumers are the modal, /book and customer modification; unrelated Admin controls unchanged.

Root causes: browser-native date segments did not open the picker from the full field without an explicit click handler. The red rectangle was .date:focus-within on the enclosing label; the teal rectangle was the public-site input:focus-visible outline (brand-focus). Neither was a validation error. Removed date-wrapper focus outline; scoped the input focus-visible outline to 2px, zero offset, following the existing 10px radius. Added pointer cursor; existing 48px minimum height retained. No global outline reset or new validation/state.

Verification: desktop left/center/right/icon clicks all invoked native showPicker successfully; Chrome 390px touch emulation center/icon both invoked it successfully. Native popup visuals were not captured by browser automation, so full picker visual/device acceptance remains pending. Modal screenshot shows one rounded focus treatment; measured input 358 x 50.39px, wrapper outline none. Tab reaches native date input, ArrowUp edits the day segment, accessible name/type preserved. Selected 1 October 2026 loaded four departures and EUR10 adult price; selected departure updated summary; Continue to Details succeeded. Temporary one-seat hold was released through Edit date/passengers/departure, returning to No seats are held. Clearing the date disabled Continue. No booking confirmed or contact details submitted. Physical iOS/Android and screen-reader acceptance remain unverified.

TypeScript, lint, 10 existing component tests, isolated production build and scoped diff whitespace check passed. Build log: private/booking-date-build.log. Files for this task: src/components/public/booking-controls.tsx, src/components/public/booking-controls.module.css, docs/PHASE_STATUS.md. No deployment.

Booking date fix published - 30 September 2026: commit 04396a8adcb16d716332566b94b45fa7cb1a0825, ready Netlify deployment 6abd0f1d6d6a780008ca8534. Release contains only booking-controls.tsx and booking-controls.module.css. Exact isolated production build passed after installing dependencies locally (the initial shared node_modules junction was rejected by Turbopack). Live /book loaded successfully; browser verified pointer cursor, one 2px teal focus outline at zero offset with 10px radius, and no label-wrapper outline. Earlier unrelated audit/email/SQL work remains local. No schema or content changes in this deployment. Physical-device/native-popup visual acceptance remains pending.

Hero image samples corrected - 30 September 2026: Admin hero image fields now use representative desktop 1440:900 and mobile 390:844 crop frames instead of identical 150px strips. Mobile sample reproduces the public portrait 1.2 bottom-anchored zoom; both samples use current unsaved focal positions. Helper text distinguishes representative crop from exact device layout and directs full-page checks to Draft Preview. Existing images/uploads/content/public rendering unchanged. TypeScript and lint passed; authenticated browser measured correct ratios at desktop and 390px Admin widths, verified focal position updates and restored the original selection without saving. Desktop visual inspected. Files: website-editor.tsx, website-editor.module.css, this status. Local only; no deployment or content writes.

## Compact Website Content section cards - 30 September 2026

Audit: WebsiteWorkspace rendered all section details/summary cards from websiteEditorGroups (website-schema.ts). Homepage order remains hero, intro, route, live, departures, reviews, notebook, final. Existing homepageVisible/visibilityScope, unsaved guards, selection, form IDs, save/discard and feedback remain workspace-owned and unchanged. Existing Homepage/Public pages/Global/Destinations grouping retained; dedicated destination editor unchanged.

Shared presentation: SectionCardHeader in website-section-card.tsx uses ID-keyed metadata for icons, functional descriptions and secondary scope. Reuses AmenityIcon camera/ticket/pin/van/clock/map; five lightweight matching inline SVG paths provide star/book/footer/document/search without a package or amenity-schema change. Homepage icon mapping: hero camera; intro ticket; route pin; live van; departures clock; reviews star; notebook book; final ticket. Public pages: tour/book ticket, explore pin, day clock, how map. Global: navigation map, footer bottom panel, SEO search, legal document. Descriptions explicitly describe editable headings/labels/introduction rather than implying ownership of operational timetable, reviews or destination records.

Visibility is inline on wide cards, with green/neutral switch, Visible/Hidden text and retained scope. Narrow cards wrap the same header; no visibility separator/footer. Semantic Edit/Close buttons have section-specific accessible names, aria-expanded, 44px targets and focus outlines. Decorative SVGs are aria-hidden; title/description do not depend on icons. Existing draft/status messages remain visible.

Browser evidence: 1440px homepage collapsed heights changed from 161px to 90px (all eight). At 768/1024/1920px also 90px; constrained 1280px two-column layout 120px; 375-430px 119-156px depending on wrapping. All eight requested widths (375,390,430,768,1024,1280,1440,1920) checked across Homepage, Public pages and Global: no document overflow; homepage title/Edit rectangles do not collide, Edit targets 64x44. Desktop/mobile screenshots inspected. Enter opens Hero editor with visible focus; Close, temporary visibility toggle and Discard passed, original state restored without Save or Publish. Full assistive-technology/physical-device acceptance not claimed.

TypeScript, final lint, isolated production build and scoped whitespace check passed (private/section-cards-build.log). Files for this task: src/app/admin/website-section-card.tsx (new), website-workspace.tsx, website-editor.module.css, docs/PHASE_STATUS.md. Prior local hero-preview changes preserved. FINAL STATUS: PASS for requested local UI scope. No deployment, content write, schema or booking/map-engine change.

CMS cards and hero previews published - 30 September 2026: release 3455380f67084d4078e2f2f0f9ded284aa0d45da (includes 4052ccb), ready Netlify deployment 6abd143134da33000800a310. Exact isolated production build PASS (private/cms-cards-release-build.log). Authenticated live Admin verified eight active homepage cards at 90px, retained amenities card at 111px with explicit inactive scope, section-specific Edit buttons and hero sample ratios 1440:900 / 390:844. Four Admin implementation files released; earlier audit/email/SQL changes excluded. No content saves, schema changes or email enablement.


## 1 October 2026 - Performance and Tour/FAQ continuation

Implemented locally: /tour Reviews and FAQ sections/anchors and unused review read removed; dedicated /faq reuses existing content and product inclusions with standard header/footer, navigation, metadata, sitemap and saved draft preview. New FAQ link-validator migration is prepared and tested only in disposable databases; not applied hosted. See TOUR-FAQ-CLEANUP.md.

Measured hosted and local production baselines, optimized supported Supabase Media derivatives, parallelized independent public reads, and removed Explore's unused homepage/availability quote. Final direct Explore trace contains only CMS/destinations and shared review settings reads. PERFORMANCE-AUDIT.md and PERFORMANCE-MEASUREMENTS.csv contain paired lab results, scope and limitations. Booking restoration layout shift, field INP, deployed tracing and full iframe profiling remain open.

Full regression chain passed 295/295 before the final Explore loader simplification. Final follow-up passed 11 component tests, typecheck, lint and production build. Tour/FAQ passed seven-width browser layout checks and accordion/navigation checks. No hosted CMS write, commit or deployment performed. Unrelated email/audit/SQL work preserved.


Published and verified - 1 October 2026: commit 977a60ab51f2d852bbb56b77a805de7128b98cef, Netlify deployment 6abe0ad50102880008a1858b READY at https://sightseeingapp.netlify.app. Exact release build/lint and 11 component tests passed. Live /faq has four questions, working accordion, canonical /faq and no promotional invitation. Live /tour has neither Reviews nor FAQ and retains its footer. Four loaded Explore images use /_next/image derivatives; no captured console errors. FAQ validator update verified on the hosted project through guarded allowlist replacement (faq_route_allowed=true, footer_preserved=true), with no content-row writes. Earlier unrelated audit/email/SQL edits remain local. This live smoke check does not certify field performance or physical-device acceptance.

## 5 October 2026 - Admin notification center and Web Push

User-requested audit and local implementation completed. Existing committed booking
events feed a separate bounded notification projector, personal inbox receipts and
per-device push queue. Added permission-filtered Admin center/bell, read actions,
filters/pagination, preferences/device controls, receipt Realtime subscription,
admin-scoped push-only service worker, manifest, VAPID sender and Netlify scheduler.
Existing Resend and booking mutations remain unchanged by this feature. Migration
`20261005000100_admin_notifications.sql` is local only; no hosted enablement.

Final npm test chain **311/311 PASS** (components 11, identity 17, integrations 111,
database 148, real PostgreSQL 24). Typecheck, full lint and isolated normal
production build PASS. Combined local booking-to-two-device dispatch test uses a
mock push provider; real claim/projection/completion SQL and concurrency pass.
Actual UI fixture interactions and eight widths 320–1920px pass; API unauthorized
and cross-origin requests are denied. Live Supabase Realtime, provider delivery
and physical mobile acceptance remain PENDING. No production readiness claim.

Dependency audit reports existing Next.js critical and ESLint-tree high findings;
framework patch/security review remains a release prerequisite. See
[Admin notification report](ADMIN-NOTIFICATIONS-REPORT.md) for scope, exact status,
owner configuration and outstanding acceptance. No hosted database write,
permission request, real push/email, commit or deployment performed. Unrelated
pre-existing changes were preserved.

## 5 October 2026 � WhatsApp contact and shared site icons

Implemented WhatsApp in Website Content ? Global: contact, navigation & footer, reusing the existing operator-scoped website draft/publish source and authorization. Added phone validation, configurable message/label/device visibility, public-only floating contact link with map/booking/dialog clearance, and validator migration 20261005000200. Defaults disabled with no business number. Supplied SVG now generates shared public/admin favicon, Apple touch, manifest and notification icons.

Verification: 317/317 full-chain tests, typecheck, lint and isolated production build pass. Eight browser viewport widths, configuration visibility, encoding, actual booking dialog and map clearance checked locally. Physical device and hosted save/publish acceptance remain pending. No production writes, commit or deployment. Details and exact PASS matrix: [WhatsApp and site icons report](WHATSAPP-CONTACT-AND-SITE-ICONS.md).


## 5 October 2026 - Vercel deployment audit

Authenticated host inspection confirms Vercel has no Project environment variables and no linked Shared variables. Current production commit 977a60a returns an empty homepage main because missing CMS bindings invoke the unavailable-content visibility fallback. Same symptom reproduced in a clean local production build; configured CMS renders the saved content. No hosted data was changed.

Local fixes: sanitized publication diagnostics, explicit unavailable homepage state, Production build configuration preflight, and image preparation capped at 4 MiB upload copies for the Vercel function limit while retaining original-file rules. Review-photo uploads reuse the preparation helper. Added publication/configuration tests and extended image tests. No migration or dependency version change.

Final gates: npm ci, production build/start, typecheck, lint and 322/322 full-chain tests PASS. Configured local desktop and 390px mobile CMS rendering pass. Hosted homepage/CMS/booking/Admin remain FAIL due missing configuration; independent Live Map integration PASS. Background scheduler choice, newer local features, real delivery, physical-device acceptance and existing dependency patch review remain outstanding. No commit/deployment, live booking/CMS mutation or sender activation. Details and owner steps: [Vercel deployment audit](VERCEL-DEPLOYMENT-AUDIT.md), [environment inventory](VERCEL-ENVIRONMENT-INVENTORY.md).


## 5 October 2026 ? Permanent Vercel migration, Hobby decision

Vercel recorded as permanent main-app host in AGENTS/README/DEPLOYMENT and DECISIONS. Owner chose Hobby with background delivery disabled. Existing Next workers now stop before database/provider access on Vercel; Preview diagnostics are blocked and build preflight rejects production-like database binding or enabled communications/indexing. Legacy adapters retained pending parity; independent Netlify Live Map unchanged. No new cron, migration or booking-rule changes.

Clean install, lint, typecheck, production build/start passed. Full chain 324/324 passed; added network-denial guard test also passed in the three-test targeted file (325 distinct tests across runs). Local route/CMS/PWA smoke passed; unauthorized workers returned 401. Hosted Vercel environment remained unconfigured at last audit; actual hosted parity is outstanding. MIGRATION PARTIAL; NETLIFY SAFE TO DISABLE NO. See VERCEL-MIGRATION-REPORT.md and root DEPLOYMENT.md for inventory, environment assignments and owner dashboard steps. Nothing committed, deployed, sent or shut down.


## 5 October 2026 - Vercel cutover checkpoint

Owner confirmed existing local Supabase project as Production target. Vercel Project and Shared variables still absent at authenticated inspection. Private Production-only import prepared without displaying values, but filechooser failed before successful upload/save. Isolated Preview database remains owner-configuration blocker. Fresh lint/type/build and full 325/325 tests pass; read-only confirmed backend CMS/settings/product/Auth probes pass. No production mutation, commit, push, deployment, scheduler change or shutdown. VERCEL CUTOVER BLOCKED; see VERCEL-CUTOVER-REPORT.md.


## Production migration checkpoint - 5 October 2026
Applied and recorded only 20261005000100 and 20261005000200 transactionally. Notification schema/security and existing-data integrity pass. Cutover remains blocked: service-role CMS validation returns 42501 permission denied for schema private when calling the preserved WhatsApp validator helper. No unreviewed permissions fix, deployment, commit, push or delivery activation. See docs/VERCEL-CUTOVER-REPORT.md latest checkpoint.


## WhatsApp permission correction - 5 October 2026
20261005000300 applied and recorded: only private-schema USAGE for service_role. Exact application SDK validation now passes; 42501 resolved. Browser helper denial and existing RLS preserved, data/function/policy fingerprints unchanged. 16 targeted tests pass. DATABASE READY - RETURN TO VERCEL CUTOVER. No commit, push, deployment or delivery activation. See latest VERCEL-CUTOVER-REPORT checkpoint.


## 8 October 2026 — Approved local stage-A stabilization

Existing edits, maintenance branch/stash and private configuration preserved. Repository-local GitHub
Desktop GCM configured; GitHub remote read and push dry-run passed (no push). Clean npm ci in the clone
passed with the compatible local Next/eslint-config-next 16.3.8 patches. Production-only audit: zero findings;
five high dev-chain findings remain. Six hosted development entry points now reject production targets
before creating clients and require explicit isolated-project/mutation opt-in. Removed hardcoded production
owner workspace binding. Added DEVELOPMENT.md, example opt-in placeholders and six guard regression tests.
Reconciled scheduler documentation with observed active Supabase Cron; historical disabled-delivery
decision preserved, no retroactive activation approval inferred. Corrected stale admin explanatory text.

Credential-free disposable verification: npm ci and npm run check passed; npm test 372/372 passed
(31 component, 17 identity, 135 integration, 165 database, 24 PostgreSQL). After adding the last two entry-point
guards, focused six-test suite, syntax checks, final full lint and git diff --check passed. No migrations,
.env.local edits, cloud changes, communications, resources, commits, pushes or deployment. Published HEAD
remains 4a2e50d; patches are unpublished. Functional isolation, Auth redirect correction and fresh schema
reconciliation remain pending. No roadmap phase completion or full hosted parity claimed.


## 8 October 2026 — Stage-B Auth correction and resource constraint

Approved production Auth Site URL/activation redirect saved and verified after reload; all four prior entries retained. No recovery email or user mutation. Owner declined creating/duplicating databases; production project unchanged otherwise, no production Preview bindings. Proposal updated to current 44-migration baseline and stage-A guards; historical reconciliation marked stale where appropriate. Fresh disposable 44-migration catalog reference generated in /private/tmp before the no-creation decision; existing private snapshots untouched. Full current hosted catalog comparison still pending. No source/dependency changes, deployment, push or migrations in this step.


## 8 October 2026 - Readiness release preparation (unpublished)

User authorized local safety/documentation review and CI/reconciliation/acceptance proposals only. Fresh 44-migration evidence supersedes historical email-function drift: final structure matches; seven missing history entries and eleven trigger grants need separate decisions. Published source remains 18c48d0; same-source approved credential rotation already completed. New CI draft, review packet and bounded acceptance/reconciliation procedures are local only. No commit, push, deployment, cloud configuration, migration or production data change in this preparation. Original historical entries and mixed-encoding bytes preserved.
