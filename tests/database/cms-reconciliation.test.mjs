import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {pageSections} from '../../src/modules/content/page-sections.ts';
let db,actor;const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000020';
const dir=new URL('../../supabase/migrations/',import.meta.url),migration='20260924000300_cms_reconciliation.sql';
before(async()=>{db=new PGlite();await db.exec(platformSql);for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));await loadDevelopmentFixtures(db);const u=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,u])).rows[0].id;});
after(async()=>db?.close());
test('additive reconciliation preserves custom published/draft values and adds validated presentation fields',async()=>{
 const newKeys=new Set(pageSections.flatMap(s=>s.fields.map(f=>f.key)));const old=Object.fromEntries(Object.entries(initialWebsiteContent).filter(([key])=>!newKeys.has(key)&&!["hero.amenities","hero.desktopPosition","hero.mobilePosition","nav.home"].includes(key)));old['hero.title']='Existing custom title';old['reviews.eyebrow']='Custom review heading';await db.query("select save_website_content_v1($1,$2,$3,null,'initialize')",[op,actor,JSON.stringify(old)]);
 await db.exec(await readFile(new URL(migration,dir),'utf8'));const row=(await db.query("select body,published_body from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];assert.equal(row.body.content['hero.title'],'Existing custom title');assert.equal(row.published_body.content['reviews.eyebrow'],'Custom review heading');for(const key of newKeys)assert.equal(row.body.content[key],initialWebsiteContent[key]);assert.equal((await db.query('select validate_website_content_v1($1) as ok',[JSON.stringify(row.body.content)])).rows[0].ok,true);
});
test('catalog and guide editorial metadata are consumed while internal map stops and legacy home slots are excluded',async()=>{
 const data={title:'Product',slug:'demo-van-tour',type:'van_tour',status:'published',meta_title:'SEO headline',meta_description:'One canonical summary',og_image:'https://example.com/test.jpg',og_image_alt:'Product photo',inclusions:'Exact inclusion description'};
 await db.query("select save_catalog_v1($1,$2,'product',$3,$4,false)",[op,actor,product,JSON.stringify(data)]);
 await db.query("insert into content_pages(operator_id,slug,title,body,status,meta_title,meta_description,og_image,og_image_alt) values($1,'explore-lake','Article title',$2,'published','Article SEO','Article summary','https://example.com/guide.jpg','Guide social photo')",[op,JSON.stringify({version:1,format:'plain_text',text:'Long guide body'})]);
 await db.query("insert into content_pages(operator_id,slug,title,body,status) values($1,'homepage-hero','Historical duplicate',$2,'published')",[op,JSON.stringify({version:1,format:'plain_text',text:'Unconsumed historic text'})]);
 const snapshot=(await db.query('select read_public_homepage_v1($1,$2) as data',[op,'demo-van-tour'])).rows[0].data;
 assert.equal(snapshot.product.inclusions,data.inclusions);assert.equal(snapshot.product.meta_title,data.meta_title);assert.equal(snapshot.product.description,data.meta_description);assert.equal(snapshot.product.og_image,data.og_image);assert.deepEqual(snapshot.product.stops,[]);assert.deepEqual(snapshot.content.map(c=>c.slug),['explore-lake']);assert.equal(snapshot.content[0].og_image_alt,'Guide social photo');assert((await db.query('select count(*)::int as n from stops where operator_id=$1',[op])).rows[0].n>0,'stop history is preserved');
});
