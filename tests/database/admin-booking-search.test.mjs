import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
const op='10000000-0000-4000-8000-000000000001';let db,actor,customer,old;
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);const u=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,u])).rows[0].id;customer=(await db.query("insert into customers(operator_id,name,email,phone) values($1,'Historic Guest %_','old@example.test','123456789') returning id",[op])).rows[0].id;
 await db.query("insert into orders(operator_id,customer_id,subtotal,total,created_at) select $1,$2,0,0,'2020-01-01'::timestamptz+make_interval(days=>n) from generate_series(1,130) n",[op,customer]);old=(await db.query('select id from orders where customer_id=$1 order by created_at limit 1',[customer])).rows[0].id;await db.query("insert into bookings(operator_id,order_id,booking_reference,status) values($1,$2,'SS-OLDEST','pending')",[op,old]);});
after(async()=>db?.close());
async function search(q='',status='all',page=1,operator=op,staff=actor){return (await db.query('select search_admin_orders_v1($1,$2,$3,null,null,$4,$5) result',[operator,staff,q,status,page])).rows[0].result;}
test('full-history reference search reaches beyond the latest 100; literal search and complete pagination',async()=>{const found=await search('ss-oldest');assert.deepEqual(found.ids,[old]);assert.equal(found.total,1);const one=await search('historic'),two=await search('historic','all',2),last=await search('historic','all',6);assert.equal(one.total,130);assert.equal(one.ids.length,25);assert.equal(two.ids.length,25);assert(!one.ids.some(id=>two.ids.includes(id)));assert.equal(last.ids.length,5);assert.deepEqual((await search('historic','all',999)).ids,last.ids);assert.equal((await search('historic','all',999)).page,6);assert(last.ids.includes(old));assert.equal((await search('%_')).total,130);assert.equal((await search('missing')).total,0);});
test('status uses the booking state where present and filters before pagination',async()=>{assert.deepEqual((await search('ss-oldest','pending')).ids,[old]);assert.equal((await search('historic','confirmed')).total,0);assert.equal((await search('historic','pending')).total,130);});
test('exact email is normalized and invalid search parameters fail closed',async()=>{const r=(await db.query("select search_admin_orders_v1($1,$2,'',null,' OLD@EXAMPLE.TEST ','all',1) result",[op,actor])).rows[0].result;assert.equal(r.total,130);for(const [q,status,page]of [['','all',0],['','bad',1],['x'.repeat(201),'all',1]])await assert.rejects(search(q,status,page),e=>e.code==='22023');});
test('date filtering searches all orders without prefilter caps and keeps other tenants out',async()=>{
 const product=(await db.query('select id from products where operator_id=$1 limit 1',[op])).rows[0].id;
 const departure=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity) values($1,$2,'2020-05-01','09:00',8) returning id",[op,product])).rows[0].id;
 await db.query('insert into booking_items(operator_id,order_id,product_id,inventory_product_id,departure_id,quantity,unit_price,total_price) values($1,$2,$3,$3,$4,1,0,0)',[op,old,product,departure]);
 const found=(await db.query("select search_admin_orders_v1($1,$2,'','2020-05-01',null,'all',1) result",[op,actor])).rows[0].result;assert.deepEqual(found.ids,[old]);assert.equal(found.total,1);
 const foreign=(await db.query("insert into operators(name) values('Other operator') returning id")).rows[0].id;
 const person=(await db.query("insert into customers(operator_id,name) values($1,'Historic Guest %_') returning id",[foreign])).rows[0].id;
 await db.query('insert into orders(operator_id,customer_id,subtotal,total) values($1,$2,0,0)',[foreign,person]);assert.equal((await search('historic')).total,130);
});
test('search is stable and changes no booking or customer records',async()=>{const snapshot=async()=>(await db.query("select jsonb_build_object('orders',(select jsonb_agg(to_jsonb(o) order by id) from orders o),'bookings',(select jsonb_agg(to_jsonb(b) order by id) from bookings b),'customers',(select jsonb_agg(to_jsonb(c) order by id) from customers c)) data")).rows[0].data;const before=await snapshot();await search('historic');assert.deepEqual(await snapshot(),before);assert.equal((await db.query("select provolatile from pg_proc where proname='search_admin_orders_v1'")).rows[0].provolatile,'s');});
test('cross-operator, inactive/editor staff and public execution are denied',async()=>{await assert.rejects(search('','all',1,'20000000-0000-4000-8000-000000000001'),e=>e.code==='42501');for(const role of ['content_editor','operations']){await db.query('update staff_profiles set role=$1 where id=$2',[role,actor]);if(role==='content_editor')await assert.rejects(search(),e=>e.code==='42501');else assert.equal((await search('historic')).total,130);}await db.query('update staff_profiles set is_active=false where id=$1',[actor]);await assert.rejects(search(),e=>e.code==='42501');for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)','execute') allowed",[role])).rows[0].allowed,false);await db.query("update staff_profiles set role='owner',is_active=true where id=$1",[actor]);});

test('reviewed historical search rollback removes only its RPC/history and can reapply without data changes',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const {platformSql}=await import('../helpers/database.mjs');const {readFile,readdir}=await import('node:fs/promises');const db=new PGlite();
 try{
  await db.exec(platformSql);const dir=new URL('../../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<='20261030000300_admin_booking_search.sql').sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  await loadDevelopmentFixtures(db);
  const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
  const customer=(await db.query("insert into customers(operator_id,name) values($1,'Historical rollback fixture') returning id",[op])).rows[0].id;
  await db.query('insert into orders(operator_id,customer_id,subtotal,total) select $1,$2,0,0 from generate_series(1,4)',[op,customer]);
  const snapshot=async()=>(await db.query("select jsonb_build_object('orders',(select jsonb_agg(to_jsonb(o) order by id) from orders o),'bookings',(select jsonb_agg(to_jsonb(b) order by id) from bookings b),'customers',(select jsonb_agg(to_jsonb(c) order by id) from customers c),'items',(select jsonb_agg(to_jsonb(i) order by id) from booking_items i)) data")).rows[0].data;
  await db.exec("create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[]); insert into supabase_migrations.schema_migrations values('20261030000200','unified_product_workspace','{}'),('20261030000300','admin_booking_search','{}');");
  const before=await snapshot();await db.exec(await readFile(new URL('../../docs/releases/admin-workflows-20261030/rollback.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("select to_regprocedure('public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)') result")).rows[0].result,null);
  assert.deepEqual((await db.query('select version from supabase_migrations.schema_migrations')).rows.map(r=>r.version),['20261030000200']);assert.deepEqual(await snapshot(),before);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261030000300_admin_booking_search.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("select search_admin_orders_v1($1,$2,'Historical rollback fixture') result",[op,actor])).rows[0].result.total,4);assert.deepEqual(await snapshot(),before);
 }finally{await db.close();}
});
test('historical rollback refuses to remove the upgraded deletion-aware search function',async()=>{
 const {readFile}=await import('node:fs/promises');const before=(await db.query("select md5(prosrc) hash from pg_proc where oid='public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)'::regprocedure")).rows[0].hash;
 await assert.rejects(db.exec(await readFile(new URL('../../docs/releases/admin-workflows-20261030/rollback.sql',import.meta.url),'utf8')),/Search function differs/);await db.exec('rollback');
 assert.equal((await db.query("select md5(prosrc) hash from pg_proc where oid='public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)'::regprocedure")).rows[0].hash,before);
});
