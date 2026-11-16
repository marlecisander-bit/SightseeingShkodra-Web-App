import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {unstable_getResponseFromNextConfig} from 'next/experimental/testing/server';
const {default:config}=await import('../../next.config.ts');
import {businessStructuredData} from '../../src/modules/content/business-structured-data.ts';
import {PGlite} from '@electric-sql/pglite';
test('public app redirects preserve paths and query parameters, with no com loop',async()=>{
 for(const host of ['sightseeingshkodra.app','www.sightseeingshkodra.app'])for(const path of ['/','/book','/route','/explore','/explore/bridge','/faq','/terms-and-conditions']){
  const requestUrl='https://'+host+path+'?utm_source=a&tag=one';const response=await unstable_getResponseFromNextConfig({url:requestUrl,headers:{host:new URL(requestUrl).host},nextConfig:config});
  assert.equal(response.status,308);const target=new URL(response.headers.get('location'));
  assert.equal(target.origin,'https://www.sightseeingshkodra.com');assert.equal(target.pathname,path);assert.deepEqual(target.searchParams.getAll('tag'),['one']);assert.equal(target.searchParams.get('utm_source'),'a');
  const final=await unstable_getResponseFromNextConfig({url:target.href,headers:{host:target.host},nextConfig:config});assert.equal(final.headers.get('location'),null);
 }
 for(const path of ['/tickets','/tour','/mes-bridge-shkodra']){
  const requestUrl='https://www.sightseeingshkodra.app'+path+'?source=old';const response=await unstable_getResponseFromNextConfig({url:requestUrl,headers:{host:new URL(requestUrl).host},nextConfig:config});
  assert.equal(response.status,308);assert.equal(response.headers.get('location'),'https://www.sightseeingshkodra.com'+(path.includes('bridge')?'/explore/bridge':'/book')+'?source=old');
 }
});
test('private, API, payment and unknown paths never match marketing redirects',async()=>{
 for(const path of ['/booking/manage','/booking/manage?token=private','/auth/activate','/admin','/api/public/checkout','/api/webhooks/resend','/payment/return','/checkout/success','/unknown']){
  const requestUrl='https://sightseeingshkodra.app'+path;const response=await unstable_getResponseFromNextConfig({url:requestUrl,headers:{host:new URL(requestUrl).host},nextConfig:config});assert.equal(response.headers.get('location'),null,path);
 }
});
test('organization identity has no invented business facts',()=>{
 const data=businessStructuredData('https://www.sightseeingshkodra.com',{'footer.business':'Sightseeing Shkodra'});
 assert.equal(data['@id'],'https://www.sightseeingshkodra.com/#organization');
 for(const key of ['address','aggregateRating','offers','openingHours'])assert.equal(data[key],undefined);
});
test('guarded content migration changes audited facts, preserves other policies and is idempotent',async()=>{
 const db=new PGlite();
 try{
 await db.exec('create table content_pages(operator_id uuid,slug text,is_destination boolean default false,body jsonb,published_body jsonb);create table products(operator_id uuid,id uuid,title text,card_draft jsonb,card_published jsonb,editor_draft jsonb);');
 const operator='9185510e-0e82-4027-ab1c-8604dad5c92e';
 const source={'content':{'seo.title':'Sightseeing Shkodra','seo.description':'Hop on - hop off sightseeing service in Shkodra.','seasonal.notice':'Our regular Hop-On Hop-Off service returns in May 2027.','legal.terms.text':'A ticket is valid for one full day (from first use on the selected date). Passengers may hop on and off at designated stops during the validity period. Tickets are non-transferable. Full payment is required at the time of booking.','faq.items':JSON.stringify([{answer:'Choose the Daily Ticket to hop off, explore and rejoin later departures. Choose the Sightseeing Tour Loop for an approximately two-hour trip, with optional stops of around 10 minutes at the lake, the cathedral and Mesi Bridge.'}])}};
 await db.query('insert into content_pages(operator_id,slug,body,published_body) values ($1,$2,$3,$3)',[operator,'website-homepage',JSON.stringify(source)]);
 const sql=await readFile(new URL('../../supabase/migrations/20261116000100_seo_audit_content.sql',import.meta.url),'utf8');await db.exec(sql);
 const first=(await db.query('select body from content_pages')).rows[0].body;assert.match(first.content['seasonal.notice'],/April 2027/);assert.match(first.content['legal.terms.text'],/not for 24 hours/);assert.match(first.content['legal.terms.text'],/Full payment is required at the time of booking/);assert.match(JSON.parse(first.content['faq.items'])[0].answer,/15-minute/);
 await db.exec(sql);assert.deepEqual((await db.query('select body from content_pages')).rows[0].body,first);
 }finally{await db.close();}
});
