# Mobile hero responsive stability correction

29 September 2026. Local fix; not deployed. Supersedes the earlier static-layout acceptance for the browser-chrome issue reported by the user.

## Root cause and limits of reproduction

The homepage header was fixed outside document flow. Hero text reserved clearance with a separate 88px padding value, so scrolling could move the headline under the stationary header. The hero also retained min-height:100svh while its image and commercial positions were width-based. Tall viewports therefore left unused dark space after the content. The previous flex content minimum and commercial auto margin obscured that relationship. No hero JavaScript innerHeight, VisualViewport, resize/orientation listener or translateY was found. The only relevant height-driven menu limit is its intentional scrollable max-height; the booking dialog body lock is unrelated and unchanged.

The exact physical Safari/Android browser-chrome behavior has not been reproduced on hardware. In particular, svh is not claimed to track every browser-bar animation; the confirmed issues are the disconnected fixed header and viewport-sized surplus space. Desktop Chrome repeated height and scroll transitions provide supporting evidence for the correction, not physical-device certification.

## Fix

Only src/app/(public)/public.css changed. The visible mobile homepage header now participates in normal flow and reserves its actual token-defined height, including its top safe area. The hero follows with a 20px gap; safe-area top is not counted again in the text layout. The photograph alone extends behind the header to preserve the approved image treatment.

An in-flow grid image area determines the copy/van region from width. The price, booking link, tracking link and scroll indicator follow in document flow. No mobile hero height/min-height depends on viewport height, no commercial auto margin remains, and the 44px scroll indicator cannot absorb spare viewport height. The original photograph, focal point, copy, colors, links and pricing remain unchanged. Narrow landscape 701-900px retains its existing wide composition but receives the same normal-flow header and removal of height-dependent padding/gaps. Desktop rules are untouched. The header intentionally scrolls with the mobile homepage so content cannot pass underneath it.

## Verification

- All five exact widths checked: 320x568, 375x667, 390x844, 393x852 and 430x932. Screenshots inspected at each. Van remains visible and the approved order is retained; short screens scroll to lower controls.
- At each width, tested heights H, H-120, H, H-80, H: 25 states. Document positions of header, headline, supporting text, image, price, Book, Track, indicator and next section had zero movement at fixed width. Header/headline gap stayed 20px. Indicator height stayed 44px. No horizontal overflow.
- Three down/up scroll cycles combined with 430x812/932 changes retained identical document positions and 20px separation. These simulate changing available height; they do not operate actual mobile browser chrome.
- Portrait/landscape/portrait tested at 390x844 -> 844x390 -> 844x310 -> 844x390 -> 390x844 and 375x667 -> 667x375 -> 375x667. No horizontal overflow or header/headline collision; portrait positions restored exactly. Wide landscape height changes also left document positions unchanged.
- At 1440x900, header, headline, price and action geometry match the prior deployed desktop measurements within subpixel rounding after browser reconnection. Typography unchanged.
- Menu open/Escape close, hero /book navigation and authoritative availability were checked. 1 October showed four departures and From EUR10 from the existing source. No reservation was submitted. Tracking link still targets /live and the independent iframe.
- Final full npm test passed 269 tests, zero failed/skipped. First run completed all assertions but hit Windows EBUSY during disposable PostgreSQL directory cleanup; unchanged standalone retry and final full rerun passed. No test weakening or cleanup code changes.
- Final npm run check passed lint, TypeScript and production build. Logs: private/hero-stability-final-tests.log and private/hero-stability-final-check.log. Earlier failure/retry logs retained.

## Outstanding acceptance

Real iPhone Safari and Android Chrome expanded/collapsed browser controls and nonzero physical safe-area behavior remain unverified. Requested PASS/FAIL labels for those hardware checks are FAIL to establish acceptance, not an observed new failure. Full physical acceptance remains blocked on those checks. The existing date-scoped From limitation and CMS image-alt mismatch are unchanged, unrelated findings. No deployment, CMS write, backend, routing, booking/pricing, map or admin changes.
