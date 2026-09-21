import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import EmbeddedPostgres from 'embedded-postgres';
import { platformSql, applyMigrations, loadDevelopmentFixtures } from '../helpers/database.mjs';

let cluster, directory, observer, first, second;
const clients = [];

// Registration order is intentional: this fixture is independent of later tests.
test('staff cancellation releases unpaid inventory and queues paid refund review exactly once', async () => {
  const op='10000000-0000-4000-8000-000000000001', product='10000000-0000-4000-8000-000000000020';
  const user=(await observer.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  const actor=(await observer.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'operations') returning id",[op,user])).rows[0].id;
  await observer.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`,[product]);
  for (const paid of [false,true]) {
    const dep=(await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-10-01','12:00',1,'scheduled') returning id`,[op,product])).rows[0].id;
    const session='synthetic-cancellation-session-123456789';
    const hold=(await first.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,dep,session])).rows[0];
    const order=(await first.query("select create_pending_order_v1($1,$2,$3,'Test','test@example.invalid') as result",[op,hold.id,session])).rows[0].result;
    if(paid) {
      await first.query('select prepare_booking_v1($1,$2,$3)',[op,order.orderId,session]);
      const payment=(await observer.query("insert into payments(operator_id,order_id,provider,provider_ref,amount,currency) values($1,$2,'test',gen_random_uuid()::text,1250,'EUR') returning id",[op,order.orderId])).rows[0].id;
      await observer.query("update payments set status='paid' where id=$1",[payment]);
      await first.query('select confirm_booking_v1($1,$2,$3)',[op,order.orderId,payment]);
    }
    const sql="select cancel_order_v1($1,$2,$3,'Staff cancellation test') as result", args=[op,order.orderId,actor];
    await assert.rejects(first.query(sql,[op,order.orderId,user]),error=>error.code==='42501');
    await first.query('begin');
    await first.query(sql,args);
    await first.query('rollback');
    assert.equal((await observer.query('select status from orders where id=$1',[order.orderId])).rows[0].status,paid?'confirmed':'pending');
    await first.query('begin');
    let pending;
    try {
      const cancelled=(await first.query(sql,args)).rows[0].result;
      pending=second.query(sql,args).then(result=>({result}),error=>({error}));
      await waitForLock();
      await first.query('commit');
      const replay=await pending; assert.ifError(replay.error);
      assert.deepEqual(replay.result.rows[0].result,cancelled);
      assert.equal(cancelled.refundReviewRequired,paid);
      assert.equal((await observer.query("select count(*)::int as n from booking_items where order_id=$1 and status='confirmed'",[order.orderId])).rows[0].n,0);
      assert.equal((await observer.query('select status from inventory_holds where id=$1',[hold.id])).rows[0].status,paid?'consumed':'released');
      assert.equal((await observer.query("select count(*)::int as n from domain_events where aggregate_id=$1 and event_type='refund.review_requested'",[order.orderId])).rows[0].n,paid?1:0);
      if(paid) assert.equal((await observer.query('select status from payments where order_id=$1',[order.orderId])).rows[0].status,'paid');
      assert.equal((await observer.query('select count(*)::int as n from refunds')).rows[0].n,0);
    } finally { await first.query('rollback'); if(pending)await pending; }
  }
});

test('confirmation requires settled evidence and atomically consumes inventory once under concurrent replay', async () => {
  const op='10000000-0000-4000-8000-000000000001', product='10000000-0000-4000-8000-000000000020';
  await observer.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`,[product]);
  const dep=(await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-09-01','12:00',1,'scheduled') returning id`,[op,product])).rows[0].id;
  const session='synthetic-lifecycle-session-key-123456';
  const h=(await first.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,dep,session])).rows[0];
  const order=(await first.query("select create_pending_order_v1($1,$2,$3,'Test','test@example.invalid') as result",[op,h.id,session])).rows[0].result;
  const prepare='select * from prepare_booking_v1($1,$2,$3)';
  const b=(await first.query(prepare,[op,order.orderId,session])).rows[0];
  assert.equal(b.status,'pending');
  assert.equal((await first.query(prepare,[op,order.orderId,session])).rows[0].id,b.id);
  const pay=(await observer.query("insert into payments(operator_id,order_id,provider,provider_ref,amount,currency) values($1,$2,'test','synthetic-confirmation',1250,'EUR') returning id",[op,order.orderId])).rows[0].id;
  const sql='select * from confirm_booking_v1($1,$2,$3)', args=[op,order.orderId,pay];
  await assert.rejects(first.query(sql,args),error=>error.code==='P0001');
  assert.equal((await observer.query('select status from inventory_holds where id=$1',[h.id])).rows[0].status,'active');
  // Synthetic evidence only inside this disposable database; no provider payment is performed.
  await observer.query("update payments set status='paid' where id=$1",[pay]);
  for (const mutation of [
    () => first.query('update payments set amount=1 where id=$1',[pay]),
    () => first.query("update inventory_holds set status='released' where id=$1",[h.id]),
    () => first.query('update departures set capacity=0 where id=$1',[dep]),
  ]) {
    await first.query('begin');
    try { await mutation(); await assert.rejects(first.query(sql,args),error=>error.code==='P0001'); }
    finally { await first.query('rollback'); }
  }
  await first.query('begin');
  await first.query(sql,args);
  await first.query('rollback');
  assert.equal((await observer.query('select status from inventory_holds where id=$1',[h.id])).rows[0].status,'active');
  await first.query('begin');
  let pending;
  try {
    const confirmed=(await first.query(sql,args)).rows[0];
    pending=second.query(sql,args).then(result=>({result}),error=>({error}));
    await waitForLock();
    await first.query('commit');
    const replay=await pending;
    assert.ifError(replay.error);
    assert.deepEqual(replay.result.rows[0],confirmed);
    assert.equal(confirmed.status,'confirmed');
    assert.ok(confirmed.confirmed_at);
    assert.equal((await observer.query('select status from inventory_holds where id=$1',[h.id])).rows[0].status,'consumed');
    assert.equal((await observer.query('select status from orders where id=$1',[order.orderId])).rows[0].status,'confirmed');
    assert.equal((await observer.query("select count(*)::int as n from domain_events where aggregate_id=$1 and event_type='booking.confirmed'",[b.id])).rows[0].n,1);
    await observer.query('set role authenticated');
    try { await assert.rejects(observer.query(sql,args),error=>error.code==='42501'); }
    finally { await observer.query('reset role'); }
  } finally { await first.query('rollback'); if(pending)await pending; }
});

test('checkout rejects expired/released holds and invalid pricing without creating records', async () => {
  const op = '10000000-0000-4000-8000-000000000001', product = '10000000-0000-4000-8000-000000000020';
  const departure = (await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-08-02','12:00',8,'scheduled') returning id`,[op,product])).rows[0].id;
  const session='synthetic-invalid-checkout-session-key';
  const hold=(await observer.query(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at) values($1,$2,$3,1,clock_timestamp()+interval '100 milliseconds') returning id`,[op,departure,session])).rows[0].id;
  const sql='select create_pending_order_v1($1,$2,$3,$4,$5)';
  await new Promise(resolve=>setTimeout(resolve,160));
  await assert.rejects(first.query(sql,[op,hold,session,'Test','test@example.invalid']),error=>error.code==='P0001');
  const active=(await observer.query(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at) values($1,$2,$3,1,clock_timestamp()+interval '10 minutes') returning id`,[op,departure,session])).rows[0].id;
  await observer.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{}' where id=$1`,[product]);
  const before=(await observer.query('select count(*)::int as n from customers')).rows[0].n;
  await assert.rejects(first.query(sql,[op,active,session,'Test','test@example.invalid']),error=>error.code==='22023');
  assert.equal((await observer.query('select count(*)::int as n from customers')).rows[0].n,before);
  await first.query('select manage_hold_v1($1,$2,$3,true)',[op,active,session]);
  await assert.rejects(first.query(sql,[op,active,session,'Test','test@example.invalid']),error=>error.code==='P0001');
});

test('checkout is atomic, server-priced, idempotent under contention and session scoped', async () => {
  const op = '10000000-0000-4000-8000-000000000001';
  const product = '10000000-0000-4000-8000-000000000020';
  await observer.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`, [product]);
  const departure = (await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-08-01','12:00',4,'scheduled') returning id`, [op,product])).rows[0].id;
  const session = 'synthetic-checkout-session-key-123456';
  const hold = (await first.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),2)', [op,departure,session])).rows[0];
  const sql = 'select create_pending_order_v1($1,$2,$3,$4,$5) as result';
  const args = [op,hold.id,session,'Test Customer','test@example.invalid'];
  const countBefore = (await observer.query('select count(*)::int as n from orders')).rows[0].n;
  await first.query('begin');
  await first.query(sql,args);
  await first.query('rollback');
  assert.equal((await observer.query('select count(*)::int as n from orders')).rows[0].n,countBefore);
  assert.equal((await observer.query('select order_id from inventory_holds where id=$1',[hold.id])).rows[0].order_id,null);
  await first.query('begin');
  let pending;
  try {
    const order = (await first.query(sql,args)).rows[0].result;
    assert.equal(order.total,2500);
    assert.equal(order.status,'pending');
    assert.equal(order.items[0].quantity,2);
    pending = second.query(sql,args).then(result=>({result}),error=>({error}));
    await waitForLock();
    await first.query('commit');
    const replay = await pending;
    assert.ifError(replay.error);
    assert.deepEqual(replay.result.rows[0].result,order);
    await assert.rejects(first.query(sql,[op,hold.id,'wrong','Test Customer','test@example.invalid']),error=>error.code==='P0002');
    await assert.rejects(first.query(sql,[op,hold.id,session,'Changed Customer','test@example.invalid']),error=>error.code==='23505');
    const persisted = (await observer.query('select status,expires_at from inventory_holds where id=$1',[hold.id])).rows[0];
    assert.equal(persisted.status,'active');
    assert.deepEqual(persisted.expires_at,hold.expires_at);
  } finally { await first.query('rollback'); if(pending)await pending; }
});
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'shkodra-postgres-'));
  const socket = createServer();
  await new Promise((resolve, reject) => { socket.once('error', reject); socket.listen(0, '127.0.0.1', resolve); });
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  cluster = new EmbeddedPostgres({ databaseDir: path.join(directory, 'data'),
    port, user: 'postgres', password: randomBytes(24).toString('hex'),
    persistent: true, createPostgresUser: false, authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1'], onLog() {}, onError() {} });
  await cluster.initialise();
  await cluster.start();
  for (let i = 0; i < 3; i++) {
    const client = cluster.getPgClient('postgres', '127.0.0.1');
    clients.push(client);
    await client.connect();
    await client.query("set statement_timeout = '8s'");
  }
  [observer, first, second] = clients;
  await observer.query(platformSql);
  await applyMigrations((sql) => observer.query(sql));
  await loadDevelopmentFixtures({ exec: (sql) => observer.query(sql) });
  await first.query('set role service_role');
  await second.query('set role service_role');
}, { timeout: 60000 });

after(async () => {
  await Promise.allSettled(clients.map((client) => client.end()));
  if (cluster) await cluster.stop();
  if (directory) {
    const relative = path.relative(path.resolve(tmpdir()), path.resolve(directory));
    assert.match(relative, /^shkodra-postgres-[^\\/]+$/);
    await rm(directory, { recursive: true, force: true });
  }
});

for (const commit of [true, false]) {
  test(`last seat has one winner after first transaction ${commit ? 'commits' : 'rolls back'}`, async () => {
    const operator = '10000000-0000-4000-8000-000000000001';
    const product = '10000000-0000-4000-8000-000000000020';
    await observer.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}' where id=$1`, [product]);
    const departure = (await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status)
      values ($1,$2,'2030-07-01','12:00',1,'scheduled') returning id`, [operator, product])).rows[0].id;
    const sql = 'select * from create_hold_v1($1,$2,$3,$4,1)';
    const requestA = (await observer.query('select gen_random_uuid() as id')).rows[0].id;
    const requestB = (await observer.query('select gen_random_uuid() as id')).rows[0].id;
    const session = 'synthetic-session-key-for-last-seat-test';
    let pending;
    await first.query('begin');
    try {
      const initial = (await first.query(sql, [operator, departure, session, requestA])).rows[0];
      pending = second.query(sql, [operator, departure, session, requestB]).then(result => ({ result }), error => ({ error }));
      await waitForLock();
      await first.query(commit ? 'commit' : 'rollback');
      const outcome = await pending;
      if (commit) {
        assert.equal(outcome.error?.code, 'P0001');
        const replay = (await first.query(sql, [operator, departure, session, requestA])).rows[0];
        assert.equal(replay.id, initial.id);
        assert.deepEqual(replay.expires_at, initial.expires_at);
        await assert.rejects(first.query(sql, [operator, departure, session + 'wrong', requestA]), error => error.code === '23505');
        await assert.rejects(first.query('select * from manage_hold_v1($1,$2,$3,true)', [operator, initial.id, 'wrong']), error => error.code === 'P0002');
        await first.query('select * from manage_hold_v1($1,$2,$3,true)', [operator, initial.id, session]);
        const replacement = await second.query(sql, [operator, departure, session, requestB]);
        assert.equal(replacement.rows[0].status, 'active');
      } else assert.ifError(outcome.error);
      const count = (await observer.query("select sum(quantity)::int as used from inventory_holds where departure_id=$1 and status='active'", [departure])).rows[0].used;
      assert.equal(count, 1);
    } finally { await first.query('rollback'); if (pending) await pending; }
  });
}

test('elapsed hold is reclaimed by allocator and expiry batch is repeatable', async () => {
  const operator = '10000000-0000-4000-8000-000000000001';
  const product = '10000000-0000-4000-8000-000000000020';
  const departure = (await observer.query(`insert into departures(operator_id,product_id,service_date,start_time,capacity,status)
    values ($1,$2,'2030-07-02','12:00',1,'scheduled') returning id`, [operator, product])).rows[0].id;
  const expired = (await observer.query(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at)
    values($1,$2,'short-lived-test',1,clock_timestamp()+interval '100 milliseconds') returning id`, [operator, departure])).rows[0].id;
  await new Promise(resolve => setTimeout(resolve, 160));
  const result = await first.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)', [operator, departure, 'synthetic-session-key-for-expiry-test']);
  assert.equal(result.rows[0].status, 'active');
  assert.equal((await observer.query('select status from inventory_holds where id=$1', [expired])).rows[0].status, 'expired');
  await first.query('select expire_holds_v1($1,100)', [operator]);
  assert.equal((await first.query('select expire_holds_v1($1,100) as count', [operator])).rows[0].count, 0);
  await assert.rejects(first.query('update inventory_holds set request_id=gen_random_uuid() where id=$1', [result.rows[0].id]), error => error.code === '23514');
});

async function waitForLock() {
  const until = Date.now() + 5000;
  while (Date.now() < until) {
    const { rows } = await observer.query('select wait_event_type from pg_stat_activity where pid = $1', [second.processID]);
    if (rows[0]?.wait_event_type === 'Lock') return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail('Second connection never reached a PostgreSQL lock wait');
}

function activity(client, key, payload = {}) {
  return client.query(`select * from public.record_domain_activity(
    '10000000-0000-4000-8000-000000000001', null, $1, 'product',
    '10000000-0000-4000-8000-000000000020', 'product.updated', $2::jsonb,
    'product.updated', '{}'::jsonb)`, [key, JSON.stringify(payload)]);
}

for (const scenario of ['duplicate', 'conflict', 'rollback']) {
  test(`concurrent activity ${scenario}: real lock wait and atomic event/audit outcome`, async () => {
    const key = `native-${scenario}`;
    await first.query('begin');
    let pending;
    try {
      const original = await activity(first, key);
      pending = activity(second, key, scenario === 'conflict' ? { different: true } : {})
        .then((result) => ({ result }), (error) => ({ error }));
      await waitForLock();
      await first.query(scenario === 'rollback' ? 'rollback' : 'commit');
      const outcome = await pending;
      if (scenario === 'conflict') assert.equal(outcome.error?.code, '23505');
      else {
        assert.ifError(outcome.error);
        if (scenario === 'duplicate') assert.deepEqual(outcome.result.rows, original.rows);
        else assert.notEqual(outcome.result.rows[0].event_id, original.rows[0].event_id);
      }
      for (const table of ['domain_events', 'audit_logs']) {
        const { rows } = await observer.query(`select count(*)::int as count from public.${table} where idempotency_key = $1`, [key]);
        assert.equal(rows[0].count, 1);
      }
    } finally {
      await first.query('rollback');
      if (pending) await pending;
    }
  });
}

for (const commit of [true, false]) {
  test(`concurrent hold consumption and release after ${commit ? 'commit' : 'rollback'}`, async () => {
    const operator = '10000000-0000-4000-8000-000000000001';
    const customer = (await observer.query("insert into customers(operator_id,name) values ($1,'Synthetic concurrency customer') returning id", [operator])).rows[0].id;
    const order = (await observer.query('insert into orders(operator_id,customer_id,subtotal,total) values ($1,$2,0,0) returning id', [operator, customer])).rows[0].id;
    const hold = (await observer.query(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at)
      values ($1,'10000000-0000-4000-8000-000000000051',$2,1,now()+interval '1 hour') returning id`, [operator, `race-${commit}`])).rows[0].id;
    await first.query('begin');
    let pending;
    try {
      await first.query("update inventory_holds set status='consumed',order_id=$1 where id=$2", [order, hold]);
      pending = second.query("update inventory_holds set status='released' where id=$1", [hold])
        .then((result) => ({ result }), (error) => ({ error }));
      await waitForLock();
      await first.query(commit ? 'commit' : 'rollback');
      const outcome = await pending;
      if (commit) assert.equal(outcome.error?.code, '23514');
      else { assert.ifError(outcome.error); assert.equal(outcome.result.rowCount, 1); }
      const row = (await observer.query('select status,order_id from inventory_holds where id=$1', [hold])).rows[0];
      assert.deepEqual(row, { status: commit ? 'consumed' : 'released', order_id: commit ? order : null });
    } finally {
      await first.query('rollback');
      if (pending) await pending;
    }
  });
}
