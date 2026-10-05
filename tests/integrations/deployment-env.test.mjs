import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=new URL('../../scripts/check-deployment-env.mjs',import.meta.url);
test('Vercel production build rejects absent bindings and prints names, not secrets',()=>{
 const r=spawnSync(process.execPath,[fileURLToPath(script)],{env:{VERCEL_ENV:'production',SUPABASE_SECRET_KEY:'never-print-this'},encoding:'utf8'});
 assert.equal(r.status,1);assert.match(r.stderr,/PUBLIC_OPERATOR_ID/);assert(!r.stderr.includes('never-print-this'));
});
test('configured Vercel production and non-production builds retain existing workflow',()=>{
 for(const env of [{VERCEL_ENV:'preview'},{VERCEL_ENV:'development'},{},Object.fromEntries(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','PUBLIC_OPERATOR_ID','PUBLIC_HOMEPAGE_PRODUCT_SLUG','CHECKOUT_SESSION_SECRET','NEXT_PUBLIC_SITE_URL','APP_ENV'].map(k=>[k,'configured']).concat([['VERCEL_ENV','production']]))]){
  const r=spawnSync(process.execPath,[fileURLToPath(script)],{env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 }
});

