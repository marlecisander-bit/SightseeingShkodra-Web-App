import assert from 'node:assert/strict';
import { before,after,test } from 'node:test';
import { createTestDatabase,loadDevelopmentFixtures } from '../helpers/database.mjs';
let db, actor;
const op='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
before(async()=>{
  db=await createTestDatabase(); await loadDevelopmentFixtures(db);
  const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
});
after(async()=>{await db.close();});
async function save(entity,id,data,remove=false,operator=op) {
  return (await db.query('select save_catalog_v1($1,$2,$3,$4,$5,$6) as id',[operator,actor,entity,id,JSON.stringify(data),remove])).rows[0].id;
}
test('catalog creates, edits and archives content with SEO validation and audit',async()=>{
  const supplier=await save('supplier',null,{name:'Local supplier',type:'partner'});
  const data={title:'Test tour',slug:'test-tour',type:'van_tour',status:'draft',supplier_id:supplier};
  const product=await save('product',null,data);
  await assert.rejects(save('product',product,{...data,status:'published'}),e=>e.code==='22023');
  await assert.rejects(save('product',product,{...data,og_image:'https://example.com/image.jpg'}),e=>e.code==='22023');
  await save('product',product,{...data,status:'published',meta_title:'Tour',meta_description:'Tour description'});
  const stop=await save('stop',null,{name:'Stop',product_id:product,lat:42,lng:19,sort_order:0});
  await assert.rejects(save('stop',null,{name:'Duplicate',product_id:product,lat:42,lng:19,sort_order:0}),e=>e.code==='23505');
  await assert.rejects(save('supplier',supplier,{},true),e=>e.code==='23503');
  await save('stop',stop,{},true);
  await save('product',product,{},true);
  assert.equal((await db.query('select status from products where id=$1',[product])).rows[0].status,'archived');
  assert.equal((await db.query("select count(*)::int as n from audit_logs where entity_id=$1 and action='catalog.changed'",[product])).rows[0].n,3);
});
test('foreign operators, forged staff roles and cross-tenant parents are rejected',async()=>{
  await assert.rejects(save('supplier',null,{name:'Wrong',type:'partner'},false,other),e=>e.code==='42501');
  await assert.rejects(save('stop',null,{name:'Wrong',product_id:'10000000-0000-4000-8000-000000000021',lat:42,lng:19,sort_order:3}),e=>e.code==='23503');
  await db.query("update staff_profiles set role='operations' where id=$1",[actor]);
  await assert.rejects(save('supplier',null,{name:'Wrong',type:'partner'}),e=>e.code==='42501');
});
