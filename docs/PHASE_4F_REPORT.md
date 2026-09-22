# Phase 4F public accessibility and performance QA

Date: 2026-09-22. Local QA completed with the limitations below. The full Phase 4 audit/checkpoint is the next scope; no payment or production work was started.

## Changes

- Distinct browser titles for booking, the sample day companion, live map and photography credits improve route announcements.
- The mobile navigation closes with Escape and returns focus to its toggle.
- The booking dialog's focus selector excludes disabled inputs and selects.
- Checkout is dynamically imported with an accessible loading status instead of being eagerly included through the shared booking components. Shared booking state and domain rules are unchanged.

No database migrations, environment settings or production services changed. The owner's content remains unpublished.

## Browser evidence

Chrome on Windows, with temporary viewport emulation restored after testing:

| Check | Result |
| --- | --- |
| Tour, booking, sample companion, live map, Explore and credits at 320, 768 and 1440 CSS pixels | No document horizontal overflow; one H1 per route and no images missing alt attributes |
| Homepage at 390 and 1440 pixels | No observed horizontal overflow; mobile screenshot reviewed, hero and booking entry visible |
| Temporary published guide at 320, 390, 768 and 1440 pixels | No observed overflow or broken loaded images; desktop screenshot reviewed |
| Booking dialog keyboard | Initial focus on Close; Shift+Tab wraps to Review selection; Escape closes and restores Book now focus |
| Mobile navigation | Escape from Tour closes navigation and restores Menu focus |
| Skip link | Enter navigates to main-content; next Tab reaches guide content link, bypassing header navigation; visible focus outline reviewed |
| Reduced motion | Emulated preference produces zero transition duration and no animation on the action button |
| Availability feedback | Loading status observed; unpublished tour displays a clear status and keeps reservation disabled |
| Continuous selection | Optimized-build homepage dialog date 2026-09-25 and two guests preserved on client navigation to booking |
| Page announcement | Booking route announces its new distinct title |

The full successful hold/order/reload/release path remains supported by Phase 4D evidence; this pass exercised the changed navigation/loading boundary and unpublished-catalog state without creating another order. It does not claim a fresh end-to-end payment test.

## Performance and automated checks

- Lint, typecheck and all 20 integration tests passed.
- Optimized production build passed in ignored `private/build-phase-4f`; temporary Next/TypeScript configuration was restored. The existing OneDrive cleanup issue in the default `.next` directory remains unresolved and its artifact was left untouched.
- Production output separated checkout into a 7,213-byte minified chunk. Browser inspection found that chunk absent from homepage scripts and present after navigation to booking. This is code-splitting evidence, not a measured network-byte saving or Core Web Vitals score.
- Hero image is preloaded; non-critical destination images use lazy loading and reserved dimensions. The current tracking shell loads no map SDK, GPS requests or simulated positions. Lazy-loading an actual map library remains applicable when Phase 6 introduces it.
- The existing hosted SEO verification passed again against an isolated loopback build with temporary development fixtures. Its initial invocation stopped at the development environment guard because environment variables had not been loaded; the corrected invocation loaded the ignored local environment and passed. Exact temporary content/operator fixtures were removed, leaving owner content unchanged.
- Chrome logs included extension message-channel errors; no application stack was attached to those entries. They were not classified as application failures or silently counted as a clean console.

## Limits and next scope

No Lighthouse score, field LCP/INP/CLS result, formal WCAG certification, physical-device Safari test or full screen-reader session is claimed. Raw browser performance-timeline access was unavailable, so no timing numbers are reported. Production-like hosting and published business content are needed for meaningful launch performance measurement. Contrast over all future photographs and CMS content needs review when those assets are approved.

Next is the Phase 4 audit: consolidate phase evidence, check the agreed visual guardrails and record any remaining acceptance gaps before deciding whether a checkpoint is justified. Manual tour/content entry, owner activation, contact/legal information and launch readiness remain separate outstanding items. Roadmap deviations: none beyond the already recorded fresh-project amendment.
