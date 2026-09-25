# Manual guest reviews - 24 September 2026

## 1. Database model
Extended the existing operator-scoped `reviews` table rather than creating a duplicate review store. Existing `author`, `body`, `rating`, `source` and timestamps are retained; product association is now optional for business-level reviews. Added review date, original URL, optional avatar/language, featured/published flags, display order, deletion timestamp and future synchronization metadata. Existing records default to unpublished.

`review_settings` stores an operator's display limit (3-6, default 3), Google Maps listing/reviews URL and optional leave-review URL. It is RLS-enabled and server-only. Existing review RLS and restrictions on direct client writes remain intact. Migration `20260924000200_manual_reviews.sql` was applied successfully to the connected development project. No genuine reviews were supplied or invented; no sample reviews were inserted into that project.

## 2. Admin management
Admin > Guest Reviews is available to roles with `content.manage`. Homepage CMS > Guest Reviews also links to it. Add/edit, publish/unpublish, featured and numeric ordering are supported. Delete is a soft deletion that removes the review from display while retaining history. Updates use the saved timestamp to reject stale edits and always scope the row to the authorized operator.

Fields include source (Google Maps, Tripadvisor, Facebook, Direct, Other), reviewer, rating 1-5, exact review text, optional date/original URL/avatar/language, featured, published and display order. Photo uploads reuse the existing validated CMS upload endpoint; an existing Media Library image path can also be entered. A local card preview is shown while entering text. Homepage settings configure count and external CTA URLs. Obsolete second placeholder text is no longer an editable review field; other CMS content is unchanged.

## 3. Homepage components
`GuestReviews` occupies the existing review section's position. `ReviewCard` renders the same presentation regardless of manual entry or future synchronization. Defaults use Loved by our guests / Your stories belong here. Historical placeholder wording is replaced with a real-review introduction; custom CMS copy is retained. The reader selects only published, nondeleted records in the public operator, featured first, then display order, creation date and ID, limited at the database to the configured count. No admin-only synchronization identifiers are sent to the public page.

## 4. Attribution
Cards clearly show reviewer name, individual rating, source label, optional review date and View original when a URL is supplied. External links use a new tab with noopener/noreferrer. Google-source URLs and Google CTA settings are restricted to supported HTTPS Google hosts; unsafe schemes and credential-bearing URLs are rejected. Text is stored and displayed without rewriting. The section identifies itself as a curated selection. No aggregate Google score, total count or aggregate rating structured data is generated.

There is no Google API integration, scraping or automated import. Future API activation must also implement the relevant provider attribution, authorization and caching terms; manual fields are not a claim of API policy compliance. Reference: [Google Places API policies and attribution](https://developers.google.com/maps/documentation/places/web-service/policies).

## 5. Mobile and long text
Desktop uses three columns. Mobile uses native horizontal scrolling with CSS scroll snap, one full-width card per view, touch swipe and accessible 44px navigation-dot targets. No autoplay. Dot navigation respects reduced motion. Review text is clamped to five lines with Read more/Read less; expanded text scrolls within a bounded area. Ratings have accessible text labels, avatars are optional/decorative, and review text can carry its language code.

## 6. Empty state
Zero published reviews hides the complete public section, including headings and CTAs. Errors in the public reader also fail closed without breaking the rest of the homepage. The admin explains how to publish the first genuine review.

## 7. Future API compatibility
`external_id`, `external_author_id`, `sync_source` and `last_synced_at` are reserved in the existing table. A partial unique index on operator/source/external ID prevents duplicate source identities. `original_url` is the source URL. A future authorized provider adapter can populate this model while retaining the same cards. No adapter or scheduled synchronization runs now.

## 8. Verification
- Full database suite: 101 passed sequentially. The initial unrestricted parallel run exceeded machine memory; the sequential rerun passed.
- Integration suite: 42 passed, including exact wording preservation, invalid date/rating/link rejection and proof of public query tenant/publication/deletion/order/limit filters.
- Identity suite: 15 passed, including updated role-based Reviews navigation.
- Typecheck and lint passed. Production build passed.
- Browser: admin authenticated page and all form fields load; settings save succeeds; no records were fabricated to test hosted publication.
- Public homepage: zero reviews hides the section and old placeholder; clean load reported no console errors.
- Responsive measurements at 1920, 1440, 1366, 1024, 768, 430, 390 and 375px showed no page horizontal overflow. Desktop and mobile cards visually inspected; mobile dot navigation and touch swipe changed the active card. Long text expands and collapses. Admin at 390px has no horizontal overflow.
- Synthetic layout text exists only on the development-only `/dev/reviews-preview` route, explicitly labelled as a layout test, never stored/published as a guest review and unavailable in production.

## Main files
- `supabase/migrations/20260924000200_manual_reviews.sql`
- `src/modules/content/reviews.ts`, `reviews-server.ts`, `website-schema.ts`
- `src/components/public/guest-reviews.tsx`, `guest-reviews.module.css`, `homepage-view.tsx`
- `src/app/(public)/page.tsx`
- `src/app/admin/review-actions.ts`, `reviews-panel.tsx`, `reviews-editor.tsx`, `reviews-editor.module.css`, `website-editor.tsx`, `admin-shell.tsx`, workspace route and private homepage-preview route
- `src/modules/identity/admin-navigation.ts`
- Database, input-validation, public-reader and navigation tests; development layout preview.

Booking, tracking, destinations, service schedules, products, media records and SEO behavior were not changed.
