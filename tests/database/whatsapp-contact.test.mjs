import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {initialWebsiteContent,validateWebsiteContent,globalEditorSections} from '../../src/modules/content/website-schema.ts';
import {whatsappLink,normalizeWhatsAppNumber,whatsappDock} from '../../src/modules/content/whatsapp.ts';
let db,actor;const op='10000000-0000-4000-8000-000000000001';
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;});
after(async()=>db?.close());
const valid=async c=>(await db.query('select validate_website_content_v1($1) ok',[JSON.stringify(c)])).rows[0].ok;
test('service role can resolve the private validator without exposing it to browsers',async()=>{
 await db.exec('begin; set local role service_role');
 try {
  assert.equal(await valid(initialWebsiteContent),true);
  assert.equal(await valid({...initialWebsiteContent,'whatsapp.enabled':'true','whatsapp.number':''}),false);
  assert.equal((await db.query("select has_schema_privilege(current_user,'private','CREATE') allowed")).rows[0].allowed,false);
 } finally { await db.exec('rollback'); }
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'private.validate_website_before_whatsapp_v1(jsonb)','EXECUTE') allowed",[role])).rows[0].allowed,false);
});
test('old documents default disabled and only Global owns WhatsApp fields',async()=>{
 const old=Object.fromEntries(Object.entries(initialWebsiteContent).filter(([k])=>!k.startsWith('whatsapp.')));
 assert.equal(await valid(old),true);assert.equal(whatsappLink(validateWebsiteContent(old)),null);
 assert.equal(globalEditorSections.filter(s=>s.id==='whatsapp').length,1);
});
test('authorized CMS save works as service_role in a rolled-back local transaction',async()=>{
 await db.exec('begin; set local role service_role');
 try {
  await db.query("select save_website_content_v1($1,$2,$3,null,'initialize')",[op,actor,initialWebsiteContent]);
  const row=(await db.query("select body from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
  assert.equal(row.body.content['whatsapp.enabled'],'false');
 } finally { await db.exec('rollback'); }
});
test('international normalization, encoding and optional message use saved values',()=>{
 const c={...initialWebsiteContent,'whatsapp.enabled':'true','whatsapp.number':'+44 (20) 7946-0958','whatsapp.message':'Hello & thanks? Shkodër ☀'};
 assert.equal(normalizeWhatsAppNumber(c['whatsapp.number']),'442079460958');
 const u=new URL(whatsappLink(c));assert.equal(u.hostname,'wa.me');assert.equal(u.pathname,'/442079460958');assert.equal(u.searchParams.get('text'),c['whatsapp.message']);
 assert.equal(whatsappLink({...c,'whatsapp.message':''}),'https://wa.me/442079460958');
 for(const patch of [{'whatsapp.enabled':'false'},{'whatsapp.number':''},{'whatsapp.number':'bad'},{'whatsapp.desktop':'false','whatsapp.mobile':'false'}])assert.equal(whatsappLink({...c,...patch}),null);
});
test('SQL and application both reject clearly invalid phones and settings',async()=>{
 for(const value of ['abc','+355','0000000000','+11111111111','+1234567890123456','+355/691234567','https://evil.test','+35569?text=wrong']){
  const c={...initialWebsiteContent,'whatsapp.number':value};assert.equal(await valid(c),false,value);assert.throws(()=>validateWebsiteContent(c));
 }
 for(const patch of [{'whatsapp.enabled':'true'},{'whatsapp.mobile':'yes'},{'whatsapp.message':'x'.repeat(701)},{'whatsapp.label':'x'.repeat(61)},{'whatsapp.number':null}]){const c={...initialWebsiteContent,...patch};assert.equal(await valid(c),false);assert.throws(()=>validateWebsiteContent(c));}
 assert.equal(await valid({...initialWebsiteContent,'whatsapp.number':'+355 (69) 123-4567'}),true);
});
test('existing draft/publish flow synchronizes phone/message and disable without changing other content',async()=>{
 const row=async()=>(await db.query("select *,updated_at::text stamp from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 const save=async(c,action)=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,c,(await row())?.stamp??null,action]);
 await save(initialWebsiteContent,'initialize');const baseline=(await row()).published_body.content;
 let c={...baseline,'whatsapp.enabled':'true','whatsapp.number':'+355 69 123 4567'};await save(c,'draft');assert.equal(whatsappLink((await row()).published_body.content),null);
 await save(c,'publish');assert.equal(new URL(whatsappLink((await row()).published_body.content)).pathname,'/355691234567');
 c={...c,'whatsapp.number':'+44 20 7946 0958','whatsapp.message':'Changed message & details'};await save(c,'publish');const published=(await row()).published_body.content;
 assert.equal(new URL(whatsappLink(published)).searchParams.get('text'),c['whatsapp.message']);assert.equal(new URL(whatsappLink(published)).pathname,'/442079460958');assert.equal(published['hero.title'],baseline['hero.title']);
 await save({...c,'whatsapp.enabled':'false'},'publish');assert.equal(whatsappLink((await row()).published_body.content),null);
});
test('public cannot write configuration and unauthorized staff cannot use its existing RPC',async()=>{
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.save_website_content_v1(uuid,uuid,jsonb,timestamptz,text)','EXECUTE') allowed",[role])).rows[0].allowed,false);
 await db.query("update staff_profiles set role='operations' where id=$1",[actor]);
 await assert.rejects(db.query("select save_website_content_v1($1,$2,$3,null,'publish')",[op,actor,initialWebsiteContent]),e=>e.code==='42501');
});
test('dock moves above sticky booking action, avoids map, and hides without safe space',()=>{
 const rect={left:320,right:372,top:750,bottom:802};
 assert.equal(whatsappDock(rect,[],90),750);
 assert.equal(whatsappDock(rect,[{left:0,right:390,top:740,bottom:844}],90),676);
 assert.equal(whatsappDock(rect,[{left:0,right:390,top:250,bottom:810}],90),186);
 assert.equal(whatsappDock(rect,[{left:0,right:390,top:90,bottom:844}],90),null);
});
