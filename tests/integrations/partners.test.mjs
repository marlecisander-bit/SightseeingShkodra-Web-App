import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadPublicPartners} from '../../src/modules/content/partners-server.ts';
import {readFile} from 'node:fs/promises';
const env={PUBLIC_OPERATOR_ID:'10000000-0000-4000-8000-000000000001',NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'test-only-key'};
test('disabled section does not create database traffic',async()=>{assert.deepEqual(await loadPublicPartners(false,env,()=>{throw Error('Must not fetch');}),[]);});
test('public partners request filters operator, active and complete logos without caching',async()=>{
 const rows=await loadPublicPartners(true,env,async(input,init)=>{const url=new URL(String(input));assert.equal(url.searchParams.get('operator_id'),'eq.'+env.PUBLIC_OPERATOR_ID);assert.equal(url.searchParams.get('is_active'),'eq.true');assert.equal(url.searchParams.get('logo_url'),'neq.');assert.equal(init.cache,'no-store');return Response.json([{id:'a',name:'Test',logo_url:'/images/lake.webp',website_url:'',description:'',is_active:true,display_order:0}]);});assert.equal(rows.length,1);
});
test('partner mutation uses existing publish authorization, operator scope, stale edit guard and delete confirmation',async()=>{
 const source=await readFile(new URL('../../src/app/admin/partner-actions.ts',import.meta.url),'utf8');assert.match(source,/withOperatorService\(operatorId,'content.publish'/);assert.match(source,/confirm_delete/);assert.equal((source.match(/eq\('operator_id',context.operatorId\)/g)||[]).length,2);assert.equal((source.match(/eq\('updated_at',stamp\)/g)||[]).length,2);assert.match(source,/revalidatePath\('\/','layout'\)/);
});
