# Public long-text presentation

29 September 2026. Implemented locally; not committed or deployed.

## Audit

14 logical text categories audited; 6 use the shared ExpandableText component. Counts refer to categories, not repeated cards or page instances.

| Category | Decision |
|---|---|
| Destination previews on Home, Tour and Live | Shared expandable text; destination ID resets state |
| Tour product description | Shared expandable text |
| Homepage introduction body | Shared expandable text |
| Route introduction on Home and Tour | Shared expandable text |
| Explore destination descriptions | Shared expandable text |
| Guest review bodies on Home and Tour | Shared expandable text replaces character-count toggle and bounded scrolling |
| Hero copy | Fully visible; excluded |
| Short subtitles, tags and page leads | Fully visible; excluded |
| Complete destination guide articles | Fully visible reading destination after the separate guide link |
| Tour inclusions | Fully visible; affects purchase understanding |
| How-to and FAQ instructions | Existing behavior retained |
| Live status and map instructions | Existing behavior retained |
| Booking notices, validation and ticket information | Fully visible; excluded |
| Credits, footer and legal information | Fully visible; excluded |

There is no separate attraction or experience content engine requiring another implementation. Notebook cards contain titles/tags/links rather than long descriptive bodies. Navigation and forms are excluded.

## Implementation

One original string renders once in a semantic paragraph or review blockquote. No shortened copy, duplicate measuring element, CMS field, storage write, translation change or schema change was introduced. Full text is server-rendered and remains visible without JavaScript. After hydration, actual scroll height is compared with the computed line capacity. ResizeObserver, viewport resize and font readiness/loading events remeasure it. Replacement text remounts collapsed; destination IDs also reset state.

Defaults: 4 lines below 768px, 5 below 1024px, 6 from 1024px. Callers may supply line limits and localized labels. Read more / Show less is a semantic text-styled button with aria-expanded, aria-controls, a 44px minimum target and visible focus. Expansion uses ordinary document flow without a fixed height, inner scrollbar or animation. Explore destination remains a separate unchanged link.

## Verification

| Check | Result and evidence |
|---|---|
| Homepage destinations | PASS: all four real descriptions clamp; each new destination starts collapsed; separate centre/lake/castle/bridge links retained |
| Read more / Show less | PASS: desktop and mobile expansion reveals the same full text; keyboard Enter/Space toggles; Explore also checked |
| Short text detection | PASS: actual short Home text has no toggle; synthetic 20-character text has none at all eight widths |
| Medium / very long text | PASS: synthetic 445-character and 6,000-character samples respond to width; long sample expands fully (1,715px desktop and over 3,000px mobile), following content moves below it |
| Responsive | PASS: Home and synthetic samples at 320x568, 375x667, 390x844, 393x852, 430x932, 768x1024, 1024x768, 1440x900; expected 4/5/6 limits; no document overflow |
| Content replacement | PASS: changing expanded long sample to short removes the toggle and shows the replacement text |
| Accessibility | PASS for scoped semantic, keyboard, focus, association and state checks; observed 3px focus outline. Full assistive-technology certification not performed |
| CMS / SEO preservation | PASS: original values passed through unchanged, no data writes; SSR tests verify full text once, no-JS visibility and escaping |
| Booking regression | PASS: existing automated booking suites; real local Tour CTA opens the existing three-step dialog with guest/date/departure controls and closes normally. No new booking created |
| Live map regression | PASS: existing automated integration tests and homepage iframe loaded stops/van/arrival panel; no map implementation changes |
| Component tests | PASS: 3 tests via npm run test:components; added to npm test chain |
| Existing complete regression chain | PASS: 269 tests (17 identity, 96 integrations, 133 database, 23 PostgreSQL); 0 failed/skipped |
| TypeScript / lint / production build | PASS: npm run check; targeted lint also passed for new component tests |

The 269-test chain and 3 component tests were run separately (272 passing tests overall). Build and test logs remain local under private/expandable-check.log and private/expandable-tests.log. Synthetic browser fixtures were local-only and did not add a public application route. Browser checks used Chrome viewport simulation. Physical Safari/Android, screen-reader sessions and a delayed web-font download scenario were not separately exercised. The site currently exposes English editorial content; no translated CMS records were edited or invented. Font load handling is implemented; the current system-font rendering was verified.

## Changed files

- src/components/public/expandable-text.tsx
- src/components/public/expandable-text.module.css
- src/components/public/route-preview.tsx
- src/components/public/homepage-view.tsx
- src/components/public/editorial-pages.tsx
- src/components/public/guest-reviews.tsx
- src/components/public/guest-reviews.module.css
- tests/components/expandable-text.test.mjs
- package.json
- docs/PUBLIC-EXPANDABLE-TEXT.md
- docs/PHASE_STATUS.md (append-only task status)

Blockers: none observed for this implementation. Non-blocking findings: physical-device/assistive-technology coverage remains outstanding; progressive enhancement intentionally shows complete text before hydration. Existing unrelated email, SQL and acceptance-report working-tree changes remain separate. Booking engine/dialog, pricing, availability, map/GPS, hero/header, admin and database code were not changed by this task.
