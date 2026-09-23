# Homepage CMS connection audit

Date: 2026-09-23. Existing public route: `/`.

The existing homepage markup was extracted without redesign into `HomepageView` so the public page and protected draft preview share it. Existing Header, Footer, BookingBar, RoutePreview, Media and LiveMapEmbed are reused. Default values were imported from this local website, not the legacy website. The original source roadmap is unchanged.

## Publishing and security

- Existing `content_pages` stores a reserved `website-homepage` record. Draft fields live at `body.content`; published fields at `published_body.content`. Migration `20260923000100` adds these publishing capabilities and an audited, tenant/role-checked, stale-edit-protected RPC. Applied to the development Supabase project; unrelated notification migration remains deferred.
- Save Draft changes only the draft. Publish copies the complete validated saved document plus the current section into the published snapshot atomically. Admin explains that publication includes all saved drafts.
- No arbitrary HTML, executable URLs, credentials, CSS or operational fields are editable. Links are restricted to known application routes. Image paths are restricted to local images or the editorial Supabase Storage bucket.
- Public content is server-rendered, with a bounded 4-second read and request deduplication. A warm process retains its last valid published document on failure; a cold process uses the original local content. This is a safe fallback, not a durable last-published cache across server restarts. No draft is cached by the public reader.
- `website-media` is the first editorial upload bucket in this project; no prior Storage media implementation/library was found. Uploads are authorized server actions, limited to 8 MB and raster image signatures. Original bytes are preserved, alt text is stored in the document, and random operator-prefixed object names avoid overwrite. Uploaded images are public assets; only trusted server actions write them.
- Hero uses a picture source at 700px, selecting mobile separately; the browser verified the mobile source at 390px and the desktop source at 1920px.
- Booking prices, seat counts, dates and departure times still use the existing domain. No GPS/ETA/route data is copied; the existing iframe remains unchanged. The obsolete local published-stop branch is replaced by the existing illustrative destination component, with operational route links pointing to the live map.

## Field-by-field evidence

All 123 fields were changed through actual owner Admin forms in Chrome, saved as drafts, then published together. Public content stayed unchanged before publication. After publication, text nodes, metadata, links, image attributes, selectable destination details and mobile navigation/image source were inspected on the same `/` page. Initial content is restored after testing. PASS below means Admin form → development Supabase → public component connection; upload transport is a separate check.

| ADMIN FIELD | DATABASE FIELD (published) | PUBLIC COMPONENT | PUBLIC LOCATION | TEST RESULT |
| --- | --- | --- | --- | --- |
| Hero / Eyebrow | content_pages.published_body.content[hero.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Main heading | content_pages.published_body.content[hero.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Emphasized heading | content_pages.published_body.content[hero.emphasis] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Description | content_pages.published_body.content[hero.description] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Second description line | content_pages.published_body.content[hero.subtitle] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Desktop hero image | content_pages.published_body.content[hero.desktop] | HomepageView / homepage-view.tsx + Media | / | PASS — browser form save/publish and rendered value |
| Hero / Mobile hero image | content_pages.published_body.content[hero.mobile] | HomepageView / homepage-view.tsx + Media | / | PASS — browser form save/publish and rendered value |
| Hero / Hero image description | content_pages.published_body.content[hero.alt] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Booking button label | content_pages.published_body.content[hero.book] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Map link label | content_pages.published_body.content[hero.track] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Hero / Scroll link label | content_pages.published_body.content[hero.discover] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| A day with possibilities / Eyebrow | content_pages.published_body.content[intro.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| A day with possibilities / Heading | content_pages.published_body.content[intro.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| A day with possibilities / Description | content_pages.published_body.content[intro.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| A day with possibilities / Tour link label | content_pages.published_body.content[intro.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| A day with possibilities / Tour link | content_pages.published_body.content[intro.link] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The places between / Eyebrow | content_pages.published_body.content[route.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The places between / Heading | content_pages.published_body.content[route.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The places between / Description | content_pages.published_body.content[route.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Eyebrow | content_pages.published_body.content[destinations.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Heading | content_pages.published_body.content[destinations.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — name | content_pages.published_body.content[place.centre.name] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — short label | content_pages.published_body.content[place.centre.tag] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — story | content_pages.published_body.content[place.centre.text] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — selected destination description | content_pages.published_body.content[place.centre.detail] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — image | content_pages.published_body.content[place.centre.image] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — image description | content_pages.published_body.content[place.centre.alt] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Historic Centre — guide link | content_pages.published_body.content[place.centre.link] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — name | content_pages.published_body.content[place.castle.name] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — short label | content_pages.published_body.content[place.castle.tag] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — story | content_pages.published_body.content[place.castle.text] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — selected destination description | content_pages.published_body.content[place.castle.detail] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — image | content_pages.published_body.content[place.castle.image] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — image description | content_pages.published_body.content[place.castle.alt] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Rozafa Castle — guide link | content_pages.published_body.content[place.castle.link] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — name | content_pages.published_body.content[place.lake.name] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — short label | content_pages.published_body.content[place.lake.tag] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — story | content_pages.published_body.content[place.lake.text] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — selected destination description | content_pages.published_body.content[place.lake.detail] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — image | content_pages.published_body.content[place.lake.image] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — image description | content_pages.published_body.content[place.lake.alt] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Shiroka & the lake — guide link | content_pages.published_body.content[place.lake.link] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — name | content_pages.published_body.content[place.bridge.name] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — short label | content_pages.published_body.content[place.bridge.tag] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — story | content_pages.published_body.content[place.bridge.text] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — selected destination description | content_pages.published_body.content[place.bridge.detail] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — image | content_pages.published_body.content[place.bridge.image] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — image description | content_pages.published_body.content[place.bridge.alt] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Four reasons to linger / Mesi Bridge — guide link | content_pages.published_body.content[place.bridge.link] | HomepageView + RoutePreview + Media | / | PASS — browser form save/publish and rendered value |
| Your day, without the guesswork / Eyebrow | content_pages.published_body.content[live.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Your day, without the guesswork / Heading | content_pages.published_body.content[live.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Your day, without the guesswork / Emphasized heading | content_pages.published_body.content[live.emphasis] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Your day, without the guesswork / Description | content_pages.published_body.content[live.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Your day, without the guesswork / Live map link label | content_pages.published_body.content[live.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Eyebrow | content_pages.published_body.content[how.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Heading | content_pages.published_body.content[how.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 1 title | content_pages.published_body.content[how.0.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 1 description | content_pages.published_body.content[how.0.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 2 title | content_pages.published_body.content[how.1.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 2 description | content_pages.published_body.content[how.1.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 3 title | content_pages.published_body.content[how.2.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 3 description | content_pages.published_body.content[how.2.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 4 title | content_pages.published_body.content[how.3.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Keep it beautifully simple / Step 4 description | content_pages.published_body.content[how.3.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Today, at a glance / Eyebrow | content_pages.published_body.content[departures.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Today, at a glance / Heading | content_pages.published_body.content[departures.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Today, at a glance / Timetable link label | content_pages.published_body.content[departures.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Days worth sharing / Eyebrow | content_pages.published_body.content[reviews.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Days worth sharing / Heading | content_pages.published_body.content[reviews.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Days worth sharing / First line | content_pages.published_body.content[reviews.text] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Days worth sharing / Second line | content_pages.published_body.content[reviews.second] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Eyebrow | content_pages.published_body.content[notebook.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Heading | content_pages.published_body.content[notebook.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Guide link label | content_pages.published_body.content[notebook.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 1 eyebrow | content_pages.published_body.content[notebook.0.tag] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 1 heading | content_pages.published_body.content[notebook.0.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 1 link label | content_pages.published_body.content[notebook.0.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 2 eyebrow | content_pages.published_body.content[notebook.1.tag] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 2 heading | content_pages.published_body.content[notebook.1.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 2 link label | content_pages.published_body.content[notebook.1.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 3 eyebrow | content_pages.published_body.content[notebook.2.tag] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 3 heading | content_pages.published_body.content[notebook.2.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| The local notebook / Card 3 link label | content_pages.published_body.content[notebook.2.linkLabel] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Eyebrow | content_pages.published_body.content[final.eyebrow] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Heading | content_pages.published_body.content[final.title] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Emphasized heading | content_pages.published_body.content[final.emphasis] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Booking button label | content_pages.published_body.content[final.book] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Banner image | content_pages.published_body.content[final.image] | HomepageView / homepage-view.tsx + Media | / | PASS — browser form save/publish and rendered value |
| Final booking invitation / Image description | content_pages.published_body.content[final.alt] | HomepageView / homepage-view.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 1 label | content_pages.published_body.content[nav.0.label] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 1 destination | content_pages.published_body.content[nav.0.link] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 2 label | content_pages.published_body.content[nav.1.label] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 2 destination | content_pages.published_body.content[nav.1.link] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 3 label | content_pages.published_body.content[nav.2.label] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 3 destination | content_pages.published_body.content[nav.2.link] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 4 label | content_pages.published_body.content[nav.3.label] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 4 destination | content_pages.published_body.content[nav.3.link] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 5 label | content_pages.published_body.content[nav.4.label] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Link 5 destination | content_pages.published_body.content[nav.4.link] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Header booking button | content_pages.published_body.content[nav.book] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Mobile booking button | content_pages.published_body.content[nav.mobileBook] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Navigation / Mobile map link label | content_pages.published_body.content[nav.mobileMap] | Header / booking.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Tagline first line | content_pages.published_body.content[footer.line1] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Tagline second line | content_pages.published_body.content[footer.line2] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 1 label | content_pages.published_body.content[footer.0.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 1 destination | content_pages.published_body.content[footer.0.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 2 label | content_pages.published_body.content[footer.1.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 2 destination | content_pages.published_body.content[footer.1.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 3 label | content_pages.published_body.content[footer.2.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 3 destination | content_pages.published_body.content[footer.2.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 4 label | content_pages.published_body.content[footer.3.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 4 destination | content_pages.published_body.content[footer.3.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 5 label | content_pages.published_body.content[footer.4.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 5 destination | content_pages.published_body.content[footer.4.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 6 label | content_pages.published_body.content[footer.5.label] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Link 6 destination | content_pages.published_body.content[footer.5.link] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Location | content_pages.published_body.content[footer.location] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Language note | content_pages.published_body.content[footer.language] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Footer / Contact and legal note | content_pages.published_body.content[footer.contact] | Footer / ui.tsx | / | PASS — browser form save/publish and rendered value |
| Homepage SEO / Search title | content_pages.published_body.content[seo.title] | generateMetadata / (public)/page.tsx | / | PASS — browser form save/publish and rendered value |
| Homepage SEO / Search description | content_pages.published_body.content[seo.description] | generateMetadata / (public)/page.tsx | / | PASS — browser form save/publish and rendered value |
| Homepage SEO / Social image | content_pages.published_body.content[seo.image] | generateMetadata / (public)/page.tsx | / | PASS — browser form save/publish and rendered value |
| Homepage SEO / Social image description | content_pages.published_body.content[seo.alt] | generateMetadata / (public)/page.tsx | / | PASS — browser form save/publish and rendered value |

## Checks and remaining verification

- 141 automated tests passed (15 identity, 32 integration, 76 database, 18 native PostgreSQL), including new draft isolation, stale writes, unsafe links, tenant/role denial, initialization idempotency and audit tests.
- Browser verified original content prefilled, private same-component preview, draft isolation, all-field publishing and responsive hero source selection.
- Chrome automation file chooser could not attach a local image because the extension lacks file-URL access. Upload code is implemented, but a real browser upload remains unverified until that permission is enabled. Do not count that transport as PASS.
- No production deployment, external messaging, booking mutation or tracking service change.

## Final verification and use

- Original 123 draft and published values were compared to the imported baseline and restored exactly after the browser tests. No test copy remains.
- Admin at 390px had zero overflowing inputs/buttons/images; tablet at 768px had no horizontal document overflow. Temporary browser viewport overrides were reset. Public mobile page at 390px had no horizontal overflow.
- Optimized build passed in ignored `private/build-homepage-cms`; original build configuration files restored. Lint and typecheck passed.
- Environment variable names unchanged. Next Server Action body limit is 9 MB to allow the 8 MB raster upload plus form overhead.

Open Admin ? Website content. Expand a homepage card, edit, and use Save Draft. Preview saved draft opens the same public components with private draft data. Publish applies all saved homepage drafts together. View Live Page opens `/` on the current environment. Edit one section at a time; stale edits are rejected. Images show their current thumbnail and can be replaced using the upload control or a valid local/Supabase image path. Public page styling and map settings remain code-controlled.

Final follow-up: optimized build also passed in `private/build-homepage-cms-final`; public crawl passed seven pages / 141 internal links. Integration suite rerun passed 32 tests. Anonymous draft-preview HTTP response contained a streamed sign-in redirect and no draft heading. Database permission assertions additionally verify anon/authenticated cannot invoke the privileged publishing RPC.
