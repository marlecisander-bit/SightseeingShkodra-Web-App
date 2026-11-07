import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('status presentation persists atomically and projects publicly without changing booking guards',async()=>{
 const db=await createTestDatabase();try{
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001';
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
 const p=(await db.query("select id,updated_at,unavailable_message from products where operator_id=$1 and type='van_tour' limit 1",[op])).rows[0];
 assert.equal((await db.query('select availability_presentation from products where id=$1',[p.id])).rows[0].availability_presentation,null);
 await db.query("update products set status='published',capacity_rules='{\"version\":1,\"model\":\"departure_seats\"}' where id=$1",[p.id]);
 await db.query("update departures set status='scheduled',capacity=8 where product_id=$1",[p.id]);
 const save=async(value,message='',stamp)=>db.query('select save_product_availability_v2($1,$2,$3,$4,$5,$6)',[op,actor,p.id,stamp??(await db.query('select updated_at from products where id=$1',[p.id])).rows[0].updated_at,value,message]);
 const value={state:'seasonal_break',reopening:{precision:'month',value:'2001-04'},actionUrl:'/route',label:'Season pause'};
 await db.query("update products set card_published='{\"enabled\":true,\"image\":\"/images/lake.webp\",\"alt\":\"Lake\",\"description\":\"Saved description\",\"order\":0}' where id=$1",[p.id]);
 await save(value);
 const stored=(await db.query('select active,availability_presentation,unavailable_message from products where id=$1',[p.id])).rows[0];assert.equal(stored.active,false);assert.deepEqual(stored.availability_presentation,value);assert.equal(stored.unavailable_message,'');
 const directory=(await db.query('select read_public_products_v1($1) d',[op])).rows[0].d;assert.deepEqual(directory.find(x=>x.id===p.id).availability,value);
 const home=(await db.query('select read_public_homepage_v1($1,(select slug from products where id=$2)) d',[op,p.id])).rows[0].d;assert.deepEqual(home.product.availability_presentation,value);
 for(const bad of [{state:'bad'},{state:'sold_out',actionUrl:'javascript:alert(1)'},{state:'sold_out',actionUrl:'https://user:pass@example.com'},{state:'seasonal_break',reopening:{precision:'day',value:'2031-02-29'}}])await assert.rejects(save(bad),e=>e.code==='22023');
 await assert.rejects(save(value,'',p.updated_at),e=>e.code==='PT409');
 await save({state:'sold_out'},'No seats');assert.equal((await db.query('select active from products where id=$1',[p.id])).rows[0].active,false);
 await save({state:'available'},'No seats');assert.equal((await db.query('select active from products where id=$1',[p.id])).rows[0].active,true);
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.save_product_availability_v2(uuid,uuid,uuid,timestamptz,jsonb,text)','execute') allowed",[role])).rows[0].allowed,false);
 }finally{await db.close();}
});
