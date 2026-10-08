# Public-to-admin connection matrix

8 October 2026 ? current local implementation, not a deployed-state certificate. Supersedes the prior 30/36 audit calculation, whose denominator included retired consumers. No aggregate coverage percentage is asserted. Website content means content_pages[website-homepage].body.content for saved drafts and published_body.content for public reads.

| Public element | Authoritative admin owner | Stored source | Public consumer | Implementation / boundary |
|---|---|---|---|---|
| Hero | Website ? Hero | hero.* | HomepageHero | Existing copy, responsive images, alt and focal positions retained |
| Homepage ticket | Website ? A day with possibilities; Products | intro headings/visibility; products.description/inclusions | HomepageView; Route ticket heading | Whole homepage ticket hides together; product remains copy authority |
| Homepage stop overview | Website ? Homepage stop overview | homeRoute.*; published map stops | HomepageView | New copy/action controls; count is operational, never manually maintained |
| Route & Live Map presentation | Website ? Public pages ? Route & Live Map | routePage.* | RouteJourney; /route metadata | New headings/introduction/actions and SEO; iframe/status logic remains code-owned |
| Destination-story presentation | Website ? The places between | route.* | Tour / sample companion; shared visibility also affects stop overviews | Existing editorial presentation retained |
| Live promotion and timetable | Website ? Live / Today at a glance | live.*, departures.*; canonical planner | Homepage / Tour / Route as described in editor | Presentation separate from schedules, prices and live tracking |
| Notebook | Website ? Local notebook; shared Destinations | notebook headings/action; destination_v1 | HomepageView | Legacy static notebook cards hidden from editor |
| Reviews | Website ? Guest Reviews introduction; Guest Reviews module | reviews.* introduction; reviews/review_settings | Homepage GuestReviews; footer Google link | Owner/admin curate; owner manages external review settings |
| Closing invitation | Website ? Final booking invitation | final.* | Footer FinalInvitation, route exclusions retained | Existing visibility and banner source retained |
| Tour content and SEO | Website ? Tour introduction; Products | tourPage.eyebrow/includedTitle; products metadata/inclusions/image | TourView and /tour metadata; homepage inclusions heading | Product identity protected; description/image labels clarify consumers |
| FAQ | Website ? Questions & answers | managed FAQ fields; faqPage.seo* | FaqPage and /faq metadata | Dedicated FAQ consumer, not removed Tour FAQ; technical answers remain guarded |
| Explore | Website ? Explore introduction / search & social preview | explorePage.* | ExploreView and /explore metadata | New SEO image/alt/title/description controls |
| Booking introduction and SEO | Website ? Booking introduction / search & social preview | bookPage.* | /book PageIntro and metadata | No quote, price or booking-mechanics editing |
| Shared action labels and dialog | Website ? Shared visitor action labels | labels.*, bookingDialog.* | Homepage / Tour / Explore / guide / reviews / BookingProvider | Shared labels reused; dialog preview blocks checkout actions |
| Sample travel companion | Website ? Travel companion introduction | dayPage.* | /your-day | Sample presentation only; sample SEO remains code-owned |
| Editorial destinations | Website ? Destinations | content_pages destination_v1 draft/published bodies, aliases and ordering | Explore / guide / Tour / Homepage / Route mapped details | One editor; coordinates removed; publisher controls immediate order/publication |
| Homepage and guide SEO | Website ? Homepage search & sharing; Destinations | seo.*; destination SEO fields | Homepage/guide metadata | Existing owners retained |
| Navigation | Website ? Navigation | nav.*; published operator destination slugs/aliases | Header desktop/mobile | Approved selector; app + SQL allowlist; legacy /live and /#route resolve to /route |
| Contact/footer/legal | Website ? Global; footer Google control | footer.*, whatsapp.*, legal.*; review_settings.google_reviews_url | Footer / WhatsApp / LegalPage | Owner-sensitive; no fabricated legal approval or content |
| Meeting point | Calendar & Pricing ? Owner: booking meeting point | meeting_point_versions ? bookings.meeting_point_snapshot | Prebooking summary; confirmation/pass/manage; fresh v2 email snapshots | Effective-dated versions; existing bookings retain original promise |
| Fares and scheduling | Calendar & Pricing | Existing pricing/schedule/inventory sources | Planner / booking / price presentation | Owner/admin prices; operations schedule only with commercial values unchanged |
| Operational stops/GPS/ETA | Independent Live Map admin handoff | Existing independent map publication and bridge | Embedded map / public route | No new stop/GPS editor or tracking engine |

Retained inactive fields are not new editing sources: intro.text/link/linkLabel, how.*, hero.amenities, reviews.second, static notebook/place compatibility data, nav.mobileBook/mobileMap, footer.line1 and destination lat/lng. Public destination records own editorial cards; product description owns ticket copy.

See [implementation and verification report](PUBLIC-ADMIN-CONNECTIONS-REPORT.md) for permissions, migration order, evidence and outstanding acceptance. ?Implemented? does not mean each field has completed an authenticated browser save/publish walkthrough.
