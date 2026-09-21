import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { staffFixtures } from '../fixtures/staff.mjs';

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tables = ['operators', 'staff_profiles', 'suppliers', 'products', 'stops',
  'departures', 'customers', 'orders', 'booking_items', 'bookings', 'payments',
  'payment_events', 'refunds', 'vehicles', 'vehicle_positions', 'reviews',
  'content_pages', 'redirects', 'api_keys', 'domain_events', 'audit_logs', 'inventory_holds'];

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
    insert into inventory_holds(id,operator_id,departure_id,session_key,quantity,expires_at)
      values ('${id(15)}','${id(1)}','${id(9)}','test-session',2,now() + interval '1 hour');
  `);
});

after(async () => { await db.close(); });

async function rejects(sql, code) {
  await assert.rejects(db.exec(sql), (err) => err.code === code);
}

test('fresh migrations create all 22 core and hold tables with primary keys and timestamps', async () => {
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
  assert.equal(rows.length, tables.length);
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

// Each lifecycle scenario rolls back, preserving the Phase 1B regression fixtures.
async function isolated(run) {
  await db.exec('begin');
  try { await run(); } finally { await db.exec('rollback'); }
}

async function invalid(sql, code = '23514') {
  await db.exec('savepoint rejected_statement');
  try { await rejects(sql, code); }
  finally { await db.exec('rollback to savepoint rejected_statement; release savepoint rejected_statement'); }
}

const hold = `inventory_holds where id='${id(15)}'`;

test('holds enforce quantity, finite future expiry, session and tenant ownership', () => isolated(async () => {
  const insert = (values) => `insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at) values (${values})`;
  const base = `'${id(1)}','${id(9)}'`;
  await invalid(insert(`${base},'session',0,now()+interval '1 hour'`));
  await invalid(insert(`${base},'  ',1,now()+interval '1 hour'`));
  await invalid(insert(`${base},'session',1,now()-interval '1 second'`));
  await invalid(insert(`${base},'session',1,'infinity'`));
  await invalid(insert(`'${id(2)}','${id(9)}','session',1,now()+interval '1 hour'`), '23503');
  await invalid(`update inventory_holds set order_id='${id(999)}' where id='${id(15)}'`, '23503');
  await db.exec(`insert into customers(id,operator_id,name) values ('${id(20)}','${id(2)}','B');
    insert into orders(id,operator_id,customer_id,subtotal,total) values ('${id(21)}','${id(2)}','${id(20)}',0,0)`);
  await invalid(`update inventory_holds set order_id='${id(21)}' where id='${id(15)}'`, '23503');
}));

test('hold attaches to an order and consumes once with immutable timestamp and terms', () => isolated(async () => {
  await invalid(`update inventory_holds set status='consumed' where id='${id(15)}'`);
  await db.exec(`update inventory_holds set order_id='${id(11)}' where id='${id(15)}';
    update inventory_holds set status='consumed' where id='${id(15)}'`);
  const before = (await db.query(`select ended_at from ${hold}`)).rows[0];
  assert(before.ended_at);
  await db.exec(`update inventory_holds set status='consumed' where id='${id(15)}'`);
  assert.deepEqual((await db.query(`select ended_at from ${hold}`)).rows[0], before);
  for (const change of ["status='active'", "status='released'", 'quantity=3',
    "expires_at=expires_at+interval '1 hour'", 'order_id=null', 'ended_at=null']) {
    await invalid(`update inventory_holds set ${change} where id='${id(15)}'`);
  }
}));

test('released holds cannot consume, expire or reactivate', () => isolated(async () => {
  await invalid(`update inventory_holds set status='expired' where id='${id(15)}'`);
  await db.exec(`update inventory_holds set status='released' where id='${id(15)}'`);
  assert((await db.query(`select ended_at from ${hold}`)).rows[0].ended_at);
  for (const status of ['active', 'consumed', 'expired']) {
    await invalid(`update inventory_holds set status='${status}' where id='${id(15)}'`);
  }
  await db.exec(`update inventory_holds set status='released' where id='${id(15)}'`);
}));

test('elapsed hold cannot consume even inside a transaction started before expiry', () => isolated(async () => {
  await db.exec(`insert into inventory_holds(id,operator_id,departure_id,order_id,session_key,quantity,expires_at)
    values ('${id(30)}','${id(1)}','${id(9)}','${id(11)}','short-lived',1,clock_timestamp()+interval '100 milliseconds')`);
  // Wait for database time, not a mocked time or a rewritten expiry column.
  for (let attempt = 0; ; attempt++) {
    const { rows } = await db.query(`select expires_at <= clock_timestamp() as elapsed from inventory_holds where id=$1`, [id(30)]);
    if (rows[0].elapsed) break;
    assert(attempt < 100, 'hold did not expire within test deadline');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  await invalid(`update inventory_holds set status='consumed' where id='${id(30)}'`);
  await db.exec(`update inventory_holds set status='expired' where id='${id(30)}'`);
  const { rows } = await db.query(`select ended_at >= expires_at as ended_after_expiry from inventory_holds where id=$1`, [id(30)]);
  assert.equal(rows[0].ended_after_expiry, true);
  await db.exec(`update inventory_holds set status='expired' where id='${id(30)}'`);
  await invalid(`update inventory_holds set status='active' where id='${id(30)}'`);
}));

test('active hold reservation cannot be enlarged, moved, extended or rebound', () => isolated(async () => {
  for (const change of ['quantity=4', "session_key='other'", `operator_id='${id(2)}'`,
    `departure_id='${id(999)}'`, "expires_at=expires_at+interval '1 hour'", "created_at=created_at-interval '1 hour'"]) {
    await invalid(`update inventory_holds set ${change} where id='${id(15)}'`);
  }
  await db.exec(`update inventory_holds set order_id='${id(11)}' where id='${id(15)}'`);
  await invalid(`update inventory_holds set order_id=null where id='${id(15)}'`);
}));

test('unknown statuses and direct final-state inserts cannot bypass lifecycle guards', () => isolated(async () => {
  for (const table of ['orders', 'payments', 'bookings', 'booking_items', 'inventory_holds']) {
    await invalid(`update ${table} set status='not-a-state'`);
    await invalid(`update ${table} set status=null`);
  }
  await invalid(`insert into orders(operator_id,customer_id,subtotal,total,status)
    values ('${id(1)}','${id(10)}',0,0,'confirmed')`);
  await invalid(`insert into payments(operator_id,order_id,provider,amount,currency,status)
    values ('${id(1)}','${id(11)}','stripe',1,'EUR','paid')`);
  await invalid(`insert into bookings(operator_id,order_id,booking_reference,status)
    values ('${id(1)}','${id(11)}','ILLEGAL','confirmed')`);
  await invalid(`insert into booking_items(operator_id,order_id,product_id,quantity,unit_price,total_price,status)
    values ('${id(1)}','${id(11)}','${id(7)}',1,0,0,'confirmed')`);
  await invalid(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at,status)
    values ('${id(1)}','${id(9)}','bypass',1,now()+interval '1 hour','consumed')`);
}));

test('checkout proceeds through payment, confirmation and partial/full refunds without reverting', () => isolated(async () => {
  await invalid("update orders set status='confirmed'");
  for (const status of ['awaiting_payment', 'paid', 'confirmed', 'partially_refunded', 'refunded']) {
    await db.exec(`update orders set status='${status}'`);
    await db.exec(`update orders set status='${status}'`);
  }
  for (const status of ['pending', 'paid', 'confirmed', 'cancelled', 'expired']) {
    await invalid(`update orders set status='${status}'`);
  }
}));

test('unpaid orders can expire or cancel but cannot be reopened by late events', () => isolated(async () => {
  await db.exec("update orders set status='awaiting_payment'; update orders set status='expired'");
  await invalid("update orders set status='paid'");
  await invalid("update orders set status='pending'");
  await db.exec(`insert into orders(id,operator_id,customer_id,subtotal,total) values ('${id(31)}','${id(1)}','${id(10)}',1,1);
    update orders set status='cancelled' where id='${id(31)}'`);
  await invalid(`update orders set status='awaiting_payment' where id='${id(31)}'`);
}));

test('paid order cancellation allows refunds but cannot discard settlement by expiring', () => isolated(async () => {
  await db.exec("update orders set status='awaiting_payment'; update orders set status='paid'");
  await invalid("update orders set status='expired'");
  await db.exec("update orders set status='cancelled'; update orders set status='partially_refunded'; update orders set status='refunded'");
  await invalid("update orders set status='awaiting_payment'");
}));

test('new hold cannot forge end timestamps or a future creation date', () => isolated(async () => {
  await invalid(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at,ended_at)
    values ('${id(1)}','${id(9)}','bad-end',1,now()+interval '1 hour',now())`);
  await invalid(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,created_at,expires_at)
    values ('${id(1)}','${id(9)}','bad-created',1,now()+interval '1 hour',now()+interval '2 hours')`);
}));

test('failed payment retries and delayed success are allowed; settled money cannot become failed', () => isolated(async () => {
  for (const status of ['processing', 'failed', 'processing', 'failed', 'paid']) {
    await db.exec(`update payments set status='${status}'`);
  }
  await invalid("update payments set status='failed'");
  await invalid('update payments set provider_ref=null');
  await db.exec("update payments set status='partially_refunded'; update payments set status='refunded'");
  await invalid("update payments set status='paid'");
  await db.exec("update payments set status='refunded'");
}));

test('direct successful provider event needs no observed processing event, but does need a reference', () => isolated(async () => {
  await db.exec('update payments set provider_ref=null');
  await invalid("update payments set status='paid'");
  await db.exec("update payments set provider_ref='pi_verified',status='paid'");
  await db.exec("update payments set status='refunded'");
}));

test('booking timestamps are set once, preserved through cancellation and cannot be forged', () => isolated(async () => {
  await invalid('update bookings set confirmed_at=clock_timestamp()');
  await db.exec("update bookings set status='confirmed'");
  const confirmed = (await db.query('select confirmed_at from bookings')).rows[0].confirmed_at;
  assert(confirmed);
  await db.exec("update bookings set status='confirmed'");
  assert.deepEqual((await db.query('select confirmed_at from bookings')).rows[0].confirmed_at, confirmed);
  await invalid("update bookings set status='expired'");
  await db.exec("update bookings set status='cancelled'");
  const { rows } = await db.query('select confirmed_at, cancelled_at >= confirmed_at as ordered from bookings');
  assert.deepEqual(rows[0].confirmed_at, confirmed);
  assert.equal(rows[0].ordered, true);
  await invalid('update bookings set cancelled_at=null');
  await invalid("update bookings set status='confirmed'");
}));

test('pending bookings can cancel without a confirmation; items have independent fulfilment states', () => isolated(async () => {
  await db.exec("update bookings set status='cancelled'");
  assert.equal((await db.query('select confirmed_at from bookings')).rows[0].confirmed_at, null);
  await db.exec(`update booking_items set status='confirmed' where id='${id(12)}';
    update booking_items set status='cancelled' where id='${id(12)}';
    update booking_items set status='expired' where id='${id(13)}'`);
  await invalid(`update booking_items set status='confirmed' where id='${id(13)}'`);
  await invalid(`update booking_items set status='pending' where id='${id(12)}'`);
}));

test('all staff role fixtures persist; unknown roles and client self-promotion are rejected', () => isolated(async () => {
  for (const staff of staffFixtures) {
    await db.query('insert into auth.users(id) values ($1)', [staff.auth_user_id]);
    await db.query('insert into staff_profiles(id,operator_id,auth_user_id,role) values ($1,$2,$3,$4)',
      [staff.id, staff.operator_id, staff.auth_user_id, staff.role]);
  }
  const { rows } = await db.query('select role,is_active from staff_profiles where id = any($1::uuid[])', [staffFixtures.map((f) => f.id)]);
  assert.equal(rows.length, 4);
  assert(rows.every((r) => r.is_active === true));
  await invalid("update staff_profiles set role='superadmin'");
  await db.exec(`update staff_profiles set is_active=false where id='${staffFixtures[0].id}'`);
  assert.equal((await db.query('select is_active from staff_profiles where id=$1', [staffFixtures[0].id])).rows[0].is_active, false);
  await db.exec('set local role authenticated');
  await invalid("update staff_profiles set role='owner'", '42501');
}));
