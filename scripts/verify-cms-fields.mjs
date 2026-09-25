import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../tests/helpers/database.mjs';
import {initialWebsiteContent,editableWebsiteSections} from '../src/modules/content/website-schema.ts';
import {emptyHomepage} from '../src/modules/content/homepage.ts';
const db=await createTestDatabase(),op='10000000-0000-4000-8000-000000000001';
try{
 await loadDevelopmentFixtures(db);const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,user])).rows[0].id;
 const save=async(c,operation,stamp=null)=>(await db.query('select * from save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,JSON.stringify(c),stamp,operation])).rows[0];
 const fields=editableWebsiteSections.flatMap(s=>s.fields);let current={...initialWebsiteContent};await save(current,'initialize');let changed={...current};
 const links=['/tour','/live','/explore','/book','/credits','/admin','/tour#faq','/tour#timetable','/explore#centre','/explore#castle','/explore#lake','/explore#bridge','/explore/centre','/explore/castle','/explore/lake','/explore/bridge','/'];let link=0;
 const results=[];
 for(const f of fields){const marker='CMS_AUDIT_'+f.key.replaceAll('.','_');const value=f.kind==='text'?marker:f.kind==='image'?`/images/${marker}.webp`:f.kind==='position'?'right bottom':f.kind==='amenities'?JSON.stringify([{id:'10000000-0000-4000-8000-000000000099',icon:'wifi',title:marker,description:'QA fixture',published:true,display_order:1,created_at:'2026-09-24T00:00:00Z',updated_at:'2026-09-24T00:00:00Z'}]):links[link++];assert(value,'missing test link');changed={...changed,[f.key]:value};const stamp=(await db.query("select updated_at::text as stamp from content_pages where slug='website-homepage'")).rows[0].stamp;await save(changed,'draft',stamp);const row=(await db.query("select body,published_body from content_pages where slug='website-homepage'")).rows[0];assert.equal(row.body.content[f.key],value);assert.equal(row.published_body.content[f.key],current[f.key]);results.push({field:f.key,value,adminOwner:editableWebsiteSections.find(s=>s.fields.includes(f)).title,save:'PASS',public:'PENDING'});}
 const stamp=(await db.query("select updated_at::text as stamp from content_pages where slug='website-homepage'")).rows[0].stamp;await save(changed,'publish',stamp);const published=(await db.query("select published_body from content_pages where slug='website-homepage'")).rows[0].published_body.content;
 const home={...emptyHomepage('ready'),price:'Test price',frequency:'Test service',product:{id:'test',title:'Test product',description:'Test summary',slug:'test',stops:[]}};
 const reviews={settings:{display_limit:3,google_reviews_url:null,leave_review_url:null},reviews:[{id:'test',author:'QA only - not a guest',rating:5,body:'Synthetic validation content. Not a real review.',source:'Other',review_date:null,original_url:null,avatar_url:null,language:null,featured:false,published:false,display_order:0,updated_at:''}]};
 await writeFile('private/cms-field-fixture.json',JSON.stringify({content:published,home,reviews}));
 const response=await fetch('http://127.0.0.1:3000/dev/cms-reconciliation');let html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');assert.equal(response.status,200);
 for(const r of results)r.public=(html.includes(r.field==='hero.amenities'?JSON.parse(r.value)[0].title:r.value)||html.includes(encodeURIComponent(r.value)))?'PASS':'FAIL';
 await writeFile('docs/CMS-FIELD-PROOF.json',JSON.stringify(results,null,2));
 const failures=results.filter(r=>r.public!=='PASS');console.log('Saved draft fields and public rendering checked:',results.length,'failures:',failures);assert.equal(failures.length,0);
}finally{await db.close();}
