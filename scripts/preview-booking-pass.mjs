import {mkdir,writeFile} from 'node:fs/promises';
import {createTestDatabase,loadDevelopmentFixtures} from '../tests/helpers/database.mjs';
const db=await createTestDatabase();
try{
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000020';
 await db.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}' where id=$1`,[product]);
 const dep=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2031-09-25','15:00',8,'scheduled') returning id",[op,product])).rows[0].id;
 const session='qr-preview-local-session-1234567890123456';
 const h=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),3)',[op,dep,session])).rows[0];
 const order=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Preview Guest','preview@example.invalid') as data",[op,h.id,session])).rows[0].data;
 const row=(await db.query('select qr_token,qr_created_at,checked_in_at from bookings where order_id=$1',[order.orderId])).rows[0];
 order.pass={token:row.qr_token,createdAt:row.qr_created_at,checkedInAt:row.checked_in_at,departures:[{date:'2031-09-25',time:'15:00:00',guests:3}]};
 await mkdir('private',{recursive:true});await writeFile('private/qr-pass-preview.json',JSON.stringify(order));console.log('Created isolated database-confirmed pass preview. No hosted booking created.');
}finally{await db.close();}
