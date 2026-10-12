# Sightseeing stops experience — local review, 9 October 2026

Status: implemented locally; not pushed or deployed. The written brief is the design reference, as confirmed by the user. Pre-existing footer/analytics/SEO work was preserved.

## Architecture and content ownership

`SightseeingStopsExperience` renders both homepage discovery and route live modes. Its pure projection joins the published operational stop list to Website Destinations by exact `stopId`. Published operational order is retained; unrecognized live IDs cannot reorder it. Duplicate editorial references are treated as ambiguous rather than guessed. Missing photos/descriptions have explicit placeholders. Existing per-page destination visibility, section visibility, draft previews, publishing and guide URLs remain the source of presentation content.

The homepage passes its published planner stops and visible destinations without any tracking subscription. The route uses its existing `LiveMapEmbed`, one iframe and the existing validated message bridge. The same 45-second message expiry now distinguishes stale data from loading/unavailable data. A stable callback prevents subscription reconnection on page renders. No GPS polling, schema, writes, cron, backend or external map changes were introduced. The existing schedule refresh is unchanged.

Only explicitly confirmed departed nodes are green. Current nodes show a red van marker, next nodes yellow, and other nodes neutral. Parked status suppresses ETA. Stale/unavailable data removes all live progress. Snapshots are not accumulated; skipped stops and loop resets are not inferred. The connecting line stays neutral because the bridge does not supply a complete visited history.

## CMS and copy

Existing Website Destinations fields supply name, photo, alternative text, description and guide link. Operational IDs/order remain map-owned. Existing `homeRoute`, `routePage` and action-label fields are reused; their defaults were updated without changing any saved content or publishing it. The requested fixed “Five stops” subtitle was omitted in favor of the existing dynamic stop-count metadata, avoiding a contradictory claim if the route changes.

The existing daily-ticket section already displays product inclusions and stop count. It was retained rather than duplicating benefits or asserting an unverified “Unlimited hops” entitlement. No CMS schema extension was needed. Edited stop-section headings remain visible when different from the page title; identical headings are available to assistive technology without visually duplicating the title.

## Files changed for this task

- `src/components/public/sightseeing-stops-experience.tsx` — shared interactive cards, live status, accessible detail expansion and carousel controls.
- `src/components/public/sightseeing-stops.module.css` — desktop circles/line, mobile vertical live timeline, native discovery carousel, brand states and focus/reduced motion.
- `src/modules/content/sightseeing-stops.ts` — canonical join and conservative live status projection.
- `src/components/public/homepage-view.tsx` — discover integration only in the existing stops section.
- `src/components/public/route-journey.tsx` — live integration before the unchanged map, schedule and ticket consumers.
- `src/components/public/live-map-embed.tsx` — optional freshness reason in the existing callback.
- `src/app/(public)/public.css` — narrow obsolete stop-list selectors so they cannot style the new nested timeline.
- `src/modules/content/editorial-fields.ts` — existing heading/introduction defaults.
- `src/app/dev/stops-preview/page.tsx` — development-only fixture review, production `notFound`, no database access. Fictional arrays are test fixtures, not operational configuration.
- `tests/components/sightseeing-stops.test.mjs`, `tests/integrations/sightseeing-stops.test.mjs` — targeted rendering/ownership/state tests.
- This report and the local `docs/PHASE_STATUS.md` entry.

## Verification

- `npm run check`: lint, TypeScript and optimized build pass.
- Targeted component/CMS visibility/bridge/state tests: 14 pass.
- Chrome browser checks on shared component fixtures and both integrated page views at 320, 375, 390, 430, 768, 1024, 1440 and 1920 px: no horizontal page overflow.
- Desktop uses a five-column connected grid; mobile discovery uses native horizontal snap scrolling with next-card preview and controls; mobile live uses a connected vertical list.
- Carousel next button, selected detail expansion, Enter activation, Escape dismissal and focus restoration checked in the browser. Parked and stale fixtures checked, with no active parked ETA or stale progress.
- Existing CMS visibility test confirms one route iframe and booking entry survive hiding/showing route/departures sections. Destination link URLs are passed through unchanged. Homepage discovery creates no iframe.
- Actual local `/` and `/route` routes were opened: the homepage retains its unavailable-publication alert; the route retains one map and booking entry while CMS section visibility is unavailable.
- All destination fixture images were confirmed loaded before final screenshots. The independent map can remain unavailable while the published timeline remains visible.
- The shared area uses `data-floating-obstacle`, reusing the existing WhatsApp collision avoidance. No WhatsApp implementation was changed.

## Screenshots

Full integrated page screenshots use local fixture destinations and existing site assets; they are layout evidence, not claims about production content or live GPS:

| Page | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| Homepage | `/private/tmp/sightseeing-stops-review/discover-page-1440.jpg` | `/private/tmp/sightseeing-stops-review/discover-page-390.jpg` |
| Route | `/private/tmp/sightseeing-stops-review/live-page-1440.jpg` | `/private/tmp/sightseeing-stops-review/live-page-390.jpg` |

Confirmed parked presentation: `/private/tmp/sightseeing-stops-review/live-parked-390.jpg` (fictional fixture, clearly labeled).

## Limitations and follow-up

Local CMS credentials are unavailable. Layout/CMS projection tests use fixtures; a real authenticated admin publish and live production-content verification have not been performed. Existing saved headings may differ from new defaults until the owner edits/publishes them. Real map selection messaging must be verified against the hosted map before release; the existing selection protocol and iframe source are unchanged.

The version-1 bridge exposes current, next, last confirmed departure and ETA text, not vehicle movement, arriving/departing phases, a complete current-loop visited history, loop completion or GPS measurement age. The website displays supported states and honest unknown/stale fallbacks. Rendering the remaining states and progress-colored line requires a separately authorized upstream public-contract enhancement. Message expiry measures bridge silence, not GPS age.

iPhone Safari and Android Chrome device environments were unavailable; responsive checks used desktop Chrome viewport overrides. Reduced-motion behavior and focus/contrast rules are implemented; a screen-reader/device audit remains a release follow-up. No deployment or tracking optimization release is authorized by this task.
