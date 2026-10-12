# Sightseeing stops deployment — 9 October 2026

Published under the user's explicit “publish the changes” approval at https://sightseeingshkodra.app.

## Release

- Isolated worktree `/private/tmp/sightseeing-stops-approved-release`, based on production `9a50a5371b9ae3cc88ffc93c075a8852770f43d3`.
- Release commit `0cf86d2c01cb1bcd60252a5107a63d399ae909cb`.
- [PR #6](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/6), merged as `ac26b8ed5d6859f3721ecf1ec0d83456a07c5035`.
- [Production deployment](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/FD65Qm7pdmiwXeT89PSypZwGyUR5): `dpl_FD65Qm7pdmiwXeT89PSypZwGyUR5`, Ready, main/ac26b8e and current canonical domain confirmed in the authenticated Vercel dashboard.
- Preview `dpl_C84iWNGS1hcaZoZEhV5w9pC4mMMP` Ready; Preview route smoke check retains configuration-unavailable behavior, one iframe and booking entry. Preview has no production CMS binding; external map embed refused connection in Preview, so no hosted data parity is claimed there.
- Previous production `dpl_2dVe4sSWjxobGqPA53ioCAEQwDeq` / 9a50a53 retained as rollback target. No rollback invoked.

Exactly 12 files published: shared component/CSS/projection, homepage/route integrations, existing map freshness callback, existing editorial defaults, scoped public stop-list selectors, development-only fixture and three test files. Pending analytics/SEO changes and other dirty workspace files were excluded. Original local main was not reset or pulled over its unrelated edits.

## Checks

Clean install, lint, type-check and optimized build pass. Full local disposable suite: **381 pass, zero failures/skips** (34 components, 17 identity, 141 integrations, 165 database, 24 PostgreSQL). One assertion referring to the retired default heading was corrected; checks forbidding invented count/price/departures remain, and an unavailable-stop warning assertion was added. GitHub Project CI passed install/check/full tests/production dependency audit before merge; Vercel Preview passed before merge.

Production browser checks cover homepage and route at 320, 375, 390, 430, 768, 1024, 1440 and 1920 px: five stops on both pages, no horizontal page overflow, one route iframe and no homepage iframe before its existing disclosure is opened. Four existing CMS images load in both modes. Carousel next, keyboard selection, inline destination details, Escape dismissal and focus restoration work. Route map action scrolls to the existing frame without mounting another iframe; external map pan acceptance is not asserted without an upstream bridge acknowledgement. Homepage mobile WhatsApp does not overlap the stops area in the checked viewport.

Read-only HTTP checks: homepage, route, tour, book, FAQ, explore, all four guide URLs, privacy, terms, credits and your-day return 200, with one footer each. Only homepage and route have the new stops consumer. `/dev/stops-preview` returns 404 in production.

## Actual content and limitations

Start/Stop has no published matching destination photo/description, so the explicit placeholder appears. The other four destinations use existing CMS records and existing guide URLs. The published fourth stop's editorial record is named Historic Centre while its operational label is St Stephen's Cathedral; this pre-existing stopId binding was preserved, not silently rewritten. Content owners can review that association in Website Destinations.

The production map renders its existing map/status interface, but the main website's stop projection reports live updates unavailable when no validated bridge snapshot is received. No vehicle state or ETA is inferred from the iframe's displayed text. The previously documented bridge limitations remain: movement phases, full visited history and GPS age are not exposed. No separate map release, tracking optimization, schema change, CMS mutation, configuration change, communication or booking was performed.

Saved CMS content was preserved. The requested new homepage and route headings appear through the revised existing defaults where no saved override exists. “Unlimited hops” was not added as an unverified ticket claim; existing product inclusions remain intact.

Physical Safari/Android and screen-reader acceptance, real CMS publishing, moving-vehicle bridge acceptance and actual booking lifecycle/delivery tests were not performed in this UI release.

## Evidence

- [Published homepage desktop](/private/tmp/sightseeing-stops-review/production-home-desktop.jpg)
- [Published homepage mobile](/private/tmp/sightseeing-stops-review/production-home-mobile.jpg)
- [Published route desktop](/private/tmp/sightseeing-stops-review/production-route-desktop.jpg)
- [Published route mobile](/private/tmp/sightseeing-stops-review/production-route-mobile.jpg)
- Browser matrix `/private/tmp/sightseeing-stops-review/production-responsive.json`.
- HTTP results `/private/tmp/sightseeing-stops-review/production-http.json`.
- Install/check/full-test logs and PR/merge records in `/private/tmp/sightseeing-stops-review/`.

This report is local deployment evidence, not another production commit.
