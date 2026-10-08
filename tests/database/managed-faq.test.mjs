import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {initialWebsiteContent,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {websiteFaq,parseFaq} from '../../src/modules/content/faq.ts';

test('legacy FAQ preserves custom questions; malformed arrays fail both validators',async()=>{
 const db=await createTestDatabase();try{
 const old={...initialWebsiteContent,'tourPage.faqBook':'My existing question'};delete old['faq.items'];
 assert.equal(websiteFaq(validateWebsiteContent(old))[0].question,'My existing question');
 const valid=websiteFaq(initialWebsiteContent);
 for(const rows of [[...valid,valid[0]],[{...valid[0],question:''}],[{...valid[0],active:'true'}],[{...valid[0],answerSource:'html'}],Array(51).fill(valid[0]),[{...valid[0],extra:true}]]){
  const raw=JSON.stringify(rows);assert.throws(()=>parseFaq(raw));
  assert.equal((await db.query('select validate_website_content_v1($1) valid',[JSON.stringify({...initialWebsiteContent,'faq.items':raw})])).rows[0].valid,false);
 }
 for(const raw of ['[]',JSON.stringify(valid)])assert.equal((await db.query('select validate_website_content_v1($1) valid',[JSON.stringify({...initialWebsiteContent,'faq.items':raw})])).rows[0].valid,true);
 }finally{await db.close();}
});

test('FAQ additions, edits, disabling, reorder and deletion use isolated drafts and existing publication',async()=>{
 const db=await createTestDatabase();try{
 await loadDevelopmentFixtures(db);const op='10000000-0000-4000-8000-000000000001';
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
 const row=async()=>(await db.query("select *,updated_at::text stamp from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 const save=async(content,operation)=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,JSON.stringify(content),(await row())?.stamp??null,operation]);
 await save(initialWebsiteContent,'initialize');const before=(await row()).published_body;
 const rows=websiteFaq(initialWebsiteContent);rows[0]={...rows[0],question:'Edited?',answer:'New answer',active:false};
 rows.unshift({id:'new-question',question:'New?',answer:'New answer',active:true,answerSource:'text'});rows.splice(2,1);
 const content={...initialWebsiteContent,'faq.items':JSON.stringify(rows)};
 await save(content,'draft');assert.deepEqual((await row()).published_body,before);
 await save(content,'publish');assert.deepEqual(websiteFaq((await row()).published_body.content),rows);
 await save({...content,'faq.items':'[]'},'publish');assert.deepEqual(websiteFaq((await row()).published_body.content),[]);
 }finally{await db.close();}
});
