# Live Map iframe integration — 30 October 2026

Local changes ready for coordinated code review. **Visual acceptance BLOCKED**: authorized computer-use inventory returned no browsers and “The browser access host is unavailable”. No responsive screenshots, overflow measurements, touch/keyboard acceptance or exact local website/map browser PASS is claimed. No push, commit, merge, deployment, production settings, GPS injection, booking or email operation.

## Canonical sources and scope

Website: `SightseeingShkodra-Web-App-canonical`, main baseline `8e1c0fd3fdc50ec47c614905ed293842d18c4d64`, initially clean. Map: sibling `live-tracking-app-release`, master baseline `b80768d913dd62a24caea5db806c07fb50864f6a`, initially clean and unchanged by this task. Latest map receipt inspected: `reports/RESTORE-SELECTED-CARD-RELEASE-20261030.json` (deployment `6ae4ba0b2d9172e2c14cb006`). Movement review and coupled publication receipt also read. The restored owner-selected card supersedes earlier presentation snapshots; no card or van artwork replacement. Original mixed IDE and historical canonical-map workspaces preserved.

Read website AGENTS, roadmap, decisions, phase status and installed Next use-client guidance. Scope follows the user’s local integration request and existing shared-tracking amendment. No roadmap change.

## Changed files

- `src/modules/tracking/journey-bridge.ts`: reusable transport lifecycle, exact origin/source validation, existing bounded v1 parser, rejection of expired phase payloads, upstream validity timer, handshake retry after expiry, reload reset and complete timer/listener disposal. Requests carry additive version 1; legacy valid responses remain accepted. No resize message or wildcard target.
- `src/components/public/live-map-embed.tsx`: bridge readiness for every placement, including embeds without a journey consumer; iframe load resets handshake rather than declaring readiness. Selected stop is replayed after readiness/reload. Quiet connection banner, existing retry/external link, title and compact interaction gate retained. Connection failure does not assert vehicle offline.
- `src/components/public/live-map.module.css`: context-specific reserved compact/full heights, dynamic viewport and safe-area allowance, short-landscape sizing; existing clipping, focus and scroll gate retained. Removed competing fixed mobile height rules.
- `src/components/public/homepage-map-disclosure.tsx`: reserve compact height while lazy component code loads.
- `src/components/public/use-map-status.ts`: reuse bounded metadata validation for the legacy public-status projection; version the existing request. Existing presentation-only request interval retained, no tracking polling/subscription added.
- `tests/integrations/journey-bridge-lifecycle.test.mjs`: synthetic fake-clock regression for spoofed origin/source, malformed/expired payloads, expiry/retry, reload recovery, remount and cleanup.
- This report and phase-status entry.

Homepage, Route, Your Day and retained LiveView consumer inspected. Homepage mobile intentionally uses the existing editorial stop gallery; desktop uses the shared tracker. Website movement, stops and ETA remain upstream projections. Parking grace, provider observation time, continuity and confirmed visits remain unchanged; tests cover their existing semantics. No ETA engine, tracking subscription, GPS history, credentials, schema, infrastructure or environment changes.

Map already owns ResizeObserver/Leaflet invalidation, safe-area dock, bounded panels, reduced motion and follow-vehicle framing (`responsive-presentation.js`, `journey-framing.js`, responsive CSS). Those implementations were inspected and retained, not certified visually. Selected-stop framing with open panels and short viewport geometry still needs browser acceptance.

## Verification

Baseline: 15 relevant tracking/route integration tests and six journey component tests passed before editing. Final website component suite: 145 passed; integration suite: 217 passed, including new lifecycle test. Existing parent/home/Route consistency, parking grace, expiry and source-clock assertions pass. Website lint, Next type generation/TypeScript and optimized production build pass. Diff whitespace check passes. Generated next-env changes restored to baseline.

Unchanged canonical map: full `npm test`, lint, worker TypeScript and pinned static build pass. Existing harmless MODULE_TYPELESS_PACKAGE_JSON warnings remain. Logs are `/private/tmp/iframe-{components,integrations,final-check}.log` and `/private/tmp/iframe-map-{baseline-tests,lint,types,build}.log`. Broader website database/native suites not rerun for transport/layout-only changes.

## Remaining acceptance

Repeat-request verification on 30 October: preserved the existing local implementation and reran website component tests (145/145), integration tests (217/217), lint, typecheck and production build successfully. Canonical map full tests, lint, worker typecheck and pinned 123-file build also passed, with its source worktree still clean. Repeat authorized computer-use discovery returned no connected browsers and “The browser access host is unavailable”; visual acceptance remains blocked. Recheck logs: `/tmp/iframe-recheck-{components,integrations,check}.log` and `/tmp/iframe-recheck-map-{tests,lint,types,build}.log`. Restored only the generated Next type-import paths to their initial state after building. No additional application edits were needed in this verification pass.

Reconnect authorized Chrome and run both exact local candidates together at 360, 390, 768, 1024 and 1440px plus short landscape. Check standalone/iframe, panel open/closed, resize/orientation, selected-stop framing, navigation/remount, keyboard, touch scrolling, loading/bridge failure/recovery, attribution, header/booking/WhatsApp/dock/safe-area collisions and no horizontal overflow. No independent browser automation or security workaround used. Browser geometry regression coverage remains pending; jsdom/fake-clock tests cannot establish visual correctness. Physical device freshness/cadence and stationary suppression limitations from the movement review remain unchanged.

Ready for coordinated source review: YES. Visual acceptance remains outstanding. Roadmap deviations: NONE.

## Publication authorization

The owner subsequently requested “publish the changes”. This authorizes publication of these website-only changes through the existing GitHub/Vercel integration with the Chrome acceptance limitation retained; it does not mark visual acceptance passed. Independent map source/deployment, production configuration, database, scheduler and communications settings remain unchanged. Rollback baseline: website main `8e1c0fd3fdc50ec47c614905ed293842d18c4d64`, successful Vercel deployment `9saoG5wVWNzwbeV2Xuex6o8nNx62`. Remote main matched the baseline before preparation. Publication results will be recorded separately.

Release validation: clean locked install, all 604 tests (145 components, 23 identity, 217 integrations, 186 disposable SQL, 26 native PostgreSQL, 7 CMS verification), lint, typecheck and production build passed. Production dependency audit found zero vulnerabilities. Logs: `/tmp/iframe-release-{install,tests,audit,check}.log`.
