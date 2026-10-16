# F10 CMS verification result

Generated 2026-10-16T09:57:50.437Z. Baseline `5fb987b83f3a575a65d1fb77a96acc6731c97468`. Local disposable data only.

Active controls: 126; retained keys: 84; historical protected code entries: 41. Structural connectivity is separate from behavioral status.

Behavioral fields/entities: {"PASS":131,"FAIL":0,"UNTESTED":0}. Active-control behavior: {"PASS":126,"FAIL":0,"UNTESTED":0}. Independent safety/role/entity checks: {"PASS":21,"FAIL":0,"UNTESTED":0}.

| Field | Owner | Consumer | Connectivity | Status | Limits / failure |
|---|---|---|---|---|---|
| hero.eyebrow | Hero | HomepageView | Connected | PASS |  |
| hero.title | Hero | HomepageView | Connected | PASS |  |
| hero.emphasis | Hero | HomepageView | Connected | PASS |  |
| hero.description | Hero | HomepageView | Connected | PASS |  |
| hero.subtitle | Hero | HomepageView | Connected | PASS |  |
| hero.desktop | Hero | HomepageView | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| hero.mobile | Hero | HomepageView | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| hero.desktopPosition | Hero | HomepageView | Partial | PASS | CSS projection only; >=1600px center-to-bottom transformation is preserved, not certified as faithful crop. |
| hero.mobilePosition | Hero | HomepageView | Connected | PASS | CSS projection only; >=1600px center-to-bottom transformation is preserved, not certified as faithful crop. |
| hero.alt | Hero | HomepageView | Connected | PASS |  |
| hero.book | Hero | HomepageView | Connected | PASS |  |
| hero.track | Hero | HomepageView | Connected | PASS |  |
| hero.discover | Hero | HomepageView | Connected | PASS |  |
| hero.showOnHomepage | Hero | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| hero.amenities | Hero amenities | HomepageView | Connected | PASS |  |
| homeRoute.eyebrow | Homepage stop overview | HomepageView | Connected | PASS |  |
| homeRoute.title | Homepage stop overview | HomepageView | Connected | PASS |  |
| homeRoute.text | Homepage stop overview | HomepageView | Connected | PASS |  |
| homeRoute.action | Homepage stop overview | HomepageView | Connected | PASS |  |
| route.eyebrow | The places between | actual YourDay route, synthetic request-loader context | Connected | PASS |  |
| route.title | The places between | actual YourDay route, synthetic request-loader context | Connected | PASS |  |
| route.showOnHomepage | The places between | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| live.eyebrow | Your day, without the guesswork | HomepageView | Connected | PASS |  |
| live.title | Your day, without the guesswork | HomepageView | Connected | PASS |  |
| live.emphasis | Your day, without the guesswork | HomepageView | Connected | PASS |  |
| live.text | Your day, without the guesswork | HomepageView | Connected | PASS |  |
| live.linkLabel | Your day, without the guesswork | HomepageView | Connected | PASS |  |
| live.showOnHomepage | Your day, without the guesswork | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| departures.eyebrow | Today, at a glance | HomepageView | Connected | PASS |  |
| departures.title | Today, at a glance | HomepageView | Connected | PASS |  |
| departures.linkLabel | Today, at a glance | HomepageView | Connected | PASS |  |
| departures.showOnHomepage | Today, at a glance | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| notebook.eyebrow | The local notebook | HomepageView | Connected | PASS |  |
| notebook.title | The local notebook | HomepageView | Connected | PASS |  |
| notebook.linkLabel | The local notebook | HomepageView | Connected | PASS |  |
| notebook.0.linkLabel | The local notebook | HomepageView | Connected | PASS |  |
| notebook.showOnHomepage | The local notebook | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| reviews.eyebrow | Guest Reviews | HomepageView | Connected | PASS |  |
| reviews.title | Guest Reviews | HomepageView | Connected | PASS |  |
| reviews.text | Guest Reviews | HomepageView | Connected | PASS |  |
| reviews.showOnHomepage | Guest Reviews | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| final.eyebrow | Final booking invitation | HomepageView | Connected | PASS |  |
| final.title | Final booking invitation | HomepageView | Connected | PASS |  |
| final.emphasis | Final booking invitation | HomepageView | Connected | PASS |  |
| final.book | Final booking invitation | HomepageView | Connected | PASS |  |
| final.image | Final booking invitation | HomepageView | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| final.alt | Final booking invitation | HomepageView | Connected | PASS |  |
| final.showOnHomepage | Final booking invitation | HomepageView | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| partners.eyebrow | Our Partners | PartnersSection | Connected | PASS |  |
| partners.title | Our Partners | PartnersSection | Connected | PASS |  |
| partners.description | Our Partners | PartnersSection | Connected | PASS |  |
| partners.ctaEnabled | Our Partners | PartnersSection | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| partners.ctaLabel | Our Partners | PartnersSection | Connected | PASS |  |
| partners.ctaUrl | Our Partners | PartnersSection | Connected | PASS |  |
| partners.showOnHomepage | Our Partners | PartnersSection | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| whatsapp.enabled | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| whatsapp.number | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS |  |
| whatsapp.message | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS |  |
| whatsapp.label | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS |  |
| whatsapp.desktop | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| whatsapp.mobile | WhatsApp contact | whatsappLink + WhatsAppContact | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| legal.privacy.text | Privacy Policy | LegalPage | Connected | PASS |  |
| legal.privacy.status | Privacy Policy | LegalPage | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| legal.terms.text | Terms & Conditions | LegalPage | Connected | PASS |  |
| legal.terms.status | Terms & Conditions | LegalPage | Connected | PASS | Conditional DOM/projection proof; not physical-device CSS or interaction proof. |
| nav.home | Navigation | Header | Connected | PASS |  |
| nav.0.label | Navigation | Header | Partial | PASS | Duplicate normalized targets are suppressed; label probe uses an explicit unique-target precondition. Separate default suppression check is recorded. |
| nav.0.link | Navigation | Header | Partial | PASS | Duplicate normalized targets are suppressed; label probe uses an explicit unique-target precondition. Separate default suppression check is recorded. |
| nav.1.label | Navigation | Header | Connected | PASS |  |
| nav.1.link | Navigation | Header | Connected | PASS |  |
| nav.2.label | Navigation | Header | Connected | PASS |  |
| nav.2.link | Navigation | Header | Connected | PASS |  |
| nav.3.label | Navigation | Header | Partial | PASS | Duplicate normalized targets are suppressed; label probe uses an explicit unique-target precondition. Separate default suppression check is recorded. |
| nav.3.link | Navigation | Header | Partial | PASS | Duplicate normalized targets are suppressed; label probe uses an explicit unique-target precondition. Separate default suppression check is recorded. |
| nav.4.label | Navigation | Header | Connected | PASS |  |
| nav.4.link | Navigation | Header | Connected | PASS |  |
| nav.book | Navigation | Header | Connected | PASS |  |
| footer.social.instagram | Footer | Footer | Connected | PASS |  |
| footer.social.facebook | Footer | Footer | Connected | PASS |  |
| footer.social.getYourGuide | Footer | Footer | Connected | PASS |  |
| footer.social.tripadvisor | Footer | Footer | Connected | PASS |  |
| footer.business | Footer | Footer | Connected | PASS |  |
| footer.vat | Footer | Footer | Connected | PASS |  |
| footer.year | Footer | Footer | Connected | PASS |  |
| seo.title | Homepage SEO | websiteMetadata | Connected | PASS |  |
| seo.description | Homepage SEO | websiteMetadata | Connected | PASS |  |
| seo.image | Homepage SEO | websiteMetadata | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| seo.alt | Homepage SEO | websiteMetadata | Connected | PASS |  |
| routePage.eyebrow | Route & Live Map presentation | RouteJourney | Connected | PASS |  |
| routePage.title | Route & Live Map presentation | RouteJourney | Connected | PASS |  |
| routePage.text | Route & Live Map presentation | RouteJourney | Connected | PASS |  |
| routePage.departures | Route & Live Map presentation | RouteJourney | Connected | PASS |  |
| routePage.stops | Route & Live Map presentation | RouteJourney | Connected | PASS |  |
| routePage.mapAction | Route & Live Map presentation | actual React client component, opened/closed in isolated jsdom | Connected | PASS |  |
| routePage.seoTitle | Route & Live Map presentation | editorialMetadata | Connected | PASS |  |
| routePage.seoDescription | Route & Live Map presentation | editorialMetadata | Connected | PASS |  |
| routePage.seoImage | Route & Live Map presentation | editorialMetadata | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| routePage.seoAlt | Route & Live Map presentation | editorialMetadata | Connected | PASS |  |
| labels.guide | Shared visitor action labels | ExploreView | Connected | PASS |  |
| labels.destination | Shared visitor action labels | HomepageView | Connected | PASS |  |
| labels.reviews | Shared visitor action labels | HomepageView | Connected | PASS |  |
| labels.leaveReview | Shared visitor action labels | HomepageView | Connected | PASS |  |
| labels.originalReview | Shared visitor action labels | HomepageView | Connected | PASS |  |
| bookingDialog.title | Shared visitor action labels | actual React client component, opened/closed in isolated jsdom | Connected | PASS |  |
| bookingDialog.text | Shared visitor action labels | actual React client component, opened/closed in isolated jsdom | Connected | PASS |  |
| bookPage.seoTitle | Booking search & social preview | editorialMetadata | Connected | PASS |  |
| bookPage.seoDescription | Booking search & social preview | editorialMetadata | Connected | PASS |  |
| bookPage.seoImage | Booking search & social preview | editorialMetadata | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| bookPage.seoAlt | Booking search & social preview | editorialMetadata | Connected | PASS |  |
| faqPage.seoTitle | FAQ search & social preview | editorialMetadata | Connected | PASS |  |
| faqPage.seoDescription | FAQ search & social preview | editorialMetadata | Connected | PASS |  |
| faqPage.seoImage | FAQ search & social preview | editorialMetadata | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| faqPage.seoAlt | FAQ search & social preview | editorialMetadata | Connected | PASS |  |
| explorePage.seoTitle | Explore search & social preview | editorialMetadata | Connected | PASS |  |
| explorePage.seoDescription | Explore search & social preview | editorialMetadata | Connected | PASS |  |
| explorePage.seoImage | Explore search & social preview | editorialMetadata | Connected | PASS | Image URL binding only; no remote fetch, visual crop or binary upload proof. |
| explorePage.seoAlt | Explore search & social preview | editorialMetadata | Connected | PASS |  |
| explorePage.eyebrow | Explore introduction | ExploreView | Connected | PASS |  |
| explorePage.title | Explore introduction | ExploreView | Connected | PASS |  |
| explorePage.text | Explore introduction | ExploreView | Connected | PASS |  |
| bookPage.eyebrow | Booking introduction | PageIntro | Connected | PASS |  |
| bookPage.title | Booking introduction | PageIntro | Connected | PASS |  |
| dayPage.eyebrow | Travel companion introduction | PageIntro | Connected | PASS |  |
| dayPage.title | Travel companion introduction | PageIntro | Connected | PASS |  |
| tourPage.faqTitle | Questions & answers | FaqPage | Connected | PASS |  |
| faq.items | Questions & answers | FaqPage | Connected | PASS |  |
| destinations.draft_publish_association | destinations | GuideView + sightseeingStops | Explicit consumer/boundary probe | PASS | Local synthetic SQL and public projection; not hosted UI authentication. |
| partners.immediate_active_publication | partners | PartnersSection + anonymous RLS | Explicit consumer/boundary probe | PASS | Local synthetic SQL and public projection; not hosted UI authentication. |
| reviews.publication_soft_delete | reviews | GuestReviews with published selection | Explicit consumer/boundary probe | PASS | Local synthetic SQL and public projection; not hosted UI authentication. |
| calendar_pricing.permission_boundary | calendar_pricing | existing pricing RPC authorization | Explicit consumer/boundary probe | PASS | Local synthetic SQL and public projection; not hosted UI authentication. |
| meeting_point.append_only_owner_versions | meeting_point | meeting_point_versions SQL | Explicit consumer/boundary probe | PASS | Local synthetic SQL and public projection; not hosted UI authentication. |

## Retired Catalog compatibility (not public rendering)

- PASS: catalog.product.meta_title — Compatibility PASS only; not a claim that retired Catalog properties render as public SEO.
- PASS: catalog.product.meta_description — Compatibility PASS only; not a claim that retired Catalog properties render as public SEO.
- PASS: catalog.product.og_image — Compatibility PASS only; not a claim that retired Catalog properties render as public SEO.
- PASS: catalog.product.og_image_alt — Compatibility PASS only; not a claim that retired Catalog properties render as public SEO.

## Independent checks

- PASS: roles.editor_cannot_initialize — real Website RPC / SQLSTATE
- PASS: roles.owner_initializes — real Website RPC / persisted publication
- PASS: roles.editor_draft_publisher_publish — real RPC / fresh queries
- PASS: roles.owner_only_settings — real RPC / editor and admin rejection
- PASS: roles.unauthenticated_write_denied — anon SQL role / RPC grant
- PASS: roles.cross_operator_denied — real RPC / actor-operator mismatch
- PASS: roles.stale_document_denied — real RPC / optimistic stamp
- PASS: compatibility.historical_values_roundtrip — current SQL save + application validator
- PASS: compatibility.additive_old_document — remove additive partner fields / SQL and app validation
- PASS: navigation.default_duplicate_suppression — actual publicNavigation projection
- PASS: visibility.mandatory_route_map — actual RouteJourney when optional flags off
- PASS: visibility.hidden_amenities_and_empty_default — real HomepageView
- PASS: faq.inclusions_and_inactive — real FaqPage / negative text markers
- PASS: self_test.deliberately_disconnected_control — isolated fixture projection drops marker
- PASS: entities.destinations.draft_publish_association — real SQL persistence + GuideView + sightseeingStops
- PASS: entities.partners.immediate_active_publication — real SQL persistence + PartnersSection + anonymous RLS
- PASS: entities.reviews.publication_soft_delete — real SQL persistence + GuestReviews with published selection
- PASS: entities.catalog.persistence_and_owned_inclusions — real catalog RPC / canonical FAQ component
- PASS: entities.catalog.retirement_compatibility — active editor inventory + real old/current RPC saves + Website SEO
- PASS: entities.calendar_pricing.permission_boundary — real SQL persistence + existing pricing RPC authorization
- PASS: entities.meeting_point.append_only_owner_versions — real SQL persistence + meeting_point_versions SQL

## Interpretation

FAIL is a detected connection/assertion failure; UNTESTED is never counted as PASS. See machine-readable lifecycle stages and evidence per row. Compatibility PASS means stored data survived, not that dormant keys have public consumers. Code-controlled entries remain behaviorally UNTESTED. The 126 active Website controls are not a count of every Destination/Partner/Review/Calendar subfield; entity cases are representative lifecycle and boundary probes, not exhaustive per-property certification. No external map, provider, hosted API, credentials or public browser route was used. Client probes open and close actual dialogs in a simulated DOM; request probes render the actual Your Day page with synthetic loaders. Neither establishes physical-device visibility, actual authenticated sessions or hosted persistence. Historical 134-field artifacts remain untouched.
