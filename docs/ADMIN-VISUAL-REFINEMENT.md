# Admin visual refinement — 28 September 2026

Local only. No deployment, database mutation or business logic changes.

## Audit and direction
Inspected existing shell/navigation, seven permission-scoped routes, website editor and field ownership, Overview, operations, catalog, reviews, bookings and email presentation. Existing ownership inventory remains docs/ADMIN-UX-REFRESH.md and docs/CMS-RECONCILIATION.md. Media uploads and SEO stay with their existing editors; no empty Settings or Media module added. Supabase Auth, draft/published snapshots and independent iframe map architecture remain unchanged.

Public brand-tokens.css is authoritative: primary #B91546, yellow #F6C928, cream #FFF8EE, charcoal #25232A. Admin aliases reference these tokens rather than adding a competing palette. Existing logo-light.svg suits the red header; existing AmenityIcon provides neutral navigation/section icons. Existing Arial typography retained. No generated artwork or new dependencies. The brief contains detailed visual direction but no separate reference image was available in this attachment.

## Refinements
- Red header with existing light logo, yellow accent line, existing View website/workspace/sign-out actions and inverse focus styling.
- White grouped sidebar with existing icons and soft brand selected states. Existing responsive disclosure and Escape/link-close behavior retained.
- Compact numbered CMS section cards, real associated thumbnails or neutral existing icons, clearly separated draft/publication badges, and Edit access to the same form.
- Green ON/grey OFF visibility switches with explicit Visible on homepage / Hidden from homepage labels. Existing accessible names, pending/dirty guards and save/discard semantics retained.
- Preview uses the actual saved image and existing preview route. Added brief tips; real page state remains unchanged. Context column moves below editing on narrower containers.
- Shared shell carries the palette across management modules. No invented operational metrics, fake drag handles, per-event email settings or new routes.

## Verification
- Isolated production build including TypeScript passed; targeted ESLint passed.
- 20 identity and homepage-visibility database tests passed.
- Connected Chrome local synthetic fixture: CMS at 320/390/430/768/1024/1440/1920; Overview, Calendar & Pricing, catalog, reviews and email at 320/768/1440. All 22 size/module checks had no horizontal overflow.
- Desktop/mobile screenshots visually inspected. Mobile menu open/Escape, visibility toggle/discard and existing image editor expansion passed. Eight switches present.
- No production save/publish, booking mutation or email sent. Physical devices not tested. Temporary fixture removed. Public website and independent Map App unchanged.

Files: src/app/admin/admin-shell.tsx, admin.module.css, website-workspace.tsx, website-editor.module.css.

## Continuation, sections 40–91
Reviewed the continuation against existing functionality. Calendar now precedes standard schedule/pricing disclosures, with the actual configured service date range visible. Mobile visibility labels precede the switch. Workspace selection, loading and error surfaces keep appropriate standalone padding after the shared header refactor; workspace selector uses the light logo on red. Login already uses the same public tokens and existing imagery/authentication, so no duplicate login work was needed.

Expanded connected-Chrome synthetic fixture checks: six management surfaces at all 12 specified widths (320, 375, 390, 393, 414, 430, 768, 1024, 1280, 1366, 1440, 1920), 72 cases with no document horizontal overflow. These are layout checks, not live mutation coverage. Bookings remain their existing details/card layout rather than a new table; authenticated booking records/dialog mutation and real physical-device acceptance remain untested. No new tables, queries, email settings, tracking state or business calculations.

## Continuation, sections 92–145
Removed repeated Published badges from section cards: publication is global to the website record. Per-section Draft changes/Unsaved remain useful field comparisons. Global Page Status now compares the whole stored content record, including other editing tabs. Hidden cards retain images/forms/content with a warm muted surface. Editing/hover states use existing border tokens. Context tools now use normal document scrolling; navigation becomes nonsticky on short screens. Mobile header spacing reduced, inactive tabs use neutral text. No schema/routes/auth changes.

Ownership trace reconfirmed: public page calls getHomepage (read_public_homepage_v1 plus getAvailability) for operational timetable/pricing, getPublishedWebsite for editorial headings/visibility, and getPublicDestinations for shared destination records. HomepageView consumes those separately. Today-at-a-glance editor contains heading/eyebrow/link label and visibility, not duplicate departure times. Places reads the destination manager; no second operational-stop editor. This was code tracing, not individual production field-save testing.

Final CMS checked at all 12 widths with 720px height, no horizontal overflow. Hidden hero remained editable with its thumbnail present; discard restored state. Existing public ownership inventory remains applicable. No real CMS publication or booking/email mutation exercised.

## Final continuation: audit deliverable (146–208)

### Routes and navigation
All operator routes retain /admin/[operatorId]/[section].

| Existing section | Navigation group | Existing component | Authoritative data |
|---|---|---|---|
| overview | Home | OverviewPanel | Permission-filtered operational shortcuts |
| content | Website | WebsiteWorkspace / WebsiteSectionEditor / DestinationsEditor | content_pages draft/published bodies and destination entities |
| reviews | Website | ReviewsPanel / ReviewEditor | reviews, review_settings |
| departures | Tour operations | CalendarPanel / OperationsCalendar / ScheduleEditor | Existing schedules, exceptions, departures and pricing |
| catalog | Sales | CatalogPanel | products and suppliers |
| bookings | Sales | BookingsPanel | Existing orders, bookings, passengers, allocations, QR and notifications |
| email | Communication | EmailPanel | Existing configuration projection and notification_deliveries |
| /live | Live service | Existing public iframe viewer | Independent Live Map application |

/admin remains workspace selection. /auth/* remains existing Supabase authentication. Destination and website preview URLs are unchanged. Live Map entry currently opens the public viewer, not a newly invented operational admin route.

### Existing visual foundation
Brand assets: public/brand/logo-color.svg and logo-light.svg; existing content images and /images assets. Tokens: src/app/brand-tokens.css (public authoritative palette). Fonts: existing Arial/Helvetica. Icons: existing AmenityIcon SVG family. Controls: existing Button and module-scoped CSS. Responsive behavior: shared admin menu below 1024px, single-column field groups and compact thumbnails on mobile, context column below the editor on narrower containers. No global/public stylesheet modified.

### Duplication report
No new entity, CMS, media store, renderer, booking engine, email service, tracking pipeline, subscription, query or write path introduced. Hero and final invitation reference existing image fields. Notebook uses shared destination presentation; no blog engine added. Amenities remain editable through their existing component, but their public display remains disabled by the earlier user decision and is explicitly explained in the editor. No mockup amenities inserted.

Header and form-footer Save/Publish actions intentionally address the same existing form/handler for long editors. Redundant collapsed-card Save/Discard is now hidden while that editor is expanded; collapsed visibility edits retain nearby actions. Preview controls explicitly say Preview saved draft, while View website opens the public site.

### Risks and verification boundaries
Overview remains a launchpad: current implementation supplies no verified operational summary there, so no metrics were fabricated. Per-event email enablement is not a supported independent setting; real shared readiness remains displayed. Authentication, authorization, RLS and all mutation handlers are untouched. No data migration needed. Current task adds no dependency or analytics collection.

Audit traces connect CMS field definitions to existing save actions and public consumers; it does not claim every production field was saved and published. Browser verification used local fixtures and no customer data. Real booking mutation, real email sending, iPhone hardware/safe-area behavior and exhaustive authenticated acceptance remain unverified. Existing root build private-backup TypeScript issue remains; isolated source builds pass.

Final owner-facing copy removes unnecessary “records” wording from catalog/email list limits. Targeted lint passed. No deployment.
