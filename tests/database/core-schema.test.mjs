import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tables = ['operators', 'staff_profiles', 'suppliers', 'products', 'stops',
  'departures', 'customers', 'orders', 'booking_items', 'bookings', 'payments',
  'payment_events', 'refunds', 'vehicles', 'vehicle_positions', 'reviews',
  'content_pages', 'redirects', 'api_keys', 'domain_events', 'audit_logs'];

before(async () => {
  // Only the Supabase platform prerequisites are stubbed. Application SQL is unmodified.
  await db.exec(`create schema auth; create table auth.users (id uuid primary key);
    create role anon nologin; create role authenticated nologin;
    grant usage on schema public to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;`);
  const dir = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  }
  await db.exec(`
    insert into auth.users values ('${id(90)}');
    insert into operators(id,name) values ('${id(1)}','Operator A'),('${id(2)}','Operator B');
    insert into staff_profiles(id,operator_id,auth_user_id,role) values ('${id(3)}','${id(1)}','${id(90)}','owner');
    insert into suppliers(id,operator_id,name,type) values ('${id(4)}','${id(1)}','Supplier A','owned');
    insert into products(id,operator_id,supplier_id,type,title,slug) values
      ('${id(5)}','${id(1)}','${id(4)}','van_tour','Tour A','tour'),
      ('${id(6)}','${id(2)}',null,'boat_trip','Tour B','tour'),
      ('${id(7)}','${id(1)}',null,'attraction_ticket','Ticket','ticket');
    insert into vehicles(id,operator_id,name) values ('${id(8)}','${id(1)}','Van A');
    insert into departures(id,operator_id,product_id,vehicle_id,service_date,start_time,capacity)
      values ('${id(9)}','${id(1)}','${id(5)}','${id(8)}','2026-10-01','10:00',8);
    insert into customers(id,operator_id,name) values ('${id(10)}','${id(1)}','Customer A');
    insert into orders(id,operator_id,customer_id,subtotal,total) values ('${id(11)}','${id(1)}','${id(10)}',3000,3000);
    insert into booking_items(id,operator_id,order_id,product_id,departure_id,quantity,unit_price,total_price)
      values ('${id(12)}','${id(1)}','${id(11)}','${id(5)}','${id(9)}',2,1000,2000),
      ('${id(13)}','${id(1)}','${id(11)}','${id(7)}',null,1,1000,1000);
    insert into bookings(operator_id,order_id,booking_reference) values ('${id(1)}','${id(11)}','TEST-A');
    insert into payments(id,operator_id,order_id,provider,provider_ref,amount,currency)
      values ('${id(14)}','${id(1)}','${id(11)}','stripe','pi_test',3000,'EUR');
    insert into payment_events(operator_id,payment_id,provider,provider_event_id,event_type,payload)
      values ('${id(1)}','${id(14)}','stripe','evt_test','payment.succeeded','{}');
    insert into refunds(operator_id,payment_id,provider,provider_ref,amount)
      values ('${id(1)}','${id(14)}','stripe','re_test',1000);
    insert into stops(operator_id,product_id,name,lat,lng,sort_order)
      values ('${id(1)}','${id(5)}','Stop',42.06,19.51,0);
    insert into vehicle_positions(operator_id,vehicle_id,lat,lng) values ('${id(1)}','${id(8)}',42.06,19.51);
    insert into reviews(operator_id,product_id,rating,body,source,author)
      values ('${id(1)}','${id(5)}',5,'Test review','test','Test author');
    insert into content_pages(operator_id,slug,title) values ('${id(1)}','explore','Explore');
    insert into redirects(operator_id,old_path,new_path) values ('${id(1)}','/a','/b');
    insert into api_keys(operator_id,partner_label,key_hash) values ('${id(1)}','Test partner',repeat('a',64));
    insert into domain_events(operator_id,aggregate_type,aggregate_id,event_type,payload)
      values ('${id(1)}','order','${id(11)}','order.created','{}');
    insert into audit_logs(operator_id,actor_id,action,entity_type,entity_id)
      values ('${id(1)}','${id(3)}','created','product','${id(5)}');
  `);
});

after(async () => { await db.close(); });

async function rejects(sql, code) {
  await assert.rejects(db.exec(sql), (err) => err.code === code);
}

test('fresh migration creates exactly the 21 Phase 1B tables with primary keys and timestamps', async () => {
  const result = await db.query(`select tablename from pg_tables where schemaname='public' order by tablename`);
  assert.deepEqual(result.rows.map((r) => r.tablename), [...tables].sort());
  for (const table of tables) {
    const columns = await db.query(`select column_name from information_schema.columns where table_schema='public' and table_name=$1`, [table]);
    assert(columns.rows.some((r) => r.column_name === 'created_at'));
    const pk = await db.query(`select 1 from information_schema.table_constraints where table_schema='public' and table_name=$1 and constraint_type='PRIMARY KEY'`, [table]);
    assert.equal(pk.rows.length, 1);
  }
});

test('valid multi-product order with scheduled and unscheduled items is preserved', async () => {
  const { rows } = await db.query(`select count(*)::int as count, sum(total_price)::text as total from booking_items where order_id=$1`, [id(11)]);
  assert.deepEqual(rows[0], { count: 2, total: '3000' });
});

test('mutable rows receive a database-managed update timestamp', async () => {
  const { rows } = await db.query(`update products set title='Updated tour', updated_at='2000-01-01' where id=$1 returning updated_at > '2000-01-02'::timestamptz as refreshed`, [id(5)]);
  assert.equal(rows[0].refreshed, true);
});

test('tenant ownership is mandatory on every operator-owned table', async () => {
  const { rows } = await db.query(`select table_name from information_schema.columns where table_schema='public' and column_name='operator_id' and is_nullable='NO'`);
  assert.deepEqual(rows.map((r) => r.table_name).sort(), tables.filter((t) => t !== 'operators').sort());
});

test('cross-operator relationships are rejected across the business graph', async () => {
  const changes = [
    ['products', 'supplier_id', 4, 6],
    ['booking_items', 'product_id', 6, 13],
  ];
  for (const [table, column, value, row] of changes) {
    await rejects(`update ${table} set ${column}='${id(value)}' where id='${id(row)}'`, '23503');
  }
  // Updating ownership alone must fail wherever an existing parent belongs to A.
  for (const table of ['staff_profiles', 'stops', 'departures', 'orders', 'booking_items',
    'bookings', 'payments', 'payment_events', 'refunds', 'vehicle_positions', 'reviews', 'audit_logs']) {
    await rejects(`update ${table} set operator_id='${id(2)}' where operator_id='${id(1)}'`, '23503');
  }
});

test('booking item departure must belong to its selected product', async () => {
  await rejects(`update booking_items set departure_id='${id(9)}' where id='${id(13)}'`, '23503');
});

test('money, quantity and capacity reject invalid values', async () => {
  await rejects(`update orders set total=-1`, '23514');
  await rejects(`update booking_items set quantity=0`, '23514');
  await rejects(`update booking_items set unit_price=-1`, '23514');
  await rejects(`update departures set capacity=-1`, '23514');
  await rejects(`update refunds set amount=0`, '23514');
  await rejects(`update payments set currency='USD'`, '23503');
  await rejects(`update orders set currency='eur'`, '23514');
});

test('provider event identities and refund references prevent duplicate records', async () => {
  await rejects(`insert into payment_events(operator_id,payment_id,provider,provider_event_id,event_type,payload)
    values ('${id(1)}','${id(14)}','stripe','evt_test','payment.succeeded','{}')`, '23505');
  await rejects(`insert into refunds(operator_id,payment_id,provider,provider_ref,amount)
    values ('${id(1)}','${id(14)}','stripe','re_test',1000)`, '23505');
  await rejects(`update payment_events set provider='other'`, '23503');
});

test('slugs are scoped by operator and image alt text is required', async () => {
  await rejects(`update products set slug='tour' where id='${id(7)}'`, '23505');
  await rejects(`update products set og_image='/photo.jpg' where id='${id(5)}'`, '23514');
  await rejects(`update content_pages set og_image='/photo.jpg'`, '23514');
});

test('invalid geo coordinates, ratings and duplicate current positions are rejected', async () => {
  await rejects(`update vehicle_positions set lat=91`, '23514');
  await rejects(`update vehicle_positions set lng='NaN'::float8`, '23514');
  await rejects(`update vehicle_positions set speed='Infinity'::float8`, '23514');
  await rejects(`update reviews set rating=6`, '23514');
  await rejects(`insert into vehicle_positions(operator_id,vehicle_id,lat,lng) values ('${id(1)}','${id(8)}',0,0)`, '23505');
});

test('unsafe structural inputs and deletion of financial parents are rejected', async () => {
  await rejects(`update redirects set new_path=old_path`, '23514');
  await rejects(`update redirects set new_path='//example.com'`, '23514');
  await rejects(`update api_keys set key_hash='raw-secret'`, '23514');
  await rejects(`delete from orders where id='${id(11)}'`, '23503');
  await rejects(`delete from auth.users where id='${id(90)}'`, '23503');
});

test('all tables enable RLS and explicitly revoke default client privileges', async () => {
  const { rows } = await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity`);
  assert.equal(rows.length, 21);
  for (const role of ['anon', 'authenticated']) {
    for (const table of tables) {
      const privileges = await db.query(`select has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as allowed`, [role, `public.${table}`]);
      assert.equal(privileges.rows[0].allowed, false, `${role}: ${table}`);
    }
    await db.exec(`set role ${role}`);
    try {
      await rejects('select * from orders', '42501');
    } finally { await db.exec('reset role'); }
  }
});

test('RLS still hides data if a later migration grants SELECT without a policy', async () => {
  await db.exec('begin; grant select on all tables in schema public to authenticated; set local role authenticated;');
  try {
    for (const table of tables) {
      const { rows } = await db.query(`select count(*)::int as count from ${table}`);
      assert.equal(rows[0].count, 0, table);
    }
  } finally { await db.exec('rollback'); }
});
