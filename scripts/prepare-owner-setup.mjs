import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createClient} from '@supabase/supabase-js';

// Explicit development bootstrap only. Never expose link generation as a public endpoint.
assert.equal(process.env.APP_ENV, 'development');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://ybngoppqqiohcduojfyg.supabase.co');
const email = process.argv[2]?.trim().toLowerCase();
assert.ok(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Supply the authorized owner email.');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {auth:{persistSession:false, autoRefreshToken:false}});
function ok(result) {if(result.error)throw new Error(`Setup failed: ${result.error.code ?? result.error.status}`);return result.data;}
let user;
for(let page=1;;page++) {
  const result=ok(await client.auth.admin.listUsers({page, perPage:100}));
  user=result.users.find(u=>u.email?.toLowerCase()===email);
  if(user || result.users.length<100)break;
}
assert.ok(user, 'An existing authorized account is required.');
const memberships=ok(await client.from('staff_profiles').select('id').eq('auth_user_id',user.id)
  .eq('operator_id','9185510e-0e82-4027-ab1c-8604dad5c92e').eq('role','owner').eq('is_active',true));
assert.equal(memberships.length,1,'Expected the approved development owner membership.');
const type=user.email_confirmed_at?'recovery':'invite';
const data=ok(await client.auth.admin.generateLink({type,email}));
assert.equal(data.user.id,user.id,'Link must belong to the existing owner.');
const token=data.properties.hashed_token;
assert.match(token,/^[a-f0-9]{40,128}$/i);
const url=`http://127.0.0.1:3000/auth/activate#type=${type}&token_hash=${encodeURIComponent(token)}`;
await mkdir('private',{recursive:true});
const destination=resolve('private/owner-account-setup.html');
await writeFile(destination,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private owner account setup</title><body style="font:18px system-ui;max-width:36rem;margin:3rem auto;padding:1rem"><h1>Set up your owner account</h1><p>This private, single-use link grants access to your development account. Keep this file private and delete it after setting your password.</p><p>Keep the local app running, then open this link in Chrome:</p><p><a href="${url.replaceAll('&','&amp;')}" rel="noreferrer">Continue to Sightseeing Shkodra account setup</a></p><p>If the link expires, ask for a new setup link.</p></body></html>`,{mode:0o600});
console.log(`Private setup file created: ${destination}. No email sent; no token printed.`);
