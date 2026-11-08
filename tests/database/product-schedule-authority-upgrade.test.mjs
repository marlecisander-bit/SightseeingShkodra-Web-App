import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('upgrade preserves date closures and reservations while removing copied timetables and fare overrides',async()=>{
 const db=new PGlite(),dir=new URL('../../supabase/migrations/',import.meta.url),migration='20261108000100_product_schedule_authority.sql';
 try{
 await db.exec(platformSql);
 for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001';
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
 const product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,passenger_pricing) values($1,'van_tour','Upgrade','authority-upgrade','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}','{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}') returning id`,[op])).rows[0].id;
 const schedule=(await db.query(`select save_service_schedule_v1($1,$2,$3,'2030-06-01','2030-06-30',array[1,2,3,4,5,6,7],'[{"time":"09:00"},{"time":"15:00"}]',8,null,'active',null) id`,[op,actor,product])).rows[0].id;
 const stamp=async()=>(await db.query('select updated_at::text stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 await db.query(`select save_calendar_override_v1($1,$2,$3,'2030-06-10','2030-06-10',array[1,2,3,4,5,6,7],' {"times":[{"time":"15:00","capacity":6},{"time":"17:00"}],"prices":{"adult":1}}',false,$4)`,[op,actor,schedule,await stamp()]);
 const old=(await db.query("select read_passenger_availability_v1($1,$2,'2030-06-10','{\"adult\":1,\"child\":0,\"infant\":0}') data",[op,product])).rows[0].data.departures;
 assert.deepEqual(old.map(d=>d.start_time),['15:00:00','17:00:00']);
 const hold=(await db.query("select * from create_passenger_hold_v1($1,$2,$3,gen_random_uuid(),1,'{\"adult\":1,\"child\":0,\"infant\":0}')",[op,old[1].id,'authority-upgrade-session-1234567890123'])).rows[0];
 const booking=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Upgrade','upgrade@example.test') data",[op,hold.id,'authority-upgrade-session-1234567890123'])).rows[0].data;
 await db.exec(await readFile(new URL(migration,dir),'utf8'));
 const slots=(await db.query("select read_operations_calendar_v1($1,$2,$3,'2030-06-01') data",[op,actor,schedule])).rows[0].data.days.find(d=>d.date==='2030-06-10').slots;
 assert.deepEqual(slots.map(s=>[s.time,s.open]),[['15:00',true],['17:00',false]]);
 assert.equal(slots[0].capacity,6);assert.equal(slots[0].quote.total,1000);assert.equal(slots[1].booked,1);
 assert.equal((await db.query('select total from orders where id=$1',[booking.orderId])).rows[0].total,1);
 const available=(await db.query("select read_passenger_availability_v1($1,$2,'2030-06-10','{\"adult\":1,\"child\":0,\"infant\":0}') data",[op,product])).rows[0].data;
 assert.deepEqual(available.departures.map(d=>d.start_time),['15:00:00']);
 assert.equal((await db.query('select status from booking_items where order_id=$1',[booking.orderId])).rows[0].status,'confirmed');
 }finally{await db.close();}
});
