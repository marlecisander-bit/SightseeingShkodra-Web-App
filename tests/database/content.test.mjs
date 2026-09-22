import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
let db,actor;
const op='10000000-0000-4000-8000-000000000001';
before(async()=>{
  db=await createTestDatabase();await loadDevelopmentFixtures(db);
  const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,user])).rows[0].id;
});
after(async()=>{await db.close();});
async function save(id,data,stamp=null,operator=op){return(await db.query('select save_content_page_v1($1,$2,$3,$4,$5) as id',[operator,actor,id,JSON.stringify(data),stamp])).rows[0].id;}
test('content editor can draft, publish and archive; validation and stale edits fail closed',async()=>{
  const draft={title:'Explore',slug:'explore-test',status:'draft',text:'<script>not executable</script>'};
  const id=await save(null,draft);
  const stamp=(await db.query('select updated_at::text as stamp from content_pages where id=$1',[id])).rows[0].stamp;
  await assert.rejects(save(id,{...draft,status:'published'},stamp),e=>e.code==='22023');
  await assert.rejects(save(id,{...draft,og_image:'https://example.com/image.jpg'},stamp),e=>e.code==='22023');
  const published={...draft,status:'published',meta_title:'Explore Shkodra',meta_description:'Places in Shkodra',og_image:'https://example.com/image.jpg',og_image_alt:'Lake shore'};
  await save(id,published,stamp);
  await assert.rejects(save(id,draft,stamp),e=>e.code==='PT409');
  const row=(await db.query('select body,updated_at::text as stamp from content_pages where id=$1',[id])).rows[0];
  assert.deepEqual(row.body,{version:1,format:'plain_text',text:draft.text});
  await save(id,{...published,status:'archived'},row.stamp);
  assert.equal((await db.query('select status from content_pages where id=$1',[id])).rows[0].status,'archived');
  assert.equal((await db.query("select count(*)::int as n from audit_logs where entity_id=$1",[id])).rows[0].n,3);
  await assert.rejects(save(null,draft),e=>e.code==='23505');
});
test('cross-operator and operations writes are denied',async()=>{
  const data={title:'Test',slug:'forbidden',status:'draft'};
  await assert.rejects(save(null,data,null,'10000000-0000-4000-8000-000000000002'),e=>e.code==='42501');
  await db.query("update staff_profiles set role='operations' where id=$1",[actor]);
  await assert.rejects(save(null,data),e=>e.code==='42501');
});
