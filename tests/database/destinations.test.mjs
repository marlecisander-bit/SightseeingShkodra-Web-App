import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
let db,actor;const op='10000000-0000-4000-8000-000000000001';
const dir=new URL('../../supabase/migrations/',import.meta.url),migration='20260925000200_dynamic_destinations.sql';
before(async()=>{
 db=new PGlite();await db.exec(platformSql);
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await loadDevelopmentFixtures(db);
 const u=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,u])).rows[0].id;
 await db.query("select save_website_content_v1($1,$2,$3,null,'initialize')",[op,actor,JSON.stringify(initialWebsiteContent)]);
 await db.query("update content_pages set body=jsonb_set(body,'{content,place.centre.name}','\"Private draft title\"') where slug='website-homepage'");
 await db.query("insert into content_pages(operator_id,slug,title,body,status) values($1,'explore-centre','Guide',$2,'published')",[op,JSON.stringify({version:1,format:'plain_text',text:'Existing full guide'})]);
 await db.exec(await readFile(new URL(migration,dir),'utf8'));
});
after(async()=>db?.close());
async function row(slug='centre'){return (await db.query("select *,updated_at::text as stamp from content_pages where operator_id=$1 and slug=$2",[op,'explore-'+slug])).rows[0];}
async function save(r,data,action='draft'){return db.query('select save_destination_v1($1,$2,$3,$4,$5,$6,$7)',[op,actor,r.id,JSON.stringify(data),action,r.destination_order,r.stamp]);}
test('migration preserves public and draft cards separately and retains original guide',async()=>{
 const r=await row();assert.equal(r.body.name,'Private draft title');assert.equal(r.published_body.name,initialWebsiteContent['place.centre.name']);assert.equal(r.body.story,'Existing full guide');assert.equal(r.destination_legacy.body.text,'Existing full guide');
 assert.equal((await db.query('select count(*)::int n from content_pages where is_destination')).rows[0].n,4);
 assert.equal((await db.query('select count(*)::int n from stops')).rows[0].n>0,true);
});
test('draft rename does not change public slug; publishing preserves alias and rejects stale saves',async()=>{
 const r=await row();await save(r,{...r.body,slug:'historic-centre',name:'Renamed centre'});
 const draft=await row('historic-centre');assert.equal(draft.published_body.slug,'centre');await assert.rejects(save(r,r.body),/changed/);
 await save(draft,draft.body,'publish');const published=await row('historic-centre');assert.deepEqual(published.destination_aliases,['centre']);assert.equal(published.published_body.slug,'historic-centre');assert.deepEqual(published.body,published.published_body);
});
test('adjacent ordering works at zero; archive leaves operational stops and content intact',async()=>{
 const r=await row('castle');await save(r,r.body,'earlier');assert.equal((await row('castle')).destination_order,0);
 const before=(await db.query('select count(*)::int n from stops')).rows[0].n;const fresh=await row('castle');await save(fresh,fresh.body,'archive');assert.equal((await row('castle')).status,'archived');assert.equal((await db.query('select count(*)::int n from stops')).rows[0].n,before);
});
test('operator and browser permissions protect mutations',async()=>{
 const r=await row('lake');await assert.rejects(db.query('select save_destination_v1($1,$2,$3,$4,$5,0,$6)',['20000000-0000-4000-8000-000000000001',actor,r.id,JSON.stringify(r.body),'draft',r.stamp]),/permission/);
 await db.exec('set role anon');await assert.rejects(save(r,r.body),/permission/);await db.exec('reset role');
});
test('new destination lifecycle supports unpublished drafts, publish and withdrawal without a stop',async()=>{const original=await row('lake'),body={...original.body,slug:'test-independent-destination',name:'Independent destination',stopId:null};const id=(await db.query('select save_destination_v1($1,$2,null,$3,$4,9,null) id',[op,actor,JSON.stringify(body),'draft'])).rows[0].id;let fresh=await row(body.slug);assert.equal(fresh.id,id);assert.equal(fresh.status,'draft');assert.equal(fresh.published_body,null);await save(fresh,body,'publish');fresh=await row(body.slug);assert.equal(fresh.status,'published');assert.equal(fresh.published_body.stopId,null);await save(fresh,body,'unpublish');fresh=await row(body.slug);assert.equal(fresh.status,'draft');assert.equal(fresh.published_body.name,body.name);});
