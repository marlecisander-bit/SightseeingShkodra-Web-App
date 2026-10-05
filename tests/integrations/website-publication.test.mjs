import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadWebsitePublication} from '../../src/modules/content/website-server.ts';
import {initialWebsiteContent,homepageVisibilitySections} from '../../src/modules/content/website-schema.ts';
const env={PUBLIC_OPERATOR_ID:'10000000-0000-4000-8000-000000000001',NEXT_PUBLIC_SUPABASE_URL:'https://cms-test.invalid',SUPABASE_SECRET_KEY:'test-secret-never-log'};
test('missing production CMS configuration is diagnosed without querying or exposing values',async()=>{
 const events=[];const result=await loadWebsitePublication({},async()=>{throw Error('must not fetch');},e=>events.push(e));
 assert.equal(result.published,false);for(const id of homepageVisibilitySections)assert.equal(result.content[id+'.showOnHomepage'],'false');
 assert.deepEqual(events,[{component:'website_publication',reason:'missing_configuration',missing:['PUBLIC_OPERATOR_ID','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY']}]);
});
test('publication query reads only published operator-scoped data without caching or logging content',async()=>{
 const events=[];const result=await loadWebsitePublication(env,async(input,init)=>{const u=new URL(String(input));assert.equal(u.searchParams.get('operator_id'),'eq.'+env.PUBLIC_OPERATOR_ID);assert.equal(u.searchParams.get('slug'),'eq.website-homepage');assert.equal(u.searchParams.get('status'),'eq.published');assert.equal(u.searchParams.get('select'),'published_body');assert.equal(init.cache,'no-store');return Response.json({published_body:{content:{...initialWebsiteContent,'hero.showOnHomepage':'false'}}});},e=>events.push(e));
 assert.equal(result.published,true);assert.equal(result.content['hero.showOnHomepage'],'false');assert.deepEqual(events,[]);
});
test('provider, missing publication and invalid CMS failures are distinct and sanitized',async()=>{
 for(const [response,reason] of [[Response.json({message:'secret provider detail',code:'42501'},{status:403}),'query_failed'],[Response.json(null),'not_published'],[Response.json({published_body:{content:{}}}),'invalid_published_content']]){
  const events=[];const result=await loadWebsitePublication(env,async()=>response,e=>events.push(e));assert.equal(result.published,false);assert.deepEqual(events,[{component:'website_publication',reason}]);assert(!JSON.stringify(events).includes('secret'));
 }
});
