import test from 'node:test';
import assert from 'node:assert/strict';
import {harnessEnvironmentErrors} from '../../scripts/check-harness-env.mjs';
test('synthetic harness refuses Production and service credentials, accepts empty Preview',()=>{
 assert.deepEqual(harnessEnvironmentErrors({VERCEL_ENV:'preview'}),[]);
 for(const env of [{VERCEL_ENV:'production'},{APP_ENV:'production'},{VERCEL_ENV:'preview',SUPABASE_SECRET_KEY:'synthetic'},{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid'},{POSTGRES_URL:'synthetic'},{RESEND_API_KEY:'synthetic'}])assert.ok(harnessEnvironmentErrors(env).length);
});
