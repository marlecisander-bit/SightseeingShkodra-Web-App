# Mobile-first Admin redesign

5 October 2026. Implementation published to Vercel; local and hosted read-only acceptance are documented below. Physical-device acceptance remains unverified.

## Audit and implementation

Reviewed the existing Admin/auth route inventory from ADMIN-SIMPLIFICATION-REPORT.md and the actual shell, section panels, forms, image editors, calendar, notifications, authentication styles, manifest and service worker. No operational Admin tables or application modal dialogs needed conversion: records already used disclosures/cards. The principal mobile defects were an in-flow expanding navigation, crowded header, two-column list of oversized calendar days, long CMS context/list surroundings and insufficient booking summaries.

- Compact branded mobile/tablet header: existing logo, Admin label, notification bell and menu. Account, website and sign-out controls live in the drawer. Desktop retains its sidebar and workspace.
- Native modal drawer: focus containment, inert background, Escape, close button, body scroll restoration, route-change closure, active links and desktop-resize closure. Navigation uses existing permission-filtered routes; no invented account or WhatsApp route.
- Overview: Today shortcuts use the existing date-filtered bookings/calendar routes, followed by compact quick actions and an Open Live Map action. No invented booking/guest/seat totals or activity feed. The notification inbox remains the existing activity source.
- Bookings: card summaries show reference, customer, actual departure/date, guests, total and status. Details group tour/guests and contact; existing payment, QR, email and cancellation controls remain. Telephone/email links use existing contact fields. No new modification endpoint or business rule.
- Calendar: seven-column month picker instead of a long mobile tile list; 52px-high days on phones, detailed days at larger widths. Selecting a day puts departure cards first; day/range settings are disclosed separately. Existing prices, capacity, exceptions, confirmations and save handler are retained. Inspect bookings preserves the chosen date.
- Website: phone section navigator opens one focused editor with Back, saved-draft preview, retained unsaved guard and sticky Save Draft/Publish/Discard actions. Other section cards and desktop context hide during phone editing. Tablet Save actions also remain sticky. Same forms, field names and publication semantics.
- Images: existing file chooser accepts the supported formats without forcing a camera. Lazy previews avoid eagerly requesting every collapsed editor image. Native phone photo-library/camera availability is browser-dependent; no new media/storage service. Source-sized previews still merit a separate measured optimization.
- Products, suppliers, reviews, WhatsApp and email retain their existing card/disclosure structures, single-column touch forms and simplified owner language. No provider/UUID/storage diagnostics reintroduced into normal editing.
- Notification popup fits mobile/tablet safe areas; existing inbox, links, preferences and Realtime architecture remain. No polling or dispatch introduced.
- Connection-loss notice added without offline editing or optimistic save claims. Login keeps existing authentication with a shorter phone presentation and comfortable controls.

Brand palette, logo, typography, button family and public website appearance are unchanged. No schema, RLS, capacity, pricing, service-date, infant-seat, cutoff, QR, payment, email/push worker or Live Map engine change. The previous uncommitted owner-language simplification is included as the foundation of this release.

## Verification

| Gate | Result |
|---|---|
| Admin mobile-first architecture | PASS for local implementation and emulated browser |
| Header / mobile drawer | PASS |
| Overview | PASS; reliable shortcuts, no fabricated metrics |
| Bookings / booking detail | PASS with synthetic records |
| Calendar & Pricing | PASS with synthetic schedule |
| Products & Suppliers | PASS |
| Website Content | PASS |
| Image management | PASS for chooser, pending state and denied-upload recovery |
| Guest Reviews | PASS |
| Notifications | PASS for presentation and booking navigation |
| Email & Notifications | PASS for presentation; delivery remains deferred |
| WhatsApp | PASS for focused form and telephone input |
| Live Service | PASS for existing map destination; tracking unchanged |
| Login | PASS layout; existing authentication tests pass |
| PWA / Home Screen | PASS configuration; physical installation remains unverified |
| Auth persistence | Existing cookie/session/history guards retained and tests pass; physical installed-app persistence unverified |
| Horizontal overflow | None in checked cases |
| Touch targets | Drawer actions 44-48px high; calendar days 52px high; primary fields/actions at least 44px high |
| Safe areas | Insets implemented; physical notch/keyboard acceptance unverified |
| Mobile forms / calendar | PASS in tested layouts and workflows |
| Lint / TypeScript | PASS |
| Complete tests | PASS: 332, zero failed/skipped |
| Final component rerun | PASS: 16 |
| Production build | PASS: isolated exact-source copy, 31 pages |

Every width passed: **320, 360, 375, 390, 414, 430, 768, 820, 1280, 1440, 1920px**. Eight section fixtures plus five workspace/auth surfaces give 143 screen/width cases. Additional expanded hero and calendar checks passed at all eleven widths, plus eight 844x390 landscape cases. Drawer scrolling at 390px landscape height retains access to all account/navigation actions.

390px workflows exercised: drawer -> each of eight routes with correct active state and closure; booking expand/collapse; notification -> associated booking URL; selected calendar day -> departure; hero edit -> denied save -> retained value -> Discard -> return; local image chooser -> pending controls -> denied upload -> original image retained; WhatsApp editing/discard. Phone Save Draft measured within the viewport at y=790 with a 44px height in an 844px viewport.

Browser work used the ignored synthetic preview, with no Production credentials and denied-write action stubs. This does not establish successful hosted image/save/publish persistence, a fresh real login/logout cycle, all role permutations, physical Safari/Android, installed Home Screen session persistence, or screen-reader certification. Existing automated identity/data contracts provide complementary regression evidence. Production booking pages were not opened for testing because their existing server render can materialize schedule inventory.

PWA source audit: existing `/admin/manifest.webmanifest`, start `/admin`, standalone display, shared transparent sun icons, cream background and brand-red theme retained. Admin viewport adds viewport-fit=cover. Existing admin-scoped service worker has no fetch/offline booking cache; origin cookie handling, proxy session refresh and bfcache verification remain unchanged. Delivery remains disabled.

Logs (ignored): private/admin-mobile-tests.log, admin-mobile-components-final.log, admin-mobile-lint-final.log, admin-mobile-types-final.log, admin-mobile-build-final.log.

## Published release

Commit `42652e9aab2521ecc4c9674493c093d7ba6e575e` pushed to main. Vercel deployment `6J2fg2xamuZr5ewfu3zGHxaYzpJm` is Ready / Production / Current on sightseeingshkodra.app; authenticated dashboard and GitHub Vercel status both verified.

Live 390px read-only smoke passed: owner Overview, mobile drawer -> Website Content, focused Hero editor with Save Draft at viewport bottom (44px high), calendar month/selected day with four actual departures and configured prices, catalog, reviews, notifications and email. No horizontal overflow or application-error page observed on those surfaces. Owner session persisted after production calendar reload. This establishes normal Chrome session persistence across the release, not physical installed-PWA persistence. Existing saved CMS drafts were observed and left unchanged. No Save, Publish, upload, booking mutation, email/push action, environment or database modification performed during hosted acceptance. Production Bookings was not opened; synthetic booking presentation/navigation and automated contracts are the supporting evidence.

Unrelated documentation, owner SQL, private files and legacy configuration were excluded from the release. This publication checkpoint is recorded locally after the implementation commit.

## Additional mobile workflow requirements (46–99) — 5 October 2026

Targeted follow-up to the published mobile Admin, preserving its existing architecture and data owners.

- Expired sessions retain all eight existing Admin sections and valid booking/date context. The return URL remains strictly allowlisted; external URLs, unknown parameters, duplicate keys and invalid dates/IDs are rejected.
- Focused CMS, booking cards and selected calendar days use same-page browser history. Browser Back closes the focused editor. CMS Back retains unsaved values and requires Save or Discard. URL fragments describe presentation state only; they do not invoke server actions or add routes.
- Closed departures remain visible in the date editor and can be reopened with the existing calendar save handler. Reopening one time on a closed day keeps other times closed. Prices, capacities, SQL rules and historical booking snapshots remain unchanged. Calendar phone cells retain Offer and Full indicators; numeric price inputs request a decimal keyboard.
- Cancellation is in its own disclosure with the existing reason and confirmation. Inactive notification filters are neutral. Today spacing and CMS Edit/Close hover contrast corrected.
- Closed CMS cards no longer mount every editor: only the selected/dirty editor and the existing default publication form are mounted as needed. Existing save/publish ownership and image upload path remain unchanged.

### Acceptance checklist

PASS below means inspected source, automated contracts and/or desktop Chrome viewport evidence in this report. It does not certify physical Safari/Android or successful hosted write operations.

| Check | Result | Evidence / scope |
|---|---|---|
| Mobile table/card transformation | PASS | Booking list/details and departure cards inspected at 390px and desktop. |
| Sticky Save/Publish actions | PASS | Existing CMS sticky actions retained and visually inspected; physical keyboard acceptance remains below. |
| Mobile modals/sheets | PASS | Existing native Admin drawer retained; preceding focus/Escape/layer checks apply. |
| Search & filters | PASS | Existing date/exact-email booking filters preserved; notification filter layout inspected. No new broad query. |
| Notification bell | PASS | Existing provider, unread state and booking links retained; no new polling. |
| Admin navigation state | PASS | Section navigation and focused-panel Back tested with safe fixtures. CMS unsaved Back/Discard recovery passed. |
| Desktop Admin preserved | PASS | Eight representative screenshots inspected at 1440px. |
| Tablet Admin | PASS | Five critical routes and expanded calendar checked at 768px without overflow. |
| Non-technical owner language | PASS | Prior simplification retained; additional unsaved-visibility wording now appears only for visibility edits. |
| Technical clutter removed | PASS | Existing technical disclosures retained outside primary workflows. |
| Original brand identity preserved | PASS | Existing logo, colours, type and components retained. |
| No new design system | PASS | Existing styles; small shared browser-history hook and booking disclosure component only. |
| Booking business logic unchanged | PASS | Server actions, transactional capacity, payment and booking rules unchanged. |
| Pricing logic unchanged | PASS | Existing cents, quotes and save contracts retained; focused tests cover reopening payload preservation. |
| Supabase/RLS unchanged | PASS | No migration, query, policy or database modification. |
| Public website unchanged | PASS | No public presentation files changed. |
| Live Map logic unchanged | PASS | No map engine or embed changes. |
| Lint | PASS | private/admin-followup-lint.log |
| TypeScript | PASS | private/admin-followup-types.log |
| Tests | PASS | Complete chain: 335 passed, zero failed/skipped (18 components, 17 identity, 120 integrations, 156 database, 24 PostgreSQL concurrency). |
| Production build | PASS | Isolated current-source production build, 31 pages; private/admin-followup-build.log. |

Representative screenshots inspected at 390px and 1440px: Overview, Bookings, booking detail, Calendar & Pricing, Website Content list, section editor, Notifications and WhatsApp. Screenshot inspection found and resolved the Today spacing and Edit/Close contrast defects. Critical routes additionally checked at 390/768/1440px: no document overflow or application error page. Fixture calendar includes a closed departure; reopening its checkbox changed the local summary correctly without a production save. New tests verify only the intended departure reopens and retain other price/capacity overrides. Local console contained browser-extension message-channel errors, not an identified application stack or hydration error.

### Remaining acceptance limitations

- Physical iOS Safari/Android keyboard overlap, installed-PWA safe areas, installation and installed-session persistence are NOT VERIFIED. Chrome viewport checks cannot establish those results.
- Successful production Save/Publish/upload/booking/payment/review mutations were intentionally not performed. Existing backend regression tests and safe fixture interaction checks provide supporting evidence, not a new end-to-end live write certification.
- Overview remains real Today links and permission-filtered shortcuts; a live occupancy/attention/recent-activity dashboard was not invented or queried.
- Calendar date links select the relevant month; the Today button opens today's editor when its date is in the displayed month. Automatic editor opening from a date URL is not implemented.

No full physical-device acceptance claim. Release and hosted checks are recorded separately after publication.
