import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import {
  createTestDatabase,
  loadDevelopmentFixtures,
} from "../helpers/database.mjs";
let db;
const op = "10000000-0000-4000-8000-000000000001",
  product = "10000000-0000-4000-8000-000000000020";
before(async () => {
  db = await createTestDatabase();
  await loadDevelopmentFixtures(db);
  await db.query(
    `update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`,
    [product],
  );
});
after(async () => db.close());
async function create() {
  const dep = (
    await db.query(
      "insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-01-01','10:00',1,'scheduled') returning id",
      [op, product],
    )
  ).rows[0].id;
  const session = "notification-session-1234567890123456";
  const hold = (
    await db.query(
      "select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)",
      [op, dep, session],
    )
  ).rows[0];
  const order = (
    await db.query(
      "select create_meeting_point_booking_v1($1,$2,$3,'Test','test@example.invalid') as o",
      [op, hold.id, session],
    )
  ).rows[0].o;
  return (
    await db.query("select id from bookings where order_id=$1", [order.orderId])
  ).rows[0].id;
}
const enqueue = () =>
  db.query("select enqueue_booking_notifications_v1($1,'2020-01-01') n", [op]);
const claim = async () =>
  (await db.query("select * from claim_booking_notification_v1($1)", [op]))
    .rows[0];
const finish = (j, outcome) =>
  db.query("select finish_booking_notification_v1($1,$2,$3,$4,null,null)", [
    op,
    j.id,
    j.lease_token,
    outcome,
  ]);
test("exhausted retries stop after five claims while the reservation stays confirmed", async () => {
  const booking = await create();
  await enqueue();
  let job;
  for (let attempt = 1; attempt <= 5; attempt++) {
    job = await claim();
    assert.equal(job.booking_id, booking);
    assert.equal(job.attempt_count, attempt);
    await finish(job, "retry");
    assert.equal(await claim(), undefined);
    await db.query("update notification_deliveries set next_attempt_at=clock_timestamp() where id=$1", [job.id]);
  }
  assert.equal(await claim(), undefined);
  assert.equal((await db.query("select status from notification_deliveries where id=$1", [job.id])).rows[0].status, "failed");
  assert.equal((await db.query("select status from bookings where id=$1", [booking])).rows[0].status, "confirmed");
});

test("expired preparation leases rotate tokens and reject delayed results", async () => {
  await create();
  await enqueue();
  const old = await claim();
  await db.query("update notification_deliveries set lease_until=clock_timestamp()-interval '1 second' where id=$1", [old.id]);
  const fresh = await claim();
  assert.equal(fresh.id, old.id);
  assert.notEqual(fresh.lease_token, old.lease_token);
  assert.equal(fresh.attempt_count, 2);
  await assert.rejects(finish(old, "failed"), (e) => e.code === "P0002");
  await finish(fresh, "failed");
});

test("confirmation consumer deduplicates events without consuming the shared outbox", async () => {
  const b = await create();
  assert.equal((await enqueue()).rows[0].n, 1);
  assert.equal((await enqueue()).rows[0].n, 0);
  const j = await claim();
  assert.equal(j.booking_id, b);
  assert.equal(await claim(), undefined);
  const data = (
    await db.query("select read_booking_notification_v1($1,$2,$3) data", [
      op,
      j.id,
      j.lease_token,
    ])
  ).rows[0].data;
  assert.equal(data.confirmed, true);
  assert.equal(data.paid, false);
  assert.equal(data.whatsappAllowed, false);
  await assert.rejects(
    db.query("select read_booking_notification_v1($1,$2,$3)", [
      "10000000-0000-4000-8000-000000000002",
      j.id,
      j.lease_token,
    ]),
    (e) => e.code === "P0002",
  );
  await db.query("select begin_booking_notification_v1($1,$2,$3,'email')", [
    op,
    j.id,
    j.lease_token,
  ]);
  await finish(j, "accepted");
  assert.equal(await claim(), undefined);
  assert.equal(
    (
      await db.query("select published_at from domain_events where id=$1", [
        j.event_id,
      ])
    ).rows[0].published_at,
    null,
  );
  assert.equal(
    (await db.query("select status from bookings where id=$1", [b])).rows[0]
      .status,
    "confirmed",
  );
  await assert.rejects(finish(j, "retry"), (e) => e.code === "P0002");
});
test("failed notifications retry independently; expired sender lease becomes uncertain rather than duplicate send", async () => {
  const b = await create();
  await enqueue();
  let j = await claim();
  await finish(j, "retry");
  assert.equal(await claim(), undefined);
  await db.query(
    "update notification_deliveries set next_attempt_at=clock_timestamp() where id=$1",
    [j.id],
  );
  j = await claim();
  assert.equal(j.attempt_count, 2);
  await db.query("select begin_booking_notification_v1($1,$2,$3,'email')", [
    op,
    j.id,
    j.lease_token,
  ]);
  await db.query(
    "update notification_deliveries set lease_until=clock_timestamp()-interval '1 second' where id=$1",
    [j.id],
  );
  assert.equal(await claim(), undefined);
  assert.equal(
    (
      await db.query("select status from notification_deliveries where id=$1", [
        j.id,
      ])
    ).rows[0].status,
    "uncertain",
  );
  assert.equal(
    (await db.query("select status from bookings where id=$1", [b])).rows[0]
      .status,
    "confirmed",
  );
});
test("cancelled reservations are skipped before sending and public callers cannot claim jobs", async () => {
  const b = await create();
  await enqueue();
  const j = await claim();
  await db.query("update bookings set status='cancelled' where id=$1", [b]);
  assert.equal(
    (
      await db.query(
        "select begin_booking_notification_v1($1,$2,$3,'email') ready",
        [op, j.id, j.lease_token],
      )
    ).rows[0].ready,
    false,
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec("set role " + role);
    try {
      await assert.rejects(
        db.query("select claim_booking_notification_v1($1)", [op]),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.query("update notification_deliveries set status='accepted'"),
        (e) => e.code === "42501",
      );
    } finally {
      await db.exec("reset role");
    }
  }
});
