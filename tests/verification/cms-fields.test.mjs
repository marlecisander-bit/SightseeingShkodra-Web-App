import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {assertLocalEnvironment,denyNetwork} from '../../scripts/cms-verification/safety.mjs';
import {fixtureValue,preparedContent} from '../../scripts/cms-verification/fixtures.mjs';
import {checkField,publicMarkerPresent} from '../../scripts/cms-verification/assertions.mjs';
import {editableWebsiteSections,validateWebsiteContent,websiteFields} from '../../src/modules/content/website-schema.ts';
import {verifyCms,assertDeclaredCases} from '../../scripts/cms-verification/verify.mjs';
const active=editableWebsiteSections.flatMap(s=>s.fields);
test('local gate rejects production/preview, service bindings and remote origins before imports',()=>{
 for(const env of [{APP_ENV:'production'},{VERCEL_ENV:'preview'},{DATABASE_URL:'postgres://example.invalid'},{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid'},{SUPABASE_SERVICE_ROLE_KEY:'synthetic'},{RESEND_API_KEY:'synthetic'},{NEXT_PUBLIC_SITE_URL:'https://example.invalid'}])assert.throws(()=>assertLocalEnvironment(env));
 assert.doesNotThrow(()=>assertLocalEnvironment({NEXT_PUBLIC_SITE_URL:'http://127.0.0.1:3000'}));
 const child=spawnSync(process.execPath,['--import','tsx','scripts/verify-cms-fields.mjs'],{env:{...process.env,APP_ENV:'production'},encoding:'utf8'});assert.notEqual(child.status,0);assert.match(child.stderr,/requires a disposable local environment/);
});
test('fetch network denial is reversible',async()=>{const before=globalThis.fetch,restore=denyNetwork();try{await assert.rejects(fetch('https://example.invalid'),/forbids fetch/);}finally{restore();}assert.equal(globalThis.fetch,before);});
test('all current kinds receive valid fixtures; unknown kind and undeclared control fail closed',()=>{
 for(const field of active){const c=preparedContent(field.key),value=fixtureValue(field);assert.doesNotThrow(()=>validateWebsiteContent({...c,[field.key]:value}),field.key);}
 assert.throws(()=>fixtureValue({key:'future',kind:'unknown'}),/No fixture/);assert.throws(()=>assertDeclaredCases([...active,{key:'future.control'}]),/explicit public probe/);
});
test('script/hidden markers and image links cannot masquerade as rendered content',()=>{
 assert.equal(publicMarkerPresent('<script>VERIFY_hero_title</script><input type="hidden" value="VERIFY_hero_title">','hero.title'),false);
 assert.equal(checkField({key:'hero.image',kind:'image'},'/images/castle.webp',{html:'<a href="/images/castle.webp">photo</a>'}).status,'FAIL');
});
test('complete disposable verification has no unexpected failures and reports known gaps honestly',async()=>{
 const r=await verifyCms();assert.equal(r.counts.active,active.length);assert.equal(r.counts.retained,websiteFields.length-active.length);
 assert.deepEqual(r.checks.filter(c=>c.status!=='PASS'),[]);
 assert.deepEqual(r.fields.filter(f=>f.status==='FAIL').map(f=>f.field).sort(),['meta_title','meta_description','og_image','og_image_alt'].map(k=>'catalog.product.'+k).sort());
 assert.deepEqual(r.fields.filter(f=>f.status==='UNTESTED').map(f=>f.field).sort(),['route.eyebrow','route.title','routePage.mapAction','bookingDialog.title','bookingDialog.text'].sort());
 for(const row of r.fields.filter(f=>f.classification==='active structured control')){assert.equal(row.lifecycle.draftSave,'PASS',row.field);assert.equal(row.lifecycle.freshRead,'PASS',row.field);assert.equal(row.lifecycle.publicBeforePublication,'PASS',row.field);assert.equal(row.lifecycle.publish,'PASS',row.field);assert.equal(row.lifecycle.repeatedRead,'PASS',row.field);if(row.status==='PASS')assert.equal(row.lifecycle.savedDraftPreview,'PASS');}
 assert.ok(r.compatibility.every(f=>f.status==='PASS'));assert.ok(r.codeControlled.every(f=>f.status==='UNTESTED'));
});
