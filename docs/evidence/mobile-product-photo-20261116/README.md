# Mobile product photo alignment — 16 November 2026

Local only. No push or deployment.

The active/inactive cards had equal outer heights, but each independently allocated its remaining height to its photograph. The inactive card’s seasonal availability panel makes its body taller, leaving a shorter photo. On the live 390×844 homepage this measured about 254px versus 201px; at 360×800, about 221px versus 139px.

The existing phone-only carousel CSS now shares two grid rows across cards with subgrid: one flexible photo row and one naturally sized body row. Photos match and text/price/action areas align. The shared row reserves enough room for the taller body rather than clipping its availability message or forcing a fixed image height. The 64px existing photo minimum and stable hero viewport budget remain. Desktop/tablet styles, cropping rules, grayscale and product behavior are unchanged.

A development-only fixture uses the existing HomepageHero/ProductBookingCards components with active and seasonal-break products. Chromium/WebKit local checks cover four phone portrait sizes, landscape, tablet and desktop (14 cases). A browser-only application of the same two CSS rules to the actual public homepage content verifies the real product copy and images in both engines (12 cases), including unchanged desktop/tablet geometry and stable sizes while scrolling. These browser-only styles do not change the hosted website.

All 198 component tests, lint, type checking and Webpack production build pass. Physical iPhone hardware was not available.

Actual-content mobile comparisons: before-webkit-active.png / before-webkit-inactive.png and candidate-live-webkit-active.png / candidate-live-webkit-inactive.png. Local compiled-component screenshots: after-webkit-active.png / after-webkit-inactive.png. Measurements: verification.json, before.json, after.json, live-candidate.json.
