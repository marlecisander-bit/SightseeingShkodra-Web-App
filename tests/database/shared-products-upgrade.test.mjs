import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('migration preserves existing booking, QR, management capability, prices and events while backfilling inventory snapshots',async()=>{
 const db=new PGlite();try{
  await db.exec(platformSql);const dir=new URL('../../supabase/migrations/',import.meta.url);const files=(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();
  for(const f of files.filter(f=>f<'20261030000100_shared_van_products.sql'))await db.exec(await readFile(new URL(f,dir),'utf8'));
  await loadDevelopmentFixtures(db);const op='10000000-0000-4000-8000-000000000001',p='10000000-0000-4000-8000-000000000020',dep='10000000-0000-4000-8000-000000000052',session='existing-before-migration-session-123456';
  await db.query(`update products set status='published',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}',capacity_rules='{"version":1,"model":"departure_seats"}' where id=$1`,[p]);await db.query("update departures set status='scheduled' where id=$1",[dep]);
  const hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),2)',[op,dep,session])).rows[0];
  const booking=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic','synthetic@example.invalid') data",[op,hold.id,session])).rows[0].data;
  const read=async()=>(await db.query('select b.booking_reference,b.qr_token,b.management_token,b.status,o.total,i.product_id,i.quantity,i.passenger_snapshot,(select count(*)::int from domain_events) events from bookings b join orders o on o.id=b.order_id join booking_items i on i.order_id=o.id where o.id=$1',[booking.orderId])).rows[0];
  const before=await read();await db.exec(await readFile(new URL('../../docs/SHARED-VAN-PRODUCTS-PREFLIGHT.sql',import.meta.url),'utf8'));assert.deepEqual(await read(),before);await db.exec(await readFile(new URL('20261030000100_shared_van_products.sql',dir),'utf8'));assert.deepEqual(await read(),before);
  const item=(await db.query('select inventory_product_id,reservation_snapshot from booking_items where order_id=$1',[booking.orderId])).rows[0];assert.equal(item.inventory_product_id,p);assert.equal(item.reservation_snapshot.mode,'selected_departure');assert.equal(item.reservation_snapshot.minutes,120);
  assert.equal((await db.query('select customer_booking_v1($1) data',[before.management_token])).rows[0].data.reservationSnapshot.mode,'selected_departure');
 }finally{await db.close();}
});
