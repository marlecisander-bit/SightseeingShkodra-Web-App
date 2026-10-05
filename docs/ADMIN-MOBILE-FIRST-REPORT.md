# Mobile-first Admin redesign

5 October 2026. Local implementation and emulated-browser acceptance complete. Release verification follows below.

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
