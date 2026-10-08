// Hosted development commands mutate data. Fail closed before creating a client.
// Project identifiers are public; supplied configuration and credentials are never logged.
const knownProductionRef = 'ybngoppqqiohcduojfyg';
export function assertIsolatedDevelopmentTarget(env = process.env) {
  const reject = () => { throw new Error('Hosted development requires an explicitly approved isolated Supabase target, development mode, complete keys and disabled communications. Production targets are forbidden.'); };
  const ref = env.DEVELOPMENT_SUPABASE_PROJECT_REF;
  if (env.APP_ENV !== 'development' || env.VERCEL_ENV ||
      env.ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS !== 'true' ||
      !ref || !/^[a-z0-9]{20}$/.test(ref) ||
      ref === knownProductionRef || ref === env.PRODUCTION_SUPABASE_PROJECT_REF ||
      env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co` ||
      !env.SUPABASE_SECRET_KEY?.trim() || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      ['BACKGROUND_DELIVERY_ENABLED', 'EMAIL_ENABLED', 'ADMIN_NOTIFICATIONS_ENABLED', 'ADMIN_PUSH_ENABLED'].some(key => env[key] === 'true')) reject();
}
