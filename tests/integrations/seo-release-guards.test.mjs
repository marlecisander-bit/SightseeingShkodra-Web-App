import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {unstable_getResponseFromNextConfig} from 'next/experimental/testing/server';
const {default:config}=await import('../../next.config.ts');
test('www.app marketing redirects win while protected and unknown paths retain their exact alias contract',async()=>{
 for(const path of ['/booking/manage','/auth/activate','/admin','/api/public/checkout','/api/webhooks/resend','/payment/return','/checkout/success','/unknown']){
  const query='?code=example&next=%2Fbooking%2Fmanage';
  const r=await unstable_getResponseFromNextConfig({url:'https://www.sightseeingshkodra.app'+path+query,headers:{host:'www.sightseeingshkodra.app'},nextConfig:config});
  assert.equal(r.status,307,path);const u=new URL(r.headers.get('location'));assert.equal(u.origin,'https://sightseeingshkodra.app');assert.equal(u.pathname,path);assert.equal(u.searchParams.get('code'),'example');assert.equal(u.searchParams.get('next'),'/booking/manage');
 }
 for(const path of ['/','/book','/explore/bridge']){const r=await unstable_getResponseFromNextConfig({url:'https://www.sightseeingshkodra.app'+path,headers:{host:'www.sightseeingshkodra.app'},nextConfig:config});assert.equal(r.status,308);assert.equal(new URL(r.headers.get('location')).origin,'https://www.sightseeingshkodra.com');}
 for(const host of ['sightseeingshkodra.app','www.sightseeingshkodra.com']){const r=await unstable_getResponseFromNextConfig({url:'https://'+host+'/booking/manage',headers:{host},nextConfig:config});assert.equal(r.headers.get('location'),null);}
});
test('corrected editor drafts cannot restore obsolete descriptions during later publication and custom drafts stay intact',async()=>{
 const db=new PGlite(),op='9185510e-0e82-4027-ab1c-8604dad5c92e';
 try{
  await db.exec('create table content_pages(operator_id uuid,slug text,is_destination boolean,body jsonb,published_body jsonb);create table products(id uuid,operator_id uuid,title text,card_draft jsonb,card_published jsonb,editor_draft jsonb);');
  const cases=[['7d7257f2-ee83-43cf-85bf-5dba3bbf5196','Sightseeing Panorama Tour','Discover Shkodra on a scenic 2-hour tour.'],['d0fb66d4-f290-405b-9362-30a4f5c16e27','Hop On Hop Off - Daily Ticket','Your ticket is valid until the end of the day.']];
  for(const [id,title,description]of cases){const card={description,alt:'Loop',features:['wifi']};await db.query('insert into products values($1,$2,$3,$4,$4,$5)',[id,op,title,JSON.stringify(card),JSON.stringify({card,unrelated:'Owner value'})]);}
  const sql=await readFile(new URL('../../supabase/migrations/20261116000100_seo_audit_content.sql',import.meta.url),'utf8');await db.exec(sql);
  const once=(await db.query('select * from products order by id')).rows;
  for(const p of once){assert.equal(p.editor_draft.card.description,p.card_published.description);assert.equal(p.editor_draft.unrelated,'Owner value');}
  assert.match(once.find(p=>p.title.includes('Panorama')).editor_draft.card.description,/15-minute/);assert.match(once.find(p=>p.title.includes('Daily')).editor_draft.card.description,/April 2027/);
  // Existing product publication copies the saved editor card to both card snapshots.
  await db.exec("update products set card_draft=editor_draft->'card',card_published=editor_draft->'card'");
  assert.deepEqual((await db.query('select * from products order by id')).rows,once);
  await db.query("update products set editor_draft=jsonb_set(editor_draft,'{card,description}',to_jsonb('Owner custom description'::text)) where id=$1",[cases[0][0]]);await db.exec(sql);
  assert.equal((await db.query('select editor_draft from products where id=$1',[cases[0][0]])).rows[0].editor_draft.card.description,'Owner custom description');
  const custom=(await db.query('select * from products order by id')).rows;await db.exec(sql);assert.deepEqual((await db.query('select * from products order by id')).rows,custom);
 }finally{await db.close();}
});
