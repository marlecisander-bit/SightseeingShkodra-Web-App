import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
const dir=new URL('../../supabase/migrations/',import.meta.url),migration='20261023000100_email_provider_outcomes.sql';
test('duplicate provider IDs abort the migration atomically; correcting the fixture allows additive upgrade',async()=>{
 const db=new PGlite();try{
  await db.exec(platformSql);for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));await loadDevelopmentFixtures(db);
  const op='10000000-0000-4000-8000-000000000001';
  const c=(await db.query("insert into customers(operator_id,name,email) values($1,'Synthetic','fixture@example.invalid') returning id",[op])).rows[0].id;
  const order=(await db.query("insert into orders(operator_id,customer_id,currency,subtotal,total) values($1,$2,'EUR',100,100) returning id",[op,c])).rows[0].id;
  const b=(await db.query("insert into bookings(operator_id,order_id,booking_reference,status) values($1,$2,'SS-MIGRATION-FIXTURE','pending') returning id",[op,order])).rows[0].id;
  for(const recipient of ['customer','owner']){
   const e=(await db.query("insert into domain_events(operator_id,aggregate_type,aggregate_id,event_type,payload) values($1,'booking',$2,'booking.confirmed','{}') returning id",[op,b])).rows[0].id;
   await db.query("insert into notification_deliveries(operator_id,event_id,booking_id,recipient_type,event_type,channel,status,provider,provider_reference) values($1,$2,$3,$4,'BOOKING_CREATED','email','accepted','resend','duplicate-synthetic')",[op,e,b,recipient]);
  }
  const sql=await readFile(new URL(migration,dir),'utf8');await assert.rejects(db.exec(sql),e=>e.code==='23505');await db.exec('rollback');
  assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_schema='public' and table_name='notification_deliveries' and column_name='provider_status'")).rows[0].n,0);
  assert.equal((await db.query("select to_regclass('public.email_provider_events') name")).rows[0].name,null);
  assert.equal((await db.query('select count(*)::int n from bookings where id=$1',[b])).rows[0].n,1);
  await db.query("update notification_deliveries set provider_reference='unique-owner-synthetic' where recipient_type='owner'");await db.exec(sql);
  assert.equal((await db.query('select count(*)::int n from notification_deliveries where booking_id=$1 and status=\'accepted\'',[b])).rows[0].n,2);
  assert.equal((await db.query("select count(*)::int n from notification_deliveries where booking_id=$1 and delivery_state='accepted' and provider_check_count=0",[b])).rows[0].n,2);
  // Prior sender RPC still operates on the expanded composite row; no pending job
  // is manufactured by the additive upgrade or a read-only claim of this queue.
  assert.equal((await db.query("select * from claim_booking_email_v2($1,'2020-01-01')",[op])).rows.length,0);
 }finally{await db.close();}
});
