import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';

let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });
const fixtureTables = ['operators','suppliers','products','vehicles','stops','departures'];
async function snapshot() {
  const result = {};
  for (const table of fixtureTables) result[table] = (await db.query(`select * from ${table} order by id`)).rows;
  return result;
}

test('fixture SQL refuses accidental execution without explicit development mode', async () => {
  await assert.rejects(db.exec(await readFile(new URL('../../supabase/fixtures/development.sql', import.meta.url), 'utf8')));
  await db.exec('rollback');
  assert.equal((await db.query('select * from operators')).rows.length, 0);
});

test('reusable fixtures provide operators, a van tour, ordered stops and varied capacities', async () => {
  await loadDevelopmentFixtures(db);
  const data = await snapshot();
  assert.equal(data.operators.length, 2);
  assert.equal(data.products.length, 2);
  assert.equal(data.vehicles.length, 1);
  assert(data.products.every((p) => p.type === 'van_tour' && p.status === 'draft'));
  assert.deepEqual(data.stops.map((s) => s.sort_order), [0,1,2]);
  assert.deepEqual(data.departures.map((d) => d.capacity), [0,1,8]);
  assert.equal(new Set(data.products.map((p) => p.operator_id)).size, 2);
  assert(data.departures.every((d) => d.status === 'draft'));
});

test('rerunning fixtures neither duplicates records nor rewrites them', async () => {
  const before = await snapshot();
  await loadDevelopmentFixtures(db);
  assert.deepEqual(await snapshot(), before);
});

test('fresh database produces byte-equivalent fixture data and no financial or auth records', async () => {
  const fresh = await createTestDatabase();
  try {
    await loadDevelopmentFixtures(fresh);
    for (const table of fixtureTables) {
      assert.deepEqual((await fresh.query(`select * from ${table} order by id`)).rows,
        (await db.query(`select * from ${table} order by id`)).rows);
    }
    for (const table of ['auth.users','staff_profiles','customers','orders','payments','bookings','inventory_holds']) {
      assert.equal((await fresh.query(`select * from ${table}`)).rows.length, 0, table);
    }
  } finally { await fresh.close(); }
});
