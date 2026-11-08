import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('product edits drive calendar, public availability and stale hold guards; reactivation reuses IDs without duplicates',async()=>{
 const db=await createTestDatabase({now:'2026-09-23T00:00:00Z'});
 try{
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001';
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
 const product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Authority','authority','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
 const stamp=async(table,id)=>(await db.query(`select updated_at::text stamp from ${table} where id=$1`,[id])).rows[0].stamp;
 let schedule;
 const save=async times=>{schedule=(await db.query("select save_service_schedule_v1($1,$2,$3,'2026-09-24','2026-10-31',$4,$5,8,null,'active',$6) id",[op,actor,product,[1,2,3,4,5,6,7],JSON.stringify(times.map(time=>({time}))),schedule?await stamp('service_schedules',schedule):null])).rows[0].id;};
 const prices=async adult=>db.query('select save_passenger_pricing_v1($1,$2,$3,$4,$5)',[op,actor,product,JSON.stringify({adult:{min:13,max:null,price:adult},child:{min:3,max:12,price:500},infant:{min:0,max:2,price:0}}),await stamp('products',product)]);
 const availability=async()=> (await db.query("select read_passenger_availability_v1($1,$2,'2026-10-07','{\"adult\":1,\"child\":0,\"infant\":0}') value",[op,product])).rows[0].value;
 const calendar=async()=> (await db.query("select read_operations_calendar_v1($1,$2,$3,'2026-10-01') value",[op,actor,schedule])).rows[0].value.days.find(d=>d.date==='2026-10-07').slots;
 const active=async enabled=>db.query('select save_product_availability_v1($1,$2,$3,$4,$5,$6)',[op,actor,product,await stamp('products',product),enabled,enabled?'':'Paused']);
 await save(['09:00','15:00']);await prices(1000);
 const first=await availability(),old=first.departures.find(d=>d.start_time==='09:00:00');
 // Saving an unrelated date limit used to freeze a copy of the entire timetable.
 await db.query("select save_calendar_override_v1($1,$2,$3,'2026-10-07','2026-10-07',$4,$5,false,$6)",[op,actor,schedule,[1,2,3,4,5,6,7],JSON.stringify({capacity:7,prices:{adult:1}}),await stamp('service_schedules',schedule)]);
 await save(['11:00','15:00']);
 assert.deepEqual((await calendar()).map(s=>s.time),['11:00','15:00']);
 assert.deepEqual((await availability()).departures.map(d=>d.start_time),['11:00:00','15:00:00']);
 await db.query("update departures set status='scheduled' where id=$1",[old.id]);
 await assert.rejects(db.query("select create_product_hold_v1($1,$2,$3,gen_random_uuid(),1,'{\"adult\":1,\"child\":0,\"infant\":0}',$4)",[op,old.id,'authority-session-12345678901234567890',product]),e=>e.code==='P0002');
 await prices(1900);assert.equal((await availability()).departures[0].passenger_quote.total,1900);
 await active(false);assert.equal(await availability(),null);assert.deepEqual(await calendar(),[]);
 const linked=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,inventory_product_id) select operator_id,type,'Linked','authority-linked',status,pricing_rules,capacity_rules,id from products where id=$1 returning id`,[product])).rows[0].id;
 assert.deepEqual((await calendar()).map(s=>s.time),['11:00','15:00']);
 await db.query("update products set active=false,unavailable_message='Paused' where id=$1",[linked]);assert.deepEqual(await calendar(),[]);
 await active(true);assert.deepEqual((await calendar()).map(s=>s.time),['11:00','15:00']);
 const again=await availability();assert.equal(again.departures.find(d=>d.start_time==='15:00:00').id,first.departures.find(d=>d.start_time==='15:00:00').id);
 assert.equal(new Set(again.departures.map(d=>d.id)).size,2);
 }finally{await db.close();}
});
