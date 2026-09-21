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
