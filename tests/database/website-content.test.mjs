import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';
import { initialWebsiteContent, validateWebsiteContent } from '../../src/modules/content/website-schema.ts';
let db, actor;
const op = '10000000-0000-4000-8000-000000000001';
before(async()=>{ db=await createTestDatabase(); await loadDevelopmentFixtures(db); const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id; actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,user])).rows[0].id; });
after(async()=>{await db.close();});
async function save(content, operation, stamp=null, operator=op) { return (await db.query('select * from save_website_content_v1($1,$2,$3,$4,$5)',[operator,actor,JSON.stringify(content),stamp,operation])).rows[0]; }
test('homepage drafts remain private until publish; stale edits, invalid URLs and wrong tenants fail',async()=>{
  for (const role of ['anon','authenticated']) {
    const permission = (await db.query("select has_function_privilege($1,'public.save_website_content_v1(uuid,uuid,jsonb,timestamptz,text)','execute') as allowed",[role])).rows[0];
    assert.equal(permission.allowed,false);
  }
  const base=await save(initialWebsiteContent,'initialize');
  const stamp=(await db.query('select updated_at::text as stamp from content_pages where id=$1',[base.id])).rows[0].stamp;
  const changed={...initialWebsiteContent,'hero.title':'A saved draft','hero.mobile':'/images/bridge-view.webp'};
  await save(changed,'draft',stamp);
  let row=(await db.query('select *,updated_at::text as stamp from content_pages where id=$1',[base.id])).rows[0];
  assert.equal(row.published_body.content['hero.title'],initialWebsiteContent['hero.title']);
  assert.equal(row.body.content['hero.title'],'A saved draft');
  await assert.rejects(save(changed,'publish',stamp),e=>e.code==='PT409');
  await assert.rejects(save({...changed,'nav.0.link':'javascript:alert(1)'},'publish',row.stamp),e=>e.code==='22023');
  await assert.rejects(save(changed,'publish',row.stamp,'10000000-0000-4000-8000-000000000002'),e=>e.code==='42501');
  await save(changed,'publish',row.stamp);
  row=(await db.query('select * from content_pages where id=$1',[base.id])).rows[0];
  assert.deepEqual(row.published_body.content,changed);
  await save(initialWebsiteContent,'initialize');
  assert.deepEqual((await db.query('select published_body from content_pages where id=$1',[base.id])).rows[0].published_body.content,changed);
  assert.equal((await db.query('select count(*)::int as n from audit_logs where entity_id=$1',[base.id])).rows[0].n,3);
  await db.query("update staff_profiles set role='operations' where id=$1",[actor]);
  await assert.rejects(save(changed,'publish',row.updated_at),e=>e.code==='42501');
});
test('website schema rejects code, unknown fields, unsafe image sources and missing fields',()=>{
  assert.deepEqual(validateWebsiteContent(initialWebsiteContent),initialWebsiteContent);
  for(const bad of [{...initialWebsiteContent,'hero.mobile':'https://evil.test/file.svg'},{...initialWebsiteContent,'nav.0.link':'//evil.test'},{...initialWebsiteContent,css:'body{}'},{...initialWebsiteContent,'hero.alt':''}]) assert.throws(()=>validateWebsiteContent(bad));
});

