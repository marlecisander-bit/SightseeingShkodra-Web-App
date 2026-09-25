# Widget action bar centering

2026-09-24. Layout-only change; no control handlers or tracking logic changed.

Audit: all public live maps share LiveMapEmbed (homepage, live, tour/companion placements). Its recovery controls were left aligned. Inactive SharedMap has per-vehicle selection buttons, not a bottom toolbar. RoutePreview is a destination list, not a bottom toolbar. No analytics chart/action-bar implementation exists. Admin CMS toolbar is a page editor, not a map/chart control bar, and stays unchanged.

Reusable src/app/widget-controls.css is imported by the root layout. Use interactive-widget on the positioned widget container, widget-action-bar for intrinsic-width centered wrapping controls, widget-action-bar--overlay for an absolute centered bar inside that container, or widget-action-bar--full for a full-width bar with centered controls. Minimum touch height is 44px. LiveMapEmbed recovery controls use this utility everywhere.

The Find Me / Find Van / Route / Stops bar is inside the independent cross-origin Netlify iframe. Parent CSS cannot style it. Audited the user-supplied sibling Sightseeing Shkodra Map App: .embed-mode sets a fixed width while tourist-layout can keep a left edge inset. Added css/widget-controls.css and its link/class in live-map.html in that source project. A scoped final rule resolves earlier embed/mobile overrides using left:50%, right:auto and translateX(-50%), four equal grid columns and safe-area-aware maximum width. Existing buttons/icons/colors/active states and JavaScript are unchanged. The map fills #app, which is its own iframe viewport, not the parent page viewport.

Verification: local map source served on 127.0.0.1:3011. Both its bottom bar and this website's recovery bar measured exactly 0px center offset at 320,375,390,430,768,1024,1440; fully contained at every width. Checked initialization, resize and reload; Route active state toggled correctly. Desktop and mobile screenshots inspected. GPS remained in locating state in the local source preview; no GPS/ETA accuracy claim. Typecheck/lint passed; integration suite result recorded in phase status.

Publication boundary: website utility is active on localhost. The hosted map still serves its existing CSS until the independent map project is published. No Netlify deployment performed and the website still points at the existing independent map URL. Publish the map project's live-map.html and css/widget-controls.css together through its normal release process; no data migration needed.

## Authorized hosted publication

User approved publication. Netlify deploy 6ab4f2992136aa205e5470b2 is live; previous deploy 6ab2613ad3fad446e0efa95b provides rollback. Reused the production SHA manifest for all 104 files and changed only css/live-map/tourist-layout.css. No local tracking code or config was deployed. Actual homepage embedded bar changed from -93px to 0px offset. Published embed checked at all seven requested widths, all centered/contained; live map and ETA visually rendered. This supersedes the publication boundary above.
