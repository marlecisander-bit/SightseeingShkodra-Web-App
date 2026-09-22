# Phase 4A - Homepage structured content

Date: 2026-09-22. Result: data connection implemented and verified. The actual operator has no products, stops, departures or content pages yet; manual business content entry is intentionally deferred by the user. Phase 4B is next. No production deployment or Phase 4 checkpoint.

## Implementation and configuration

The homepage preserves the Phase 3.5 section order and booking CTA. Published product facts, ordered boarding stops and seven reserved CMS slots now come from development Supabase. Drafts, archived records and other operators' data are excluded. Plain text is escaped, with bounded display excerpts. Local licensed photography remains in place.

`PUBLIC_OPERATOR_ID` and `PUBLIC_HOMEPAGE_PRODUCT_SLUG` are trusted server configuration, never visitor inputs. The ignored local environment is bound to the existing owner operator and slug `shkodra-day-tour`; `.env.example` documents these settings. Privileged credentials remain server-only. The request uses Next `connection()`, request-scoped React caching and no-store reads, with five-second timeouts for each upstream read. Price and today's scheduled departures come from the existing booking availability domain; React does not calculate prices or remaining capacity. The operator's timezone determines today. Empty and unavailable states are distinct.

Migration `20260922000500_public_homepage_snapshot.sql` adds `read_public_homepage_v1`. It exposes only the selected published van-tour product, its stops and approved published plain-text content slots. Execute is restricted to service_role; existing table RLS and grants are unchanged. Applied to development Supabase after a successful retry of the initial connection timeout.

## Content entry later

Create the approved tour in Products with slug `shkodra-day-tour`, add its boarding stops and departures, and publish it when ready. In Website content, these published slugs supply homepage copy:

| Slug | Homepage use |
| --- | --- |
| homepage-hero | Main heading, introduction and metadata |
| homepage-intro | Ticket explanation heading and body |
| homepage-final | Final call-to-action heading and body |
| explore-centre, explore-castle, explore-lake, explore-bridge | Destination story headings and text |

No business values were imported from the reference website. No action is required now to continue development. Pricing configuration still uses the shared domain rules; the current catalog UI does not yet provide a price editor. Age-based fares are outside this phase. Public booking controls remain clearly labeled previews and do not create holds or orders. Other public routes remain Phase 3.5 previews, pending their own phases. Interactive maps and live tracking remain unavailable; published stop coordinates link to OpenStreetMap.

## Verification

- All 107 tests passed: 15 identity, 11 integration, 67 database and 14 native PostgreSQL tests. New tests cover tenant/publication filtering, safe DTO projection, malformed responses, quote failures, withdrawal and RPC permissions.
- `npm run check` passed lint, TypeScript and production build. `/` is dynamic; other public preview routes retain their previous rendering mode.
- `scripts/verify-public-homepage.mjs` verified hosted Supabase projection, shared pricing quote, draft/foreign isolation and anonymous RPC denial. A separate loopback production-build server verified escaped CMS text and removal of archived content on the next HTTP request.
- Chrome verified a populated synthetic homepage, displayed price/departure and boarding coordinates, plain-text script escaping, mobile hero/route layout and no horizontal overflow at 360, 390 and 1280px. These are desktop emulations, not physical-device or Core Web Vitals certification.
- Synthetic fixtures were removed and the real owner workspace was confirmed empty. The first browser harness lacked writable stdin; its two exact fixture operators and children were cleaned explicitly after stopping only its two Node processes. Browser mode now requires an interactive terminal before creating fixtures.
- The real local homepage was checked with the owner's binding: unpublished-tour notice, no price, no timetable and illustrative destinations. Local preview remains at http://127.0.0.1:3000.

## Changed areas and remaining scope

Changes are confined to the homepage, public booking-bar facts and responsive styles, published-stop component, content server/DTO modules, optional availability-request timeout, one migration, two test files, the development verification script, environment example and phase documentation. Unrelated README/AGENTS edits are preserved.

The only roadmap amendment is the user-approved website reference and deferred manual content entry recorded in DECISIONS.md. The homepage connection is ready for real publication, but live business content acceptance remains pending that entry. Phase 4B product-page integration can proceed; booking/payment/tracking integration and the full Phase 4 audit remain future scope.
