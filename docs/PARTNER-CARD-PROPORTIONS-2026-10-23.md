# Partner card proportions — 23 October 2026

User screenshot showed a narrow 160x220px production card with logo/name aligned to the top and excess space underneath. Updated only partner presentation CSS, based on the current production stylesheet: desktop card 200px wide with 184px minimum height; mobile 160px wide with 168px minimum height. Flex centers the logo/name/optional-description group vertically; identity remains horizontally centered. Logo uses contain, capped at 120px wide with existing 80/88px slots. Card height can grow for long names/descriptions. Existing CMS records, images, links, heading spacing and centered wrapping collection preserved.

Four existing partner tests, TypeScript, lint and production build passed. Existing development fixture verified at 320/390/768/1440px: group center offsets 0px in both axes, no page overflow. Seven-card mobile case including long name/description also has no overflow. Desktop fixture screenshot inspected in docs/review/partner-proportions-2026-10-23/desktop.jpg; it uses explicitly synthetic layout samples, not changed production content.

Local only. No push, merge, deployment or CMS/backend change. Other workspace changes preserved.

Owner approved publication. Clean release based on production main 0eba80f, with one CSS file and release notes only. Lint, TypeScript, production build and all 461 regression tests passed on Next.js 16.4.2; production dependency audit clean. GitHub CI and production smoke checks pending.
