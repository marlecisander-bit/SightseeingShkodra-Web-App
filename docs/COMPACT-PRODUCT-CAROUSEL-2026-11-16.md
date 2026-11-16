# Compact mobile product carousel — local review

Status: implemented locally following approval of the Compact carousel proposal. No push, merge or deployment. Work is in the user-authorized current folder; the canonical folder is unavailable. Existing unrelated working changes remain intact.

## Causes and changes

The previous mobile card composition combined a flexible viewport-height budget, seven/eight default amenities, and an expanded inactive-product availability panel. Different description/status lengths made content and action rows appear inconsistent and left excessive space in the active card. The last slide also lacked sufficient trailing rail space to align to the first slide's left inset.

The embedded phone carousel now uses six shared CSS subgrid rows: 16:9 photograph, title, description, two existing feature facts, compact information/disclosure, and a price/action footer. Content determines height; there is no fixed card height or clamped mobile description. Extra trailing space lets both ends align to the same inset. The hero's phone minimum viewport height no longer stretches this composition. Photos retain existing CMS sources and cropping; the inactive photograph retains grayscale.

The details sheet contains the complete saved description, reservation information, all configured amenities and existing availability explanation/link. Both the amenities link and inactive Tour details action use that sheet, including Escape dismissal, scroll lock and restoration of focus to the opener. Active cards retain the existing booking link/dialog path. Desktop/tablet retain all amenities, duration and expanded availability presentation. There are no content, pricing, booking, CMS, tracking or independent map changes.

## Verification

- Component suite: 200 passed. Additional final focused run: 2 passed. Coverage includes both details openers, saved seasonal content and action link, all amenities, empty feature arrays, truthful price/reopening data, dismissal/focus, and retained active booking links.
- Lint and Next type generation/TypeScript passed.
- Production build using `npm run build -- --webpack` passed. Default Turbopack build stalled reading an unrelated compressed/dataless iCloud duplicate at `node_modules/@img/sharp-libvips-darwin-arm64/lib/index 5.js`; that attempt was stopped and the dependency file was left untouched.
- Visual checks in the user's existing Chrome profile: 375×667, 390×844, 430×932 and 360×800; also 667×375 landscape, 768×1024 tablet and 1440×900 desktop. Portrait price/actions remain visible; first/last slide alignment and matching photo/footer geometry were inspected. Pagination, opening/closing details, and mobile menu opening/closing were checked. Landscape retains the existing larger-screen composition and requires normal vertical scrolling to the cards/actions.
- Native touch swipe could not be reliably exercised through the desktop input driver. Existing carousel gesture implementation is unchanged; pagination was exercised. No physical iPhone, Safari toolbar or real touch-device acceptance is claimed.
- Local public homepage cannot load published CMS content without its missing Supabase/operator environment. Visual checks therefore use the existing development-only `/dev/product-photo` fixture, with enabled winter ribbon, active/inactive products, seven/eight saved feature keys and the local lake photograph. The fixture disables booking submission. End-to-end checkout and production CMS imagery require a configured preview before publication.

## Review evidence

Screenshots are native Chrome captures, including device toolbar and DevTools. Evidence is under `evidence/compact-product-carousel-20261116/`:

- `mobile-375-active.png`, `mobile-390-active.png`, `mobile-390-inactive.png`
- `mobile-430-active.png`, `mobile-430-inactive.png`, `mobile-360-active.png`
- `mobile-details.png`, `tablet-768.png`, `desktop-1440.png`
- `tests.log`, `focused-tests.log`, `lint.log`, `types.log`, `build-webpack.log`

The approved proposal remains in `work/visualizations/mobile-product-card-preview.html`. Earlier published-layout screenshots remain in `evidence/mobile-card-balance-20261116/`; they are historical captures, not a matching-fixture before/after pair.
