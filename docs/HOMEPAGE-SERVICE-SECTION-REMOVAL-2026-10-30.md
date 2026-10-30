# Homepage service section removal — 30 October 2026

Owner requested removal of the “More time here. Less time waiting.” homepage section and publication. Removed the complete `p-home-service` section: introduction, CTA, Today at a glance/timetable and embedded map. Existing hero, booking controls, stop section, reviews, partners and footer remain. Route/Live/Your Day components and shared CMS data are unchanged; no database or configuration change. Historical content keys remain available to existing shared consumers.

Changed application file: `src/components/public/homepage-view.tsx`. Updated existing component expectations in homepage-flow, cms-visibility, saved-preview-safety and tour-removal to reflect intentional removal, retaining their booking, preview and visibility checks. No production content write, booking, email, GPS or map-service operation.

Release validation and deployment results will be recorded below. Previous rollback baseline: `06c74b7e5034b6f0df5b56ab05218602363facb6`, Vercel `9DHex8Laz8kkCixZin2kRdmUQZa5`.

CMS reconciliation: removed retired live/timetable text controls from the Homepage editor without deleting stored keys. The still-active departures visibility control now belongs to the existing Route page editor; CMS verification exercises its actual Route consumer. Retired Live copy is not exposed as a new editor because `/live` already redirects to Route.

Validation: all 145 component and 7 CMS verification tests pass after the final reconciliation; the remaining 452 identity/integration/SQL/native tests passed in the full run. Lint, typecheck, optimized production build and production dependency audit pass (zero vulnerabilities). The existing full CMS connectivity check passes against the current active controls. Authorized Chrome visual acceptance remains unavailable from the preceding integration task; no screenshot/visual PASS claimed. Release CI will rerun the complete suite.
