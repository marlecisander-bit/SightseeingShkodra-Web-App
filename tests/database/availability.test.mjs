import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';
import { quoteAvailability, validateAvailabilityRequest } from '../../src/modules/booking/availability.ts';
let db;
const id = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const request = { version: 1, operatorId: id(1), productId: id(20), date: '2030-06-01', guests: 1 };
async function snapshot(overrides = {}) {
  const q = { ...request, ...overrides };
  return (await db.query('select read_availability_v1($1,$2,$3) as data', [q.operatorId, q.productId, q.date])).rows[0].data;
}
before(async () => {
  db = await createTestDatabase();
  await loadDevelopmentFixtures(db);
  await db.exec(`update products set status='published', pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1500}', capacity_rules='{"version":1,"model":"departure_seats"}' where id='${id(20)}';
    update departures set status='scheduled' where operator_id='${id(1)}';`);
});
after(async () => { await db.close(); });
test('quote uses configured minor-unit pricing and capacities zero and one', async () => {
  const quote = quoteAvailability(request, await snapshot());
  assert.equal(quote.total, 1500);
  assert.deepEqual(quote.departures.map((d) => [d.remaining, d.available]), [[0, false], [1, true]]);
  assert.equal(quoteAvailability({ ...request, guests: 2 }, await snapshot()).total, 3000);
  assert.equal(quoteAvailability({ ...request, guests: 2 }, await snapshot()).departures[1].available, false);
});
test('invalid dates, versions and guest quantities are rejected', () => {
  for (const change of [{ date: '2030-02-30' }, { guests: 0 }, { guests: 1.5 }, { guests: '2' }, { version: 2 }, { operatorId: 'bad' }]) {
    assert.throws(() => validateAvailabilityRequest({ ...request, ...change }), { code: 'INVALID_REQUEST' });
  }
});
test('missing pricing, unsupported currency and unsafe multiplication fail closed', async () => {
  const data = await snapshot();
  for (const pricing_rules of [{}, { version: 1, model: 'per_guest', currency: 'USD', unit_price: 1 }, { version: 1, model: 'per_guest', currency: 'EUR', unit_price: Number.MAX_SAFE_INTEGER }]) {
    assert.throws(() => quoteAvailability({ ...request, guests: 2 }, { ...data, pricing_rules }), { code: 'INVALID_CONFIGURATION' });
  }
});
test('tenant mismatch and draft products are not exposed', async () => {
  assert.equal(await snapshot({ operatorId: id(2) }), null);
  assert.equal(await snapshot({ operatorId: id(2), productId: id(21) }), null);
});
test('active unexpired holds reduce seats while elapsed active holds do not', async () => {
  await db.exec('begin');
  try {
    await db.exec(`insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at) values ('${id(1)}','${id(51)}','active',1,now()+interval '1 hour');
      insert into inventory_holds(operator_id,departure_id,session_key,quantity,expires_at) values ('${id(1)}','${id(51)}','elapsed',4,clock_timestamp()+interval '100 milliseconds');`);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal((await snapshot()).departures[1].held, 1);
    assert.equal(quoteAvailability(request, await snapshot()).departures[1].remaining, 0);
  } finally { await db.exec('rollback'); }
});
test('confirmed items count once; pending items do not consume unheld inventory', async () => {
  await db.exec('begin');
  try {
    await db.exec(`insert into customers(id,operator_id,name) values ('${id(90)}','${id(1)}','Test');
      insert into orders(id,operator_id,customer_id,subtotal,total) values ('${id(91)}','${id(1)}','${id(90)}',0,0);
      insert into booking_items(id,operator_id,order_id,product_id,departure_id,quantity,unit_price,total_price) values ('${id(92)}','${id(1)}','${id(91)}','${id(20)}','${id(51)}',1,0,0);`);
    assert.equal((await snapshot()).departures[1].committed, 0);
    await db.exec(`update booking_items set status='confirmed' where id='${id(92)}'`);
    assert.equal((await snapshot()).departures[1].committed, 1);
    assert.equal(quoteAvailability(request, await snapshot()).departures[1].available, false);
  } finally { await db.exec('rollback'); }
});
test('closed and past departures excluded; authenticated callers cannot execute snapshot', async () => {
  await db.exec('begin');
  try {
    await db.exec(`update departures set status='cancelled' where id='${id(51)}'; update departures set service_date='2000-01-01' where id='${id(50)}'`);
    assert.deepEqual((await snapshot()).departures, []);
    assert.deepEqual((await snapshot({ date: '2000-01-01' })).departures, []);
    await db.exec('set local role authenticated');
    await assert.rejects(snapshot(), (error) => error.code === '42501');
  } finally { await db.exec('rollback'); }
});
