import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePositions, positionStatus } from "../../src/modules/tracking/positions.ts";
import { readPositions } from "../../src/modules/tracking/positions-server.ts";
const op = "10000000-0000-4000-8000-000000000001";
const row = { operator_id: op, vehicle_id: "10000000-0000-4000-8000-000000000030", lat: 42.068, lng: 19.512, updated_at: "2030-01-01T10:00:00Z" };
test("tracking rejects foreign, malformed and oversized snapshots", () => {
  for (const data of [null, [{ ...row, operator_id: "other" }], [{ ...row, lat: NaN }], [{ ...row, lng: 181 }], [{ ...row, lat: "42" }], [{ ...row, updated_at: "bad" }], [row, row], Array(501).fill(row)]) {
    assert.deepEqual(normalizePositions(op, data), { state: "unavailable", positions: [] });
  }
  assert.equal(normalizePositions(op, []).state, "empty");
  assert.equal(normalizePositions(op, [row]).state, "ready");
});
test("freshness ages without another position and future clock errors never look recent", () => {
  const position = normalizePositions(op, [row]).positions[0];
  const time = Date.parse(row.updated_at);
  assert.equal(positionStatus(position, time + 120000), "Recent position");
  assert.match(positionStatus(position, time + 120001), /Last known/);
  assert.match(positionStatus(position, time - 31000), /Last known/);
  assert.match(positionStatus(position, NaN), /Last known/);
});
test("reader uses only the existing tenant-filtered vehicle_positions source", async () => {
  const calls = [];
  const chain = {
    select: value => { calls.push(["select", value]); return chain; },
    eq: (...args) => { calls.push(["eq", ...args]); return chain; },
    order: value => { calls.push(["order", value]); return chain; },
    limit: value => { calls.push(["limit", value]); return chain; },
    abortSignal: async signal => { assert.ok(signal instanceof AbortSignal); return { data: [row], error: null }; },
  };
  const client = { from: table => { calls.push(["from", table]); return chain; } };
  assert.equal((await readPositions(client, op)).state, "ready");
  assert.deepEqual(calls, [["from", "vehicle_positions"], ["select", "operator_id,vehicle_id,lat,lng,updated_at"], ["eq", "operator_id", op], ["order", "vehicle_id"], ["limit", 501]]);
  calls.length = 0;
  assert.equal((await readPositions(client, "forged")).state, "unavailable");
  assert.deepEqual(calls, []);
});
test("reader redacts failures and never invents a position", async () => {
  assert.deepEqual(await readPositions({ from: () => { throw Error("private connection details"); } }, op), { state: "unavailable", positions: [] });
});
