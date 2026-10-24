import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {summarizeBookings} from '../../src/modules/dashboard/daily-bookings.ts';
let db,actor,product,schedule,order;
const op='10000000-0000-4000-8000-000000000001',now=new Date('2026-10-07T06:00:00Z');
const counts={adult:1,child:1,infant:1};
before(async()=>{
 db=await createTestDatabase({now:'2026-10-07T06:00:00Z'});await loadDevelopmentFixtures(db);
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
 product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Dashboard test','dashboard-test','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
 schedule=(await db.query("select save_service_schedule_v1($1,$2,$3,'2026-10-01','2026-10-31',$4,$5,8,null,'active') id",[op,actor,product,[1,2,3,4,5,6,7],JSON.stringify([{time:'15:00'}])])).rows[0].id;
 const stamp=(await db.query('select updated_at::text stamp from products where id=$1',[product])).rows[0].stamp;
 await db.query('select save_passenger_pricing_v1($1,$2,$3,$4,$5)',[op,actor,product,JSON.stringify({adult:{min:13,max:null,price:1000},child:{min:3,max:12,price:500},infant:{min:0,max:2,price:0}}),stamp]);
 // Materialization belongs to explicit synthetic fixture preparation, never the dashboard read.
 const dep=(await db.query('select read_passenger_availability_v1($1,$2,$3,$4) a',[op,product,'2026-10-07',JSON.stringify(counts)])).rows[0].a.departures[0];
 const session='dashboard-local-session-1234567890123456789';
 const hold=(await db.query('select * from create_passenger_hold_v1($1,$2,$3,gen_random_uuid(),3,$4)',[op,dep.id,session,JSON.stringify(counts)])).rows[0];
 order=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic Customer','dashboard@example.test',null) o",[op,hold.id,session])).rows[0].o;
});
after(async()=>db?.close());
// SQL equivalent of the PostgREST inner relationships/filters; existing FKs guarantee one order/booking per item.
async function read(){
 const result=await db.query(`select i.id,i.operator_id,i.status,i.quantity,i.occupied_seats,i.total_price::text,
 jsonb_build_object('operator_id',d.operator_id,'service_date',d.service_date::text) departure,
 jsonb_build_object('operator_id',o.operator_id,'status',o.status,'currency',o.currency,'booking',jsonb_build_object('operator_id',b.operator_id,'status',b.status)) "order"
 from booking_items i join departures d on d.operator_id=i.operator_id and d.product_id=i.product_id and d.id=i.departure_id
 join orders o on o.operator_id=i.operator_id and o.id=i.order_id
 join bookings b on b.operator_id=o.operator_id and b.order_id=o.id
 where i.operator_id=$1 and i.status='confirmed' and d.operator_id=$1 and d.service_date=$2
 and o.operator_id=$1 and o.status='confirmed' and b.operator_id=$1 and b.status='confirmed' order by i.id`,[op,'2026-10-07']);
 return summarizeBookings(op,now,'Europe/Tirane',result.rows,result.rows.length);
}
async function fingerprints(){const r={};for(const table of ['departures','orders','bookings','booking_items','inventory_holds','domain_events','audit_logs','admin_notifications'])r[table]=(await db.query(`select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) hash from ${table} t`)).rows[0].hash;return r;}
test('dashboard equivalent SELECT is valid in read-only transaction and preserves all domain records',async()=>{
 const before=await fingerprints();await db.exec('begin read only');try{
  const result=await read();assert.equal(result.state,'ready');assert.equal(result.passengers,3);assert.equal(result.seats,2);assert.equal(result.bookedMinor,1500);
 }finally{await db.exec('rollback');}
 assert.deepEqual(await fingerprints(),before);
});
test('booked value does not require cash collection and closed departures retain confirmed reservations',async()=>{
 assert.equal((await db.query('select count(*)::int n from payments where order_id=$1',[order.orderId])).rows[0].n,0);
 const stamp=(await db.query('select updated_at::text stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 await db.query('select save_calendar_override_v1($1,$2,$3,$4,$4,$5,$6,true,$7)',[op,actor,schedule,'2026-10-07',[1,2,3,4,5,6,7],JSON.stringify({closed:true}),stamp]);
 assert.equal((await read()).passengers,3);assert.equal((await read()).bookedMinor,1500);
});
test('existing cancellation transaction removes passengers and booked value without rewriting prices',async()=>{
 await db.query('select cancel_order_v1($1,$2,$3,$4)',[op,order.orderId,actor,'Synthetic cancellation']);
 const result=await read();assert.equal(result.state,'ready');assert.equal(result.passengers,0);assert.equal(result.seats,0);assert.equal(result.bookedMinor,0);
 assert.equal((await db.query('select total_price::text amount from booking_items where order_id=$1',[order.orderId])).rows[0].amount,'1500');
});
