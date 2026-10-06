// Vercel injects these values at build time. Print names only, never values.
export function missingProductionEnvironment(env) {
  if (env.VERCEL_ENV !== 'production') return [];
  return ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY','PUBLIC_OPERATOR_ID','PUBLIC_HOMEPAGE_PRODUCT_SLUG',
    'CHECKOUT_SESSION_SECRET','NEXT_PUBLIC_SITE_URL','APP_ENV'].filter(key => !env[key]?.trim());
}
const missing = missingProductionEnvironment(process.env);
export function previewConfigurationErrors(env) {
  if (env.VERCEL_ENV !== 'preview') return [];
  const errors = [];
  if (['BACKGROUND_DELIVERY_ENABLED', 'EMAIL_ENABLED', 'ADMIN_PUSH_ENABLED', 'ADMIN_NOTIFICATIONS_ENABLED', 'SITE_INDEXING_ENABLED'].some(key => env[key] === 'true')) errors.push('Preview communications and indexing must be disabled');
  if (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    // Compare an explicitly allowed test project with the known production project.
    // These identifiers are not credentials. Never print supplied values.
    const expected = env.PREVIEW_SUPABASE_PROJECT_REF;
    const production = env.PRODUCTION_SUPABASE_PROJECT_REF;
    if (!expected || !production || expected === production ||
        env.NEXT_PUBLIC_SUPABASE_URL !== `https://${expected}.supabase.co` ||
        !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_SECRET_KEY) {
      errors.push('Preview requires complete isolated Supabase bindings and distinct PREVIEW_SUPABASE_PROJECT_REF / PRODUCTION_SUPABASE_PROJECT_REF');
    }
  }
  return errors;
}
const previewErrors = previewConfigurationErrors(process.env);
if (previewErrors.length) {
  console.error(previewErrors.join('; '));
  process.exitCode = 1;
}
if (missing.length) {
  console.error(`Vercel production configuration missing: ${missing.join(', ')}. Add these in Project Settings > Environment Variables > Production, then rebuild.`);
  process.exitCode = 1;
}
