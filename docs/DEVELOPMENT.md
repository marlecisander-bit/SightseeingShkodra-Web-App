# Development on macOS

## Daily Mac workflow

Open `/Users/aleksandermarleci/Desktop/Projects/SightseeingShkodra-Web-App-git` in VS Code. Keep the ZIP folder as an archive. Read AGENTS.md, Roadmap V4, DECISIONS.md and PHASE_STATUS.md before changes; use the Next.js guides shipped with the installed package before editing framework code.

```sh
node --version
npm --version
git status --short --branch
npm ci
npm run dev
```

Use http://localhost:3000; the independent map permits that origin. Stop the foreground server with Control-C. npm ci uses the lockfile and replaces node_modules; it must not rewrite the lockfile. Do not run npm audit fix --force.

A working public shell does not imply working bookings. For functional development, .env.local must privately contain an isolated Supabase URL, publishable key, server secret, synthetic operator/product identifiers, checkout-session secret and correct local site URL. Follow .env.example for exact names. Keep communications off. Never paste secrets into chat, screenshots, commands, commits or reports. Confirm `.env.local` and `private/` are ignored with `git check-ignore .env.local private/example.json` before creating them. Never reuse production service credentials for a development environment.

Run ordinary safe checks:

```sh
npm run check
npm test
npm audit
npm audit --omit=dev
```

These validate lint, types, build and isolated automated tests. Do not run hosted fixture, owner-setup or content-initialization scripts merely because their names say development: inspect target guards and mutation behavior first. The six hosted development entry points now reject the known production project before creating a client. Privately set DEVELOPMENT_SUPABASE_PROJECT_REF to an approved isolated project and explicitly set ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS=true only for a reviewed run; keep it false otherwise. APP_ENV must be development, keys must be present and all communications disabled. This guard does not prove key provenance: confirm keys belong to that isolated project. These commands still create/delete synthetic records, generate owner links or initialize content; they are not daily checks.

## Secure Git

Browser sign-in and terminal authentication are separate. Existing GitHub Desktop includes GCM. This clone uses the installed GitHub Desktop GCM helper. To reproduce that repository-local setting:

```sh
git config --local credential.helper '!"/Applications/GitHub Desktop.app/Contents/Resources/app/git/libexec/git-core/git-credential-manager"'
```

Authenticate through its private browser flow. Never provide a token in chat or embed it in a remote URL.

Before syncing:

```sh
git status --short --branch
git remote -v
git fetch --all --prune
git log --oneline HEAD..origin/main
git rev-list --left-right --count HEAD...origin/main
```

On main, use `git pull --ff-only` only with a clean tracked working tree and no local divergence. If edits, stash, other branches or divergent commits exist, inspect and preserve them before deciding; do not reset, discard or blindly stash. The currently preserved maintenance branch, stash and readiness documents are intentional local work.

For approved changes use an explicit branch, stage named files after inspecting their diffs, and inspect `git diff --cached` before committing. Never `git add .` without reviewing untracked/ignored boundaries. Commit/push require authorization; pushing can trigger external deployments. Keep .env.local outside Git.

## Services and releases

Next.js runs on Vercel; Supabase supplies database/Auth/Storage/Realtime; Resend sends transactional mail. The live map is a separate Netlify application and repository. Production currently uses one Supabase minute cron to invoke protected Next.js workers; do not create another scheduler or downgrade cadence to Hobby Vercel cron.

Preview requires its own isolated Supabase backend and Preview-scoped bindings. Keep email, push, notification and background-delivery flags off. Production Auth redirects were corrected under separate approval on 8 October 2026; preserve those settings. Preview map embedding requires an approved exact origin in the independent map's CSP, or use link/mock checks.

Before an approved release: verify branch/commit/diff, npm ci, npm run check, npm test, production dependency audit, environment scopes, target project/domain, and authorization. After release verify deployed commit, page health and appropriate controlled functionality. Passing a build alone is insufficient.

Rollback means an explicitly approved previous Vercel deployment or a reviewed Git revert/release. Never assume reverting code reverses database migrations. Confirm schema compatibility and rehearse database restore only in an isolated backend. The old Netlify main URL is currently unavailable and cannot be assumed to be a rollback target.

## Troubleshooting

- node/npm missing: open a login terminal or `source ~/.zprofile`, then check PATH; do not reinstall first.
- admin 503: isolated Supabase configuration is missing; do not fill it with production secrets.
- map blocked locally: use localhost:3000; do not weaken CSP globally.
- Git username error: inspect configured credential helpers and complete private GCM login.
- npm ci fails: check Node 24, lockfile and network; do not delete/recreate the lockfile reflexively.
- schema counts differ: compare catalogs and migration effects; do not blindly apply historical migrations.
- emails delayed: inspect worker heartbeat, queue failures and existing Supabase cron/HTTP results; never send real customers a debugging test.

In everyday terms: GitHub holds the source history, this Mac is the workspace, Vercel runs the website, Supabase holds its operational state, Resend sends mail, and the independent map remains its own service. Updating one does not prove the others are ready.

Guarded commands: verify-supabase-development.mjs, verify-public-checkout.mjs, verify-public-homepage.mjs, verify-public-seo.mjs, prepare-owner-setup.mjs and initialize-website-content.mts. Each checks the shared isolated-target guard before creating a client. The ordinary npm test suite does not run these hosted commands.
