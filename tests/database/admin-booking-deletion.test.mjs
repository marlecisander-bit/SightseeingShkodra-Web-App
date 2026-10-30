import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
const op='10000000-0000-4000-8000-000000000001',foreign='10000000-0000-4000-8000-000000000002';let db,owner,admin,product;
before(async()=>{
 db=await createTestDatabase({now:'2030-06-01T06:00:00Z'});await loadDevelopmentFixtures(db);
 for(const role of ['owner','admin']){const user=randomUUID();await db.query('insert into auth.users values($1)',[user]);const id=(await db.query('insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,$3) returning id',[op,user,role])).rows[0].id;if(role==='owner')owner=id;else admin=id;}
 product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,passenger_pricing) values($1,'van_tour','Deletion fixture','deletion-fixture','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}','{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}'::jsonb) returning id`,[op])).rows[0].id;
});
after(async()=>db?.close());
async function book(){const dep=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-01','15:00',2,'scheduled') returning id",[op,product])).rows[0].id;const session='deletion-session-'+randomUUID();const hold=(await db.query('select * from create_passenger_hold_v1($1,$2,$3,$4,1,$5)',[op,dep,session,randomUUID(),{adult:1,child:0,infant:0}])).rows[0];const result=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Deletion Guest','delete@example.test') result",[op,hold.id,session])).rows[0].result;const b=(await db.query('select * from bookings where order_id=$1',[result.orderId])).rows[0];return {...b,dep};}
const remove=(b,actor=owner,operator=op,reference=b.booking_reference)=>db.query("select delete_admin_booking_v1($1,$2,$3,$4,'Synthetic cleanup') result",[operator,actor,b.id,reference]);
const search=ref=>db.query("select search_admin_orders_v1($1,$2,$3) result",[op,owner,ref]);
test('permanently removes unpaid booking and invalidates tokens, releases seats, preserves order/items/customer and audit',async()=>{
 const b=await book();assert.equal((await search(b.booking_reference)).rows[0].result.total,1);
 await remove(b);assert.equal((await db.query('select * from bookings where id=$1',[b.id])).rows.length,0);
 assert.equal((await db.query('select * from bookings where qr_token=$1 or management_token=$2',[b.qr_token,b.management_token])).rows.length,0);
 assert.equal((await db.query('select * from orders where id=$1',[b.order_id])).rows.length,1);
 assert.equal((await db.query("select * from booking_items where order_id=$1 and status='confirmed'",[b.order_id])).rows.length,0);
 assert.equal((await search(b.booking_reference)).rows[0].result.total,0);
 assert.equal((await db.query("select count(*)::int n from audit_logs where entity_id=$1 and action='booking.deleted'",[b.id])).rows[0].n,1);
 const session='replacement-session-'+randomUUID();assert((await db.query('select * from create_passenger_hold_v1($1,$2,$3,$4,2,$5)',[op,b.dep,session,randomUUID(),{adult:2,child:0,infant:0}])).rows[0].id);
 await remove(b);assert.equal((await db.query("select count(*)::int n from audit_logs where entity_id=$1 and action='booking.deleted'",[b.id])).rows[0].n,1);
});
test('paid bookings retain exact payment/provider/refund evidence and request refund review without issuing refund',async()=>{
 const b=await book();await db.query('select collect_meeting_point_payment_v1($1,$2,$3)',[op,b.order_id,owner]);
 const before=(await db.query('select * from payments where order_id=$1',[b.order_id])).rows;
 await db.query("insert into refunds(operator_id,payment_id,provider,provider_ref,amount,status) values($1,$2,$3,'retained-refund-request',100,'pending')",[op,before[0].id,before[0].provider]);
 const refunds=(await db.query('select * from refunds where payment_id=$1',[before[0].id])).rows;
 await remove(b);assert.deepEqual((await db.query('select * from payments where order_id=$1',[b.order_id])).rows,before);
 assert.deepEqual((await db.query('select * from refunds where payment_id=$1',[before[0].id])).rows,refunds);
 assert.equal((await db.query("select count(*)::int n from domain_events where event_type='refund.review_requested' and aggregate_id=$1",[b.order_id])).rows[0].n,1);
});
test('owner only, active membership, exact reference, tenant and browser grants are enforced',async()=>{
 const b=await book();await assert.rejects(remove(b,admin),e=>e.code==='42501');await assert.rejects(remove(b,owner,foreign),e=>e.code==='42501');await assert.rejects(remove(b,owner,op,'wrong'),e=>e.code==='P0002');
 await db.query('update staff_profiles set is_active=false where id=$1',[owner]);await assert.rejects(remove(b),e=>e.code==='42501');await db.query('update staff_profiles set is_active=true where id=$1',[owner]);
 for(const role of ['anon','authenticated']){assert.equal((await db.query("select has_function_privilege($1,'public.delete_admin_booking_v1(uuid,uuid,uuid,text,text)','execute') ok",[role])).rows[0].ok,false);}
 assert.equal((await db.query('select * from bookings where id=$1',[b.id])).rows.length,1);
});
test('notification history stays referentially valid; pending deliveries are skipped and receipts hidden',async()=>{
 const b=await book();await db.query("select enqueue_booking_emails_v2($1,'2030-06-01')",[op]);await db.query("select project_admin_notifications_v1($1,'2030-06-01')",[op]);
 const before=(await db.query('select id from notification_deliveries where booking_id=$1',[b.id])).rows;assert(before.length>0);
 await remove(b);assert.equal((await db.query("select * from notification_deliveries where booking_id=$1 and status<>'skipped'",[b.id])).rows.length,0);
 assert.equal((await db.query('select id from notification_deliveries where booking_id=$1',[b.id])).rows.length,before.length);
 assert.equal((await db.query('select r.id from admin_notification_receipts r join admin_notifications n on n.id=r.notification_id where n.booking_id=$1 and r.visible',[b.id])).rows.length,0);
 await db.query("select enqueue_booking_emails_v2($1,'2030-06-01')",[op]);assert.equal((await db.query('select id from notification_deliveries where booking_id=$1',[b.id])).rows.length,before.length);
 const original=(await db.query('select * from notification_deliveries where booking_id=$1 limit 1',[b.id])).rows[0];
 assert.equal((await db.query("insert into notification_deliveries(operator_id,event_id,booking_id,recipient_type,event_type,manual) values($1,$2,$3,'customer','BOOKING_CREATED',true) returning id",[op,original.event_id,b.id])).rows.length,0);
});
test('processing payments and in-flight messages block deletion transactionally; retry succeeds after resolution',async()=>{
 const b=await book();const p=(await db.query("insert into payments(operator_id,order_id,provider,amount,currency,status) values($1,$2,'stripe',1000,'EUR','pending') returning id",[op,b.order_id])).rows[0].id;
 await db.query("update payments set status='processing' where id=$1",[p]);
 await assert.rejects(remove(b),e=>e.code==='PT409');assert.equal((await db.query('select status from bookings where id=$1',[b.id])).rows[0].status,'confirmed');
 await db.query("update payments set status='failed' where id=$1",[p]);await db.query("select enqueue_booking_emails_v2($1,'2030-06-01')",[op]);
 const d=(await db.query('select id from notification_deliveries where booking_id=$1 limit 1',[b.id])).rows[0].id;
 await db.query("update notification_deliveries set status='sending',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes' where id=$1",[d]);
 await assert.rejects(remove(b),e=>e.code==='PT409');await db.query("update notification_deliveries set status='accepted',lease_token=null,lease_until=null where id=$1",[d]);
 await remove(b);assert.equal((await db.query('select status from notification_deliveries where id=$1',[d])).rows[0].status,'accepted');
});
test('deleted identity cannot be resurrected and customer tokens stop resolving',async()=>{
 const b=await book();await remove(b);await assert.rejects(db.query("insert into bookings(operator_id,order_id,booking_reference,status) values($1,$2,'RECREATED','pending')",[op,b.order_id]),e=>e.code==='PT409');
 await assert.rejects(db.query('select customer_booking_v1($1)',[b.management_token]));
});
