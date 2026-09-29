# Mobile homepage structural fixes

29 September 2026. Local implementation only; not committed or deployed.

## Scope and root causes

- Restored the existing fixed header by removing the mobile and landscape relative-position overrides. The same transparent/solid header, navigation and intersection threshold remain. Browser measurements confirmed header height changes from 68px to 76px across orientation/breakpoint changes; a ResizeObserver refreshes the existing IntersectionObserver only when the measured header height changes. No continuous scroll listener was added.
- The in-flow media region now owns the photograph's height. Its absolutely positioned image fills and is clipped to that exact box; no independent 9/16 image height or negative offset remains. Portrait region: min(177.778vw, 900px); landscape region: max(360px, 56.25vw). The image uses the existing CMS focal points and assets.
- Chosen boundary follows the brief's preferred structure: photograph, then price/Book/Track, then compact Discover, then the white intro. All commercial controls retain normal flow. Charcoal now belongs to a content-sized control region, not unallocated viewport surplus. Discover remains 44px with 8px top margin and 12px bottom clearance plus safe area.
- One grid strategy applies through 900px; the mobile portrait image source follows that same range. Landscape uses the existing desktop photograph. The 700/701px gap discontinuity is removed. Removed the obsolete intermediate hero-v2 mobile overrides, excluded current hero-v2 from legacy mobile height rules and scoped the viewport-sized desktop composition to 901px and above.

No booking dialog, business rules, pricing, availability, backend, database, CMS data/schema, admin, email or independent Live Map implementation was changed. No bookings were submitted during browser checks. Existing unrelated working-tree changes were preserved.

## Verification

All 269 existing tests passed: 17 identity, 96 integrations, 133 database, 23 PostgreSQL concurrency. Zero failed/skipped. Includes existing homepage and booking regression suites. Final lint, TypeScript and production build passed after the observer/CSS edits. Local logs: private/mobile-structural-tests.log and private/mobile-structural-check.log.

Desktop Chrome browser checks used localhost:3000, then the final production build at localhost:3001. Required sizes: 320x568, 375x667, 390x844, 393x852, 430x932; edges/tablet: 699x1000, 700x1000, 701x1000, 768x1024, 820x1180, 900x1200. All passed geometry checks: fixed header, exact image/media bottom equality, commercial content below photograph, 44px Discover, zero gap between hero and white section, no horizontal document overflow. Representative phone/tablet/landscape/desktop screenshots were inspected in the browser.

Production photo heights for the five phone widths: 568.875, 666.656, 693.328, 698.656, 764.438 CSS pixels. At all six tested portrait edge/tablet widths, the photo region is 900px. Price begins 20px below it. Content can grow when needed; the region is not a forced overall hero height.

Phone scroll sequences cover intermediate hero/control states and subsequent sections. Header viewport top remains 0; the existing observer turns it red. Additional edge/tablet scroll checks pass. Menu opens at top and while scrolled, paints above the page, intercepts hits within its panel, and Escape returns focus to its toggle. It retains existing nonmodal navigation behavior. Returning home restores transparent header state. Discover's anchor lands with about 110px clearance below the fixed header.

Repeated height checks at every required phone width (original, -100px, +100px, original) retain identical hero/image/Discover heights. Repeated 390x844 -> 844x390 -> 390x844 cycles retain correct fixed positioning, image boundaries, compact Discover and no overflow. These are viewport simulations, not physical browser-toolbar tests.

Mobile hero, desktop header/hero, planner, all three tour button entries, lower tour link and Explore link open the existing canonical dialog without route navigation. Dialog loads When/Details/Confirm, contains focus in the native modal, and restores focus/body scrolling on close. One tour-bar click during scrolling required a retry after settling; the settled click opened the same dialog. Track Live navigates to /live with the unchanged independent iframe URL and presentation=full.

Desktop 1440x900 retains the existing 900px hero, desktop photograph, side-by-side actions, fixed header and no overflow. Targeted accessibility checks pass: header/text clearance (68px header; first heading text about 86px from top at 390px), visible focus, menu Escape, dialog focus, 44px menu/Track/Discover targets and 52px Book target, reduced-motion behavior. This is not comprehensive accessibility certification.

Performance scope: stable height-change geometry, loaded existing image, no added dependency, polling, continuous scroll handler or duplicate image element. Comprehensive profiling/Core Web Vitals remain unverified. Browser logs contained extension-style asynchronous message-channel errors on development pages; these do not establish an application defect, and their origin was not independently isolated.

## Limitations and remaining findings

- iPhone Safari: PENDING REAL-DEVICE VALIDATION.
- Android Chrome: PENDING REAL-DEVICE VALIDATION.
- Actual browser bars, safe-area hardware behavior, comprehensive assistive-technology/contrast testing and performance profiling remain pending.
- Existing CMS hero alt text describes a landscape rather than the displayed van photograph. Content was not changed in this layout task.
- Dynamic general From price remains the existing BACKEND-DATA LIMITATION. The current availability fallback was observed after today's departures became unavailable; no marketing price was hardcoded.
- No implementation blocker remains in the tested scope. No deployment performed.

Application files changed: src/app/(public)/public.css; src/components/public/homepage-hero.tsx; src/components/public/booking.tsx (header observer only).
