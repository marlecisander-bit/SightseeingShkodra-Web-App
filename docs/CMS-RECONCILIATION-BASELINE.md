# Public/admin reconciliation - baseline (before code/database changes)

Actual public route patterns: `/`, `/book`, `/tour`, `/live`, `/explore`, `/explore/[slug]` (centre/castle/lake/bridge only), `/your-day`, `/credits`. There are no separate Route, Stops, Contact, About or Legal routes. Route/FAQ/timetable are anchors. Auth routes: sign-in, activate, set-password. Public APIs: availability and checkout. Technical endpoints: robots/sitemap. Development previews are not public production pages.

Admin: `/admin` workspace selector; `/admin/[operatorId]/[section]` for overview, catalog, departures, bookings, content, reviews; `/admin/[operatorId]/website-preview`. No separate Media, Languages, Settings or Integrations editor. Media upload is embedded in CMS/reviews; SEO in CMS/catalog/guide forms. Maps/stops/GPS admin remains in the independent map product under the user amendment.

| Public section | Component | Source | Editable / owner | Shared | Duplicate | Baseline status |
|---|---|---|---|---|---|---|
| All header/nav/mobile CTA | Header | website-homepage nav.* | Yes / Website Homepage Navigation | Yes | No | CONNECTED |
| All footer | Footer | website-homepage footer.* | Yes / Website Homepage Footer | Yes | No | CONNECTED |
| Brand logo/name | BrandLogo, metadata | approved SVG / brand code | Code-controlled brand registry | Yes | No | HARDCODED-INTENTIONAL |
| Home hero/intro/route headings/live pitch/how/departures intro/notebook/final | HomepageView | website-homepage | Yes / Homepage section cards | Some | No | CONNECTED |
| Home price/timetable | HomepageView | product pricing + availability | Products / Departures | Yes | No | FUNCTIONAL |
| Home route destination preview/notebook entities | RoutePreview | website-homepage place.* | Destination content | Yes | competing static defaults elsewhere | DUPLICATE |
| Home review heading | GuestReviews | website-homepage reviews.* with sentinel copy replacement | Homepage Guest Reviews | Yes | sentinel overrides saved copy | DUPLICATE |
| Home review records/links/count | GuestReviews | reviews + review_settings | Guest Reviews | Yes | No | CONNECTED |
| Home obsolete showcase headings/review second line | none | stored historical keys | Hidden | No | No | ORPHANED |
| Home old hero/intro/final plain-text slots | none | content_pages homepage-* | hidden from editor but queried | No | structured homepage | ORPHANED |
| Book heading/intro | Book | literals | No owner | No | No | DISCONNECTED |
| Book selectors/holds/checkout/pass/error states | BookingFlow | booking domain/session | Bookings, Products, Departures | Yes | No | FUNCTIONAL |
| Tour product title/description/SEO | Tour | product.title/description (RPC actually uses meta_description) | Catalog lacks description editor | Yes | description versus SEO conflated | DISCONNECTED |
| Tour hero image/intro/inclusions/how/FAQ | Tour | literals/experience | No owner | Some | home how copy overlaps | DISCONNECTED |
| Tour price/timetable/capacity | Tour | same availability domain | Products / Departures | Yes | No | FUNCTIONAL |
| Tour route/boarding | PublishedStops | internal stops table | editor removed by map ownership amendment | Yes | independent map stops | DUPLICATE |
| Tour live map | LiveMapEmbed | external map URL | independent map admin + deployment binding | Yes | No | FUNCTIONAL |
| Tour review placeholder | Tour | literal | No owner | Yes | existing reviews system | DISCONNECTED |
| Live page headings | Live | literals | No owner | No | No | DISCONNECTED |
| Live destination preview | RoutePreview | static destinations array | CMS place.* ignored | Yes | Yes | DUPLICATE |
| Live GPS/ETA/route/stop controls | embedded map | independent map app | independent map admin | Yes | No | FUNCTIONAL |
| Explore hero | Explore | literals | No owner | No | No | DISCONNECTED |
| Explore cards/name/images/summary | Explore | static destinations + optional guide excerpt | CMS place.* ignored | Yes | Yes | DUPLICATE |
| Guide title/body/SEO | Guide | content_pages explore-* | plain-text guide editor | Article copy separate from destination summary | No | CONNECTED |
| Guide image/alt | Guide | static destinations | guide social image editable but ignored | Yes | Yes | DISCONNECTED |
| Your-day sample ticket/QR warning | YourDay | explicit demo code | No real ticket | No | No | HARDCODED-INTENTIONAL |
| Your-day travel headings/destinations | YourDay | literals/static array | No owner / shared CMS ignored | Yes | Yes | DISCONNECTED |
| Credits titles/author/license/modifications | Credits | source attribution manifest | approved asset provenance | Yes | No | HARDCODED-INTENTIONAL |
| Auth screens/security/form validation | auth components | code | Staff identity | Yes | No | FUNCTIONAL |
| Arbitrary plain-text CMS slugs | no route | content_pages | generic editor permits unsupported pages | No | No | ORPHANED |
| Product price | catalog pricing editor | product.pricing_rules | Products only | Yes | No | CONNECTED |
| Service schedules/exceptions | departures editor | schedules/departures | Departures only | Yes | No | CONNECTED |
| Booking operations/payment collection/QR | bookings editor | orders/bookings | Bookings only | Yes | No | FUNCTIONAL |

No database edits have been made at this baseline. Physical media and historical records must not be deleted. Static destination definitions may remain initialization defaults only, not competing runtime sources. Full guide article text/SEO is distinct from short shared destination presentation. Operational coordinates/order belong exclusively to the external map app; editorial destination placement is not stop order.
