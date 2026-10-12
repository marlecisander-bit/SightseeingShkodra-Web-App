# Homepage hero V2 published — 12 October 2026

Owner explicitly approved publication after local review. [PR #11](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/11) merged source 82230ca6d8d6aef62f814b87aac219bd8e2f4129 into main d6f3c5bb7e69f2865f36787b852cb2546e0efd73. [Vercel production deployment](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/DkcdHMXAbTCmjwh36f2Cm5pkvDk3) reports Ready and serves sightseeingshkodra.app. Prior ready deployment 9yo6sCjbJ9sFu6mTDC9xBJFzyjAP retained; no rollback needed.

Exactly five scoped files from main 79198a6: HomepageHero, its CSS module, homepage hero component test, V2 local review report and phase checkpoint. Original dirty workspace unchanged except task files/evidence. Booking widget and shared booking code are byte-identical to the baseline; no backend/API, CMS schema/record, environment, scheduler/provider or independent map change. This publishes layout and existing CMS benefit consumption only. Saved wording/action labels remain unchanged; local proposed copy, Wi-Fi and synthetic prices were not published as CMS configuration.

Release candidate lint/types/build and local production start HTTP 200 pass; all 389 tests pass (43 components, 17 identity, 140 integrations, 165 disposable database, 24 PostgreSQL). Production dependency audit zero vulnerabilities. GitHub PR checks 3/3 pass, including Project CI and Vercel Preview. Preview correctly displays the configuration-unavailable shell without production CMS bindings.

Production nine-width Chrome checks (320/375/390/430/768/1024/1280/1440/1920) pass: zero horizontal page overflow, benefit/card separation, >=44px targets, red hero action, overlaps 48/56/64px. Real CMS photograph/headline/actions and next-bookable dated EUR10 fare render. Desktop/mobile screenshots visually inspected. 844x390 landscape has no overflow. Header booking action returns after scrolling; mobile menu retains existing navigation.

Live booking smoke: 1 adult + 1 child + 1 infant prevents removing last adult; one existing dialog retains 13 October date/counts, shows four available departures and zero-seat infant label. Selecting 09:00 shows canonical EUR18 total for three guests. Continue was not activated: no hold, customer data, reservation or provider communication. Escape closes the existing dialog. Real seasonal setup and full reservation transaction remain outside this read-only smoke.

Read-only HTTP checks: Home/Route/Book/Explore/FAQ/Your Day/four guides/Privacy/Terms 200, sitemap XML parses with nine URLs, robots 200, Tour exact 301 to /route. Map/GPS code untouched; no tracking accuracy certification. Physical Safari/Android, native virtual keyboard/calendar behavior and authenticated CMS publication mutation NOT VERIFIED. Numeric CLS evidence belongs to the earlier optimized local fixture, not production instrumentation.

Evidence: /private/tmp/hero-v2/live/{320,375,390,430,768,1024,1280,1440,1920}.jpg, responsive.json and booking-state.txt; production-before.json/production-after.json; release-{check,tests,audit,start}.log. Live screenshots show actual saved content/pricing.

This post-deployment evidence is local and was not redeployed. Local unrelated files/configuration and original branch remain preserved.
