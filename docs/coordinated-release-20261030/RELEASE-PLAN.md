# Focused coordinated candidate — 30 October 2026

Canonical candidate: `/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App-canonical`, branch release/coordinated-20261030, based on verified production/main 1f87febdcb9d7f23e8c5fc180dcce195b990feeb. Original dirty IDE work remains preserved at ../SightseeingShkodra-Web-App-git; never deploy it wholesale.

Scope: existing v1 bridge metadata validation, fresh movement independent of route continuity, validated published-stop fallback, three regression tests and development-only Zod lockfile correction. No GPS processor/reader/store, booking/email mutation, migration or infrastructure is added to the website.

The distinct map candidate is ../live-tracking-app-release. Its release/coordinated-20261030/RELEASE-PLAN.md contains captured managed definitions, tested migration rollback, exact static artifacts and the dependency-safe release sequence. Both exact source commits/deployment IDs belong in its shared release manifest.

Clean locked install, lint, typecheck, optimized build and all 600 tests pass (145 components +23 identity +213 integration +186 disposable SQL +26 native PostgreSQL +7 CMS verification). Full/production dependency audits are clear. Generated next-env.d.ts is not a source repair.

Automatic deployment: verified Vercel "Only build production" guard, Node24, default Next.js commands; feature branches can run GitHub CI but main merge publishes production. Do not create a staging backend or put production secrets into Preview. Current Ready deployment: 381e774NwX34BWS1jjuSaViK6Y3f.

Release gate still fails: actual current Route iframe remains blank/about:blank; parent status/stops unavailable, and the supported viewport override has not changed measured Route width1710. The owner separately authorized replacing exactly the two write-only Production LIVE_MAP bindings with verified existing map project dmqdiazosamyrnkmbtcd; no replacement precedes completion of other gates and a frozen coordinated release record. Local tests and HTTP200 are not hosted acceptance. No production change is made by this candidate or document.

## Owner test-release scope revision

The owner subsequently deferred .app iframe display and responsive .com integration and requested publication for testing before integrating .com. Hosted iframe/mobile acceptance is therefore explicitly deferred, not passed. The focused website changes preserve the existing v1 bridge and server bindings, have no dependency on map migration004, and may publish independently with the existing configuration. The two separately authorized Production binding replacements still require managed access; if browser access fails, retain existing values and report that step pending rather than inventing a successful replacement. No backend/environment is added.
