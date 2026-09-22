import test from 'node:test';
import assert from 'node:assert/strict';
import {activationCredentials, passwordValidation} from '../../src/modules/identity/account-setup.ts';
function form(values) {const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;}
test('activation accepts only invite/recovery token hashes, never redirect or account-change types',()=>{
  const token='a'.repeat(64);
  for(const type of ['invite','recovery'])assert.deepEqual(activationCredentials(form({type,token_hash:token,next:'https://evil.invalid'})),{type,token_hash:token});
  for(const type of ['email_change','signup','magiclink','', 'email'])assert.equal(activationCredentials(form({type,token_hash:token})),null);
  for(const token_hash of ['', 'a'.repeat(39), 'x'.repeat(64),'a'.repeat(129)])assert.equal(activationCredentials(form({type:'invite',token_hash})),null);
});
test('password validation rejects missing/mismatched/oversized input without trimming passwords',()=>{
  assert.ok(passwordValidation(form({})));
  for(const password of ['short','a'.repeat(129)])assert.ok(passwordValidation(form({password,confirmation:password})));
  assert.ok(passwordValidation(form({password:'a'.repeat(12),confirmation:'b'.repeat(12)})));
  for(const password of [' a long passphrase ', 'a'.repeat(128)])assert.equal(passwordValidation(form({password,confirmation:password})),null);
});
