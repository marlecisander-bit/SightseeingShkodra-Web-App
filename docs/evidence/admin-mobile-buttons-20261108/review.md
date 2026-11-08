# Admin mobile button review — 8 November 2026

Local presentation changes only. Existing dirty work preserved; canonical folder absent, existing project used. No publication, hosted writes, booking changes or Live Map changes.

Removed inherited form-button margins that compounded flex/grid gaps. Mobile controls use compact 13px text and 8px/12px padding with 44px minimum height. Removed unnecessary full-width filter/catalog/route-stop actions; product tabs and Website toolbars wrap naturally. Shared editor actions retain equal columns, with explanatory status text occupying its own row. Review/partner actions stop stretching across spare space. Mobile submenu rows use smaller gaps/padding while retaining descriptions and touch height.

Chromium synthetic fixtures checked at 320×844, 390×844 and 768×844: overview, bookings, operating calendar, Website, More, email, reviews, partners, notifications and Products preview. All 30 cases had scrollWidth equal to viewport width; no visible button shorter than 44px. Expanded Website editor and Website tools submenu visually inspected at 390px. Fixtures block real writes; these are not authenticated live-data or physical Safari acceptance.

183 component tests passed. Lint, route generation, TypeScript and production build passed after final submenu spacing refinement. Existing notification release artifact was not regenerated: this task is separate scope.
