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

### Follow-up deployment and hosted acceptance

Published commit `0c3a95208b8c7d95fc9b31a1469ef4fab7d7f313` through main. Authenticated Vercel deployment `BWoiDaVoH78MxZyYWcQdKk7k5id2` is Ready / Production with sightseeingshkodra.app assigned, and the dashboard identifies this exact commit.

On the deployed release, authenticated Overview, Website Content, Calendar & Pricing and Notifications passed at 390/768/1440px (12 route/viewport combinations): no horizontal document overflow or application error page. Published CMS Hero opened with the new panel URL fragment and browser Back returned to the section list. Captured hosted warning/error log was empty. Existing owner session remained usable. Viewport override reset; owner Overview left available.

Hosted Bookings was deliberately not loaded because its existing render can materialize inventory; its follow-up acceptance used the synthetic fixture and complete regression suite. No production Save/Publish, upload, booking/payment/review mutation, database/configuration change, email or push dispatch occurred. Physical-device limitations above remain open. Follow-up local booking browser Back and closed-departure reopening checks passed.

## Final owner-workflow continuation (100–153) — 5 October 2026

Implementation: compact logo/bell/menu header without the extra Admin label; sticky drawer Close row; tighter booking-card spacing; 16px mobile form text; calendar save refresh retains the selected date instead of closing/remounting the editor. Updated server settings replace the selected day's editable values when the schedule stamp changes. No handler, booking rule, schema, RLS, public component or delivery configuration changed.

Components created: none. Components modified: AdminShell, CalendarPanel, OperationsCalendar; shared Admin CSS. Routes created/modified: none; existing Admin routes consume these components.

Fresh verification: lint PASS; TypeScript PASS; complete npm test chain 335 PASS, zero failed/skipped (18 component, 17 identity, 120 integration, 156 database, 24 PostgreSQL concurrency); isolated production build PASS. Logs are private/admin-final-{lint,types,tests,build}.log. Source copies used for the build are checked before release.

Chrome fixture matrix: eight Admin sections at 320x568, 360x800, 375x667, 390x844, 414x896, 430x932, 844x390 landscape, 768x1024, 820x1180, 1280x720, 1440x900 and 1920x1080. All 96 document-overflow checks passed. Mobile menu visibility follows the desktop breakpoint; one transient measurement during navigation was rechecked at 320px and passed. The initial browser viewport capability did not resize this CDP-attached tab; those measurements were discarded and the matrix rerun with actual innerWidth verified.

390px workflow evidence: Overview to Today bookings; booking expand/Back; drawer to calendar; selected date and departure; denied price save retained entered value; a separate private success stub returned the saved confirmation and retained the selected date/editor. This is UI response verification, not persistence. CMS Hero editing, Discard and section Back passed; sticky Save measured 44px and mobile input text 16px. Notifications, paused delivery states and Global WhatsApp editor inspected. Drawer remained modal with background scroll locked; after scrolling navigation, Close remained at top 12px with a 44px target and Sign out was reachable. No production test content was saved.

Real production authentication: Sign out reached Staff Login; protected Website Content redirected with a safe return path; owner manually signed in and returned to Website Content. Login/logout/deep-link return PASS. Normal session remained valid; forced expiry and physical installed-session behavior remain unverified.

### Acceptance status and limits

PASS refers to the inspected UI and existing regression contracts, not successful new production writes. FAIL below means the requested complete acceptance has not been established, not necessarily a demonstrated defect.

| Check | Result | Scope |
|---|---|---|
| Mobile-first Admin, complete acceptance | FAIL | Physical keyboard/safe-area and complete successful browser write workflows remain unverified. |
| Global shell / mobile header / bell / drawer / active navigation / Back | PASS | Rendered fixture and earlier hosted checks; current release hosted check follows. |
| Safe areas | FAIL | Standard CSS insets retained; physical notched-device/PWA evidence unavailable. |
| Touch targets | PASS | Main controls measured; not an exhaustive physical-device certification. |
| Overview | PASS | Existing Today links and shortcuts; no invented live metrics. |
| Bookings list / search-filter / detail | PASS | Synthetic layout and existing filtering contracts; production Bookings avoided because rendering can materialize inventory. |
| Booking modify | FAIL | No existing Admin modification editor; customer self-service is separate and was not retested in this walkthrough. |
| Booking cancel | FAIL | Confirmation UI and automated rules pass; successful browser cancellation not performed. |
| Calendar / departure management / pricing management | PASS | UI, denied-save recovery, simulated successful response and backend contracts; no new hosted write claim. |
| Products / suppliers / guest reviews | PASS | Existing editors and responsive rendering preserved; successful hosted mutation not retested. |
| Website content / section editor | PASS | Edit, discard, Back and sticky action controls inspected. |
| Image management / draft save / publish | FAIL | Controls/contracts retained; successful upload/save/publish browser acceptance not completed in this continuation. |
| Draft preview | PASS | Existing authenticated preview link retained; previous acceptance evidence applies. |
| Notifications / email / WhatsApp | PASS | Existing UI and disabled delivery states; no delivery enabled. |
| Live service | PENDING | Current hosted walkthrough follows release. |
| Login / logout / deep-link return | PASS | Actual owner cycle this turn. |
| Auth session, including forced expiry | FAIL | Normal session passes; forced-expiry browser scenario not performed. |

Each requested width and landscape: PASS for the 96 fixture layout checks. No horizontal document overflow: PASS. Physical keyboard overlap, installed PWA and exhaustive control clipping: NOT VERIFIED. These limits prevent a blanket completion claim.

### Final continuation deployment and hosted acceptance

Published commit `27c6846c2b20e0b172ad763b9e4767f57a2b43a0` through main. Authenticated Vercel deployment `4QGFdQNTgfoMxMmLwU8LP6iFpA5D` reached Ready / Production, and sightseeingshkodra.app served the updated header without the former Admin text.

On this release, seven read-only Admin sections (Overview, Website Content, Calendar & Pricing, Products & Suppliers, Guest Reviews, Notifications, Email) passed all 12 requested viewport sizes: 84 combinations, actual viewport width verified, no horizontal document overflow or application-error page. Calendar selected-date presentation was included. One browser tab's CDP access became unavailable during a document response; the remaining checks continued in another authenticated tab and completed. Production Bookings remained excluded; its 12-size fixture checks and backend contracts are the evidence.

Live CMS Hero opened; Save Draft measured 44px high at bottom 834 of the 844px viewport and form text measured 16px. Section Back, Global WhatsApp editor, notification paused states, existing saved draft preview and Live Map iframe loading passed. The map displayed its existing stops/van controls; this verifies integration, not GPS/ETA accuracy. Returned from Live Map to Admin and completed Sign out, visibly reaching Staff Login. Captured hosted error/warning log was empty. Viewport overrides reset or limited to ephemeral test tabs. No hosted Save/Publish/upload/booking/payment/review or delivery action performed.

Live service: PASS. Draft preview: PASS (actual authenticated saved preview opened). Login/logout/deep-link return: PASS. Complete acceptance remains FAIL/incomplete for the limitations listed above; this release does not certify physical-device keyboard/safe areas, forced expiry, or successful browser mutation workflows. Post-deployment evidence is recorded locally after the release commit.

## Final quality acceptance (154–176) — 5 October 2026

This checkpoint supersedes the earlier blanket FAIL that included physical-device gaps. Code/responsive acceptance and physical-device acceptance are separate under the owner's final brief.

### Two demonstrated issues corrected

- WebsiteWorkspace keyed each section editor by the saved timestamp. A successful save refreshed the record and remounted the editor, immediately clearing its confirmation. Removed that remount key; existing parent stamp handling still loads authoritative saved values. In an isolated local fixture with a JSON-backed draft/published record, actual mobile form submission, draft-only state, publication, retained confirmations, clean state and unsaved Back/Discard recovery passed. The fixture uses the existing content validator; its storage/action adapter is synthetic. Existing database tests independently verify the actual save/publish RPC. No hosted CMS content was changed.
- Opening the deployed drawer produced seven speculative route Fetch requests, including Bookings. AdminShell links now use supported Next Link prefetch=false. Client navigation remains intact, but opening global navigation no longer requests unselected workspaces. This also avoids speculative schedule preparation through those menu links. Overview's existing shortcut prefetch behavior was not changed. No query, notification subscription or infrastructure was introduced.

Components modified this continuation: AdminShell and WebsiteWorkspace. Components/routes created: none. Removed obsolete editor remount behavior; no obsolete component or unrelated CSS was deleted. No duplicate mobile implementation added.

### Code and responsive matrix

PASS is scoped to source review, automated contracts, local browser interaction and non-destructive hosted UI evidence. It is not a claim of physical-device certification or new real customer transactions.

| Check | Result | Evidence / limit |
|---|---|---|
| No clipped content / overlapping controls / unreachable actions | PASS | Prior 96 fixture and 84 hosted viewport checks plus focused editor/drawer inspection; keyboard on physical phones remains pending. |
| No desktop-only workflows | PASS | Existing supported forms and disclosures fit mobile; no unsupported Admin booking-modification feature invented. |
| Mobile information hierarchy / card density / form usability | PASS | Focused sections, compact booking summaries, 16px inputs and retained feedback. |
| Mobile keyboard behavior | PENDING | Physical keyboard and Safari zoom cannot be certified by viewport emulation. |
| Calendar touch UX | PASS | Date/departure selection, readable summaries, saved-context preservation and backend contracts. |
| Image upload UX | PASS | Existing selector, preview, type/size validation and denied-upload recovery; successful hosted Storage upload not repeated. Phone picker acceptance pending. |
| Modals / bottom sheets / drawer layering | PASS | Existing modal drawer, Close/Escape, focus and scroll-lock checks. No extra sheet implementation. |
| Sticky action bars | PASS | Live 44px Save control at viewport bottom; physical keyboard caveat above. |
| Toasts / empty states / loading states / error states | PASS | Existing inline status/alert feedback, paused/empty notifications, loading boundaries and declined-save recovery; no redundant toast library. |
| Technical filenames / unnecessary UUIDs / unnecessary raw URLs hidden | PASS | Existing presentation inventory and components; support disclosures and meaningful business links retained. |
| Database / provider / environment terminology hidden from ordinary operations | PASS | Existing owner-language labels and support-only diagnostics retained. |
| Owner-facing errors humanized / business terminology consistent | PASS | Existing error mapping tests and surfaced save/upload feedback. |
| Desktop sidebar / content workspace / useful tables / CMS preview / calendar | PASS | Existing desktop layouts retained; previous 1280/1440/1920 checks and saved-preview browser acceptance apply. |
| Capacity / adult / child / infant seat logic unchanged | PASS | No booking-domain or SQL changes; full regression suite. |
| 15-minute cutoff / modification / cancellation / capacity restoration unchanged | PASS | Existing backend and concurrency tests; no transaction initiated in hosted acceptance. |
| Pricing / service date logic unchanged | PASS | Presentation changes only. |
| Supabase / RLS / authorization unchanged | PASS | No schema, policy, role or permission change. |
| Notification / WhatsApp / email / Live Map architecture unchanged | PASS | Existing providers, handlers and external map retained; delivery remains disabled. |
| Public header / mobile navigation / homepage | PASS | Existing page/menu render and navigation verified; no public source changed by Admin work. |
| Public booking | PASS | Booking dialog, guest/date controls and disabled Continue state inspected without booking submission; existing backend suite verifies rules. |
| Public Route & Live Map | PASS | Actual retained iframe and stops loaded in preceding same-release walkthrough. |
| Public visual design unchanged | PASS | Git comparison since pre-Admin release shows no public component/CSS/asset changes. |
| Mobile Admin performance | PASS, limited | No document reload or new WebSocket during inspected navigation; redundant menu prefetch addressed. Existing source-sized CMS images remain an optimization opportunity; not a complete network/CPU profile. |

Non-blocking public observation: at 390px the public header still displays its booking CTA in addition to the menu CTA. This predates the Admin changes (public files unchanged), and no overlap was observed. The earlier public-header brief intended this CTA to be hidden. Recorded separately; not silently changed in this Admin scope.

### PWA / Home Screen

| Check | Result | Scope |
|---|---|---|
| Admin manifest | PASS | Hosted /admin/manifest.webmanifest matches repository; separate id/scope retained. |
| Admin icon | PASS | Hosted 192/512 PNG and Apple icon match existing shared sun assets; no new brand mark. |
| Start URL | PASS | /admin; direct protected URL returns through Staff Login. |
| Standalone display | PASS, configuration | Existing manifest display=standalone; physical launch pending. |
| Theme color | PASS | Manifest and hosted Admin metadata use #B91546; viewport-fit=cover retained. |
| Service worker | PASS, existing scope | Hosted /admin/sw.js matches repository. Push-only, registered on explicit enablement; no fetch handler or offline sensitive-data cache. Push was not enabled. |
| Auth from Home Screen | PENDING | Normal browser login/deep-link return passes; actual installed launch not performed. |
| Safe area in standalone mode | PENDING | CSS/configuration exists; requires physical-device evidence. |
| Physical iPhone Home-Screen test | PENDING | Owner device required. |
| Physical Android Home-Screen test | PENDING | Owner device required. |

### Hosted bookings evidence and mutation boundary

The final brief explicitly requests ordinary Production Bookings/Detail navigation. After owner sign-in, the actual 390px Bookings list rendered, a booking detail opened with Tour & guests, Contact, Payment and Booking emails, and browser Back collapsed it. No overflow or error alert. No Create, Modify, Cancel, Collect payment or Resend action was submitted. Unlike earlier checkpoints that avoided this route, this ordinary navigation may run the application's existing automatic schedule/inventory preparation. No assertion of a database snapshot remaining byte-for-byte unchanged is made.

### Final verification

Complete test chain: 335 passed, zero failed/skipped. Final menu-prefetch-only edit followed by lint, TypeScript, 18 component tests and isolated production build PASS. The 18 supporting tests are not added to the 335 total. Build source is compared before release. Private logs: admin-closure-lint.log, admin-closure-types.log, admin-closure-tests.log, admin-closure-components-final.log, admin-closure-build.log.

Code/responsive acceptance: PASS, subject to final deployed-patch smoke below. Physical-device acceptance: PENDING. A successful new hosted CMS/Storage/booking transaction is not claimed; this was non-destructive acceptance.
