import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertIsolatedDevelopmentTarget } from '../../scripts/isolated-development-target.mjs';
const ref = 'abcdefghijklmnopqrst';
const safe = {APP_ENV:'development', DEVELOPMENT_SUPABASE_PROJECT_REF:ref,
  ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS:'true', NEXT_PUBLIC_SUPABASE_URL:`https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-public', SUPABASE_SECRET_KEY:'synthetic-secret'};
test('explicit isolated development target is accepted', () => assert.doesNotThrow(() => assertIsolatedDevelopmentTarget(safe)));
test('known production cannot be relabelled as development or explicitly opted in', () => {
  const production = 'ybngoppqqiohcduojfyg';
  assert.throws(() => assertIsolatedDevelopmentTarget({...safe, DEVELOPMENT_SUPABASE_PROJECT_REF:production, NEXT_PUBLIC_SUPABASE_URL:`https://${production}.supabase.co`}));
});
test('missing opt-in, credentials, malformed, mismatched and declared production targets fail closed', () => {
  for (const patch of [{ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS:undefined}, {DEVELOPMENT_SUPABASE_PROJECT_REF:undefined},
    {DEVELOPMENT_SUPABASE_PROJECT_REF:'../unsafe'}, {NEXT_PUBLIC_SUPABASE_URL:'https://another.supabase.co'},
    {SUPABASE_SECRET_KEY:''}, {NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:''}, {PRODUCTION_SUPABASE_PROJECT_REF:ref}])
    assert.throws(() => assertIsolatedDevelopmentTarget({...safe,...patch}));
});
test('hosted environments, production mode and communications cannot run development mutations', () => {
  for (const patch of [{APP_ENV:'production'},{VERCEL_ENV:'preview'},{VERCEL_ENV:'production'},
    ...['BACKGROUND_DELIVERY_ENABLED','EMAIL_ENABLED','ADMIN_NOTIFICATIONS_ENABLED','ADMIN_PUSH_ENABLED'].map(key => ({[key]:'true'}))])
    assert.throws(() => assertIsolatedDevelopmentTarget({...safe,...patch}));
});
test('guard errors disclose no supplied values', () => {
  const secret = 'synthetic-never-print';
  assert.throws(() => assertIsolatedDevelopmentTarget({...safe, SUPABASE_SECRET_KEY:secret, APP_ENV:secret}), error => !error.message.includes(secret));
});
test('every hosted development entry point guards before its first client', () => {
  for (const name of ['verify-supabase-development.mjs','verify-public-checkout.mjs','prepare-owner-setup.mjs','initialize-website-content.mts','verify-public-homepage.mjs','verify-public-seo.mjs']) {
    const source = readFileSync(new URL(`../../scripts/${name}`, import.meta.url), 'utf8');
    const guard = source.indexOf('assertIsolatedDevelopmentTarget();');
    assert.ok(guard > 0 && guard < source.indexOf('createClient('), name);
    assert.ok(!source.includes('ybngoppqqiohcduojfyg'), name);
  }
});
