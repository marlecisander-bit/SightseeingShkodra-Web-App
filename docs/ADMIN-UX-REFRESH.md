# Admin UI refinement - 28 September 2026

Local implementation only. No schema changes, deployment, email sends or production mutations.

## Audit and ownership

The existing implementation was inspected before editing. The root `/admin` selects a workspace; `/admin/[operatorId]/[section]` dispatches seven permission-checked modules. Authentication remains under `/auth/*`. Website and destination previews remain under their existing operator-scoped routes.

| Current module / route suffix | UI location | Authoritative source and public consumers |
| --- | --- | --- |
| overview | Home / Overview | Existing permission-filtered shortcuts; no invented analytics |
| content | Website / Website content | `content_pages`: draft `body`, public `published_body`; homepage, editorial destinations, public page presentation, navigation/footer/SEO |
| reviews | Website / Guest Reviews | `reviews` and `review_settings`; public review cards. Homepage editor owns only section copy/visibility |
| departures | Tour operations / Calendar & Pricing | `service_schedules`, exceptions, dated departures, product passenger pricing and existing calendar RPCs; booking availability and public timetable |
| catalog | Sales / Products & suppliers | `products` and `suppliers`, with existing relationships; experiences and product metadata. No second price editor |
| bookings | Sales / Bookings | Existing customers, orders/items, bookings, allocations, payments and notification history; confirmation, management and QR |
| /live (existing public route) | Live service / Open Live Map | Existing iframe consumer of independent Map App; no tracking engine or operational stop editor added |
| email | Communication / Email & Notifications | Existing Resend configuration, `notification_deliveries` and worker status; no duplicate settings |

No data merge was needed. Editorial destinations may reference independently owned operational stops; they are not interchangeable entities. Homepage headings are presentation, not a second timetable or review store. Corrected stale helper wording that sent price management toward Products rather than Calendar & Pricing.

Media remains in existing upload controls/storage. SEO remains in the existing global or owning entity editor. No new settings/media/SEO route was created.

## Changes

- Reused the brand logo, shared fonts, red/yellow/cream tokens, Button, cards and input styles.
- Retained routes and role permissions; ordered sidebar links by their existing groups. Added a View website header link and public Live Map entry. Email moved to Communication, not a new module.
- Added one responsive navigation wrapper around the existing navigation. Desktop remains visible; tablet/mobile uses a keyboard-accessible disclosure menu with Escape and link-close behavior. No bottom action bar.
- Overview shortcuts now prioritize Calendar & Pricing, Bookings and Website content. Improved descriptions, including the previously missing email description. It remains a launchpad: no operational counts, capacity totals or live states are asserted without a data feed.
- Homepage cards use concise owner-facing descriptions instead of field counts. Content publication and homepage visibility remain distinct; numbering/order and the inactive amenities explanation remain intact. No nonfunctional drag handles were added to a fixed-order CMS.
- Grouped the same website form fields into Content, Images, and Buttons & links. Existing hidden visibility fields, field names, values, uploads, actions and validation remain. Image source addresses retain progressive disclosure. Sidebar emphasizes saved preview, publication/unsaved state and navigation.
- Preserved Save Draft, Publish, Discard, preview links and global publish semantics. Existing visibility switches remain in collapsed cards.
- Products and suppliers have stronger section separation; type labels are readable while option values stay unchanged. Existing catalog form is exported for reuse in local visual verification, not duplicated.
- Booking order IDs moved into Reference details; pending reservations get a human-readable heading. Payment, cancellation, QR and resend actions are unchanged.
- Review error text no longer asks the owner to apply a migration.
- Email configuration, scheduler detail and test sending use Advanced disclosures. Recent messages and notification status remain prominent. Sender settings stay read-only. No per-event toggle was added because the existing system has one shared enablement setting. No unverified Connected or Delivered status is asserted.

## Files changed by this refresh

`src/app/admin/admin-navigation.tsx` (new shared responsive wrapper), `admin-shell.tsx`, `admin.module.css`, `overview-panel.tsx`, `website-workspace.tsx`, `website-editor.tsx`, `website-editor.module.css`, `catalog-panel.tsx`, `catalog.module.css`, `bookings-panel.tsx`, `reviews-panel.tsx`, `email-panel.tsx`, `email-panel.module.css`, and `src/modules/identity/admin-navigation.ts`.

Earlier uncommitted homepage visibility, mobile-bar removal, and email implementation remain present. This refresh does not claim those as new functionality. No public website component or business service was edited for this refresh.

## Verification

- 66 browser cases: six existing component surfaces (Overview, Website Content, Calendar/Pricing, catalog forms, reviews, email) at 320, 375, 390, 393, 414, 430, 768, 1024, 1366, 1440 and 1920px. Synthetic local data only.
- Checked horizontal overflow, desktop/mobile navigation, Escape, CMS visibility/discard, grouped editing, unique submitted field names and Advanced disclosures. Screenshots retained in `private/admin-refresh-*.png`; desktop Overview/email and mobile CMS inspected.
- 54 tests passed covering identity permissions, homepage draft/visibility persistence, calendar pricing, occupied seats, infant/adult rules, customer booking changes/cutoffs, catalog, review ownership, QR decoding and email authorization/status.
- Logged-out admin redirects and rejection of fake browser roles passed. Login error/recovery navigation and account-free homepage/book access passed.
- Targeted ESLint, isolated typecheck and production build passed. Root typecheck still encounters the pre-existing nested private-copy credits errors; they were not hidden by changing project configuration.
- Temporary development fixture route removed after verification.

## Remaining acceptance and risks

Successful real-user login/logout, authenticated browser saves/publication, actual booking mutations and live email delivery were not performed. Those backend contracts were covered by local tests; responsive UI used fixtures rather than production accounts. Physical iOS/Android testing remains outstanding.

The earlier homepage visibility migration and unpublished email module have their own release prerequisites. Nothing was applied to hosted Supabase here. The local app pointing at the older hosted schema cannot save new visibility fields until its migration is applied.

Overview remains the existing operational launchpad, not a new metrics service. Live Map link opens the existing public viewer; no unverified standalone administrative URL was invented. Per-event email controls and verified live service metrics would require separately scoped functional work.
