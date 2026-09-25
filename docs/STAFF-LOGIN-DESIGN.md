# Staff login visual redesign

Existing route: src/app/auth/sign-in/page.tsx (reached by /admin when logged out).

Changed only page.tsx and added login-form.tsx / login.module.css in that directory. Existing signIn server action, recovery route, Supabase sessions, authorization and RLS remain unchanged by this task.

Reuses public/brand/logo-color.svg and public/images/castle.webp (257 KB source, Next Image responsive optimization). No duplicate asset, CMS query, animation dependency or new color system. Existing brand, cream, border and warning tokens supply colors. Desktop is 50/50 with form capped at 540px. 768–1023px uses tighter panel spacing; below 768px the photo is hidden and the logo/form appear immediately with 20px gutters. Text-only primary action preserves the platform button convention.

No QA defaultValue or hard-coded credential was found in the previous login component. The prior populated screenshot cannot be conclusively attributed from code; browser autofill/previous browser test interaction is consistent with it. Fresh isolated browser contexts verified both fields empty. Native email/current-password autocomplete remains enabled. No password-manager data was deleted.

No Remember me checkbox: existing Supabase cookie persistence is preserved; this task does not change session duration/storage. Accessible labels, decorative field icons, a keyboard-operated show/hide control, visible focus, inline alert, 54–56px controls, loading label, disabled submit and synchronous duplicate-submit guard added. No public registration.

Verification: isolated lint/typecheck/production build passed (root build encountered a Windows file lock from running server). All 17 identity tests passed. Browser checks at 320/390/430/768/1024/1440/1920 verified no overflow, empty fields, show/hide, error and recovery link; desktop/mobile screenshots visually inspected. Synthetic intercepted submission verifies Enter, Signing in state and duplicate guard without hitting Auth. Real credentials, inbox recovery, password-manager autofill and authenticated refresh/logout were not re-exercised; their server implementations are unchanged.

Review preview: http://localhost:3007/auth/sign-in (isolated copy of the current source). No deployment. Unrelated pending auth/email work and user's first-admin SQL edits preserved.
