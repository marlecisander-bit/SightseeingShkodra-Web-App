import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {initialWebsiteContent,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
let db;const op='10000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000001';
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);await db.query("insert into operators(id,name) values($1,'Isolated partner test')",[other]);});
after(async()=>db?.close());
test('partners enforce publishable logos, operator media, URL safety and ordering',async()=>{
 for(const [logo,url,active] of [['','',true],['javascript:alert(1)','',false],['/images/lake.webp','javascript:alert(1)',true],['/images/lake.webp','https://user:pass@example.com',true],[`https://test.supabase.co/storage/v1/object/public/website-media/${other}/00000000-0000-4000-8000-000000000001.png`,'',true]])await assert.rejects(db.query('insert into partners(operator_id,name,logo_url,website_url,is_active) values($1,\'Test\',$2,$3,$4)',[op,logo,url,active]));
 for(const [name,order,active,operator] of [['second',20,true,op],['first',10,true,op],['draft',0,false,op],['other draft',0,false,other]])await db.query("insert into partners(operator_id,name,logo_url,website_url,is_active,display_order) values($1,$2,'/images/lake.webp','https://example.com', $3,$4)",[operator,name,active,order]);
 const rows=(await db.query('select name from partners where operator_id=$1 and is_active order by display_order,id',[op])).rows;assert.deepEqual(rows.map(r=>r.name),['first','second']);
});
test('anonymous RLS hides inactive rows; browser mutation grants are absent',async()=>{
 await db.exec('set role anon');assert.deepEqual((await db.query('select name from partners order by display_order')).rows.map(r=>r.name),['first','second']);
 for(const sql of ["insert into partners(operator_id,name) values('"+op+"','Unauthorized')","update partners set name='Unauthorized'","delete from partners"])await assert.rejects(db.exec(sql));
 await db.exec('reset role; set role authenticated');assert.equal((await db.query('select * from partners where not is_active')).rows.length,0);await assert.rejects(db.exec("update partners set is_active=true"));await db.exec('reset role');
});
test('staff read stays operator scoped, including inactive partners',async()=>{
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'admin')",[op,uid]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role authenticated');
 assert.deepEqual((await db.query('select name from partners where not is_active')).rows.map(r=>r.name),['draft']);await db.exec("reset role; reset request.jwt.claim.sub");
});
test('additive website settings validate old publications and new CTA controls without rewriting rows',async()=>{
 const old={...initialWebsiteContent};for(const k of Object.keys(old))if(k.startsWith('partners.'))delete old[k];
 const valid=async c=>(await db.query('select validate_website_content_v1($1) ok',[JSON.stringify(c)])).rows[0].ok;
 assert.ok(await valid(old));assert.equal(validateWebsiteContent(old)['partners.ctaEnabled'],'false');assert.ok(await valid(initialWebsiteContent));
 for(const patch of [{'partners.showOnHomepage':'bad'},{'partners.ctaEnabled':'true'},{'partners.ctaUrl':'javascript:alert(1)'},{'partners.ctaUrl':'https://user:pass@example.com'},{'partners.title':''}]){const c={...initialWebsiteContent,...patch};assert.equal(await valid(c),false);assert.throws(()=>validateWebsiteContent(c));}
 for(const url of ['/explore','https://example.com/path'])assert.ok(await valid({...initialWebsiteContent,'partners.ctaEnabled':'true','partners.ctaUrl':url}));
});
test('service CRUD supports edits, replacement, ordering, deactivation and deletion without cross-operator changes',async()=>{
 await db.exec('set role service_role');
 const saved=(await db.query("insert into partners(operator_id,name) values($1,'CRUD fixture') returning id,updated_at",[op])).rows[0];
 await db.query("update partners set name='Updated fixture',logo_url='/images/lake.webp',website_url='https://example.com',description='Optional',display_order=5,is_active=true where operator_id=$1 and id=$2",[op,saved.id]);
 await db.query("update partners set logo_url='/images/castle.webp',website_url='https://example.org',display_order=7,is_active=false where operator_id=$1 and id=$2",[op,saved.id]);
 const row=(await db.query('select * from partners where operator_id=$1 and id=$2',[op,saved.id])).rows[0];assert.equal(row.logo_url,'/images/castle.webp');assert.equal(row.website_url,'https://example.org');assert.equal(row.display_order,7);assert.equal(row.is_active,false);
 assert.equal((await db.query('delete from partners where operator_id=$1 and id=$2 returning id',[other,saved.id])).rows.length,0);
 assert.equal((await db.query('delete from partners where operator_id=$1 and id=$2 returning id',[op,saved.id])).rows.length,1);await db.exec('reset role');
});
test('partner headings and visibility use the existing private draft and publication RPC',async()=>{
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
 const row=async()=>(await db.query("select * from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 let c={...initialWebsiteContent};
 const save=async operation=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,JSON.stringify(c),(await row())?.updated_at??null,operation]);
 await save('initialize');const published=(await row()).published_body;
 c={...c,'partners.title':'Approved section heading','partners.description':'Edited description','partners.eyebrow':'Edited eyebrow','partners.showOnHomepage':'false'};await save('draft');assert.deepEqual((await row()).published_body,published);
 await save('publish');assert.equal((await row()).published_body.content['partners.showOnHomepage'],'false');assert.equal((await row()).published_body.content['partners.title'],'Approved section heading');
 c['partners.showOnHomepage']='true';await save('publish');assert.equal((await row()).published_body.content['partners.showOnHomepage'],'true');
});
