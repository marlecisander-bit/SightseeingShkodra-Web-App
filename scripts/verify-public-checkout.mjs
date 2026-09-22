import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createClient } from "@supabase/supabase-js";
assert.equal(process.env.APP_ENV, "development");
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://ybngoppqqiohcduojfyg.supabase.co",
);
if (process.argv.includes("--browser")) assert.ok(process.stdin.isTTY);
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const operatorId = randomUUID(),
  productId = randomUUID(),
  departureId = randomUUID();
const ok = (r) => {
  if (r.error) throw new Error(`Fixture operation failed: ${r.error.code}`);
  return r.data;
};
const base = "http://127.0.0.1:3001";
let server;
const holds = new Set();
let cookie = "";
async function post(body, auth = cookie, origin = base) {
  const response = await fetch(`${base}/api/public/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
      ...(auth ? { Cookie: auth } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}
try {
  ok(
    await client
      .from("operators")
      .insert({
        id: operatorId,
        name: "Synthetic Phase 4D checkout audit fixture",
        timezone: "Europe/Tirane",
      }),
  );
  ok(
    await client
      .from("products")
      .insert({
        id: productId,
        operator_id: operatorId,
        title: "QA Checkout Tour",
        slug: "checkout-qa",
        type: "van_tour",
        status: "published",
        pricing_rules: {
          version: 1,
          model: "per_guest",
          currency: "EUR",
          unit_price: 1250,
        },
        capacity_rules: { version: 1, model: "departure_seats" },
      }),
  );
  const snapshot = ok(
    await client.rpc("read_public_homepage_v1", {
      p_operator_id: operatorId,
      p_product_slug: "checkout-qa",
    }),
  );
  ok(
    await client
      .from("departures")
      .insert({
        id: departureId,
        operator_id: operatorId,
        product_id: productId,
        service_date: snapshot.service_date,
        start_time: "23:59:59",
        capacity: 2,
        status: "scheduled",
      }),
  );
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3001",
    ],
    {
      env: {
        ...process.env,
        PUBLIC_OPERATOR_ID: operatorId,
        PUBLIC_HOMEPAGE_PRODUCT_SLUG: "checkout-qa",
      },
      windowsHide: true,
      stdio: "ignore",
    },
  );
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/book`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ready);
  assert.equal(
    (await post({ action: "session" }, "", "https://foreign.example")).response
      .status,
    403,
  );
  assert.equal(
    (await post({ action: "session" }, "", "")).response.status,
    403,
  );
  assert.equal(
    (await post({ action: "read", holdId: randomUUID() }, "")).response.status,
    401,
  );
  const session = await post({ action: "session" }, "");
  assert.equal(session.response.status, 200);
  const header = session.response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=strict/i);
  cookie = header.split(";")[0];
  const input = {
    action: "hold",
    date: snapshot.service_date,
    guests: 2,
    departureId,
    requestId: randomUUID(),
  };
  const first = await post(input);
  assert.equal(first.response.status, 200, JSON.stringify(first.data));
  const holdId = first.data.hold.id;
  holds.add(holdId);
  assert.equal(first.data.hold.status, "active");
  assert.ok(!JSON.stringify(first.data).includes("session_key"));
  const replay = await post(input);
  assert.equal(replay.data.hold.id, holdId);
  assert.equal((await post({ ...input, guests: 1 })).response.status, 409);
  const secondSession = await post({ action: "session" }, "");
  const stranger = secondSession.response.headers
    .get("set-cookie")
    .split(";")[0];
  for (const action of ["read", "release", "order"]) {
    const body =
      action === "order"
        ? {
            action,
            holdId,
            customer: { name: "Test", email: "test@example.invalid" },
          }
        : { action, holdId };
    assert.equal((await post(body, stranger)).response.status, 404);
  }
  const customer = {
    name: "Synthetic Checkout Customer",
    email: "checkout@example.invalid",
    phone: "",
  };
  const invalid = await post({
    action: "order",
    holdId,
    customer: { ...customer, email: "invalid" },
  });
  assert.equal(invalid.response.status, 409);
  const order = await post({ action: "order", holdId, customer });
  assert.equal(order.response.status, 200, JSON.stringify(order.data));
  assert.equal(order.data.order.total, 2500);
  assert.equal(order.data.order.status, "pending");
  assert.deepEqual(
    (await post({ action: "order", holdId, customer })).data.order,
    order.data.order,
  );
  assert.equal(
    (
      await post({
        action: "order",
        holdId,
        customer: { ...customer, name: "Changed" },
      })
    ).response.status,
    409,
  );
  const recovered = await post({ action: "read", holdId });
  assert.equal(recovered.data.order.orderId, order.data.order.orderId);
  assert.ok(!JSON.stringify(recovered.data).includes(customer.email));
  assert.equal(
    (await post({ action: "release", holdId })).data.hold.status,
    "released",
  );
  const quote = await (
    await fetch(
      `${base}/api/public/availability?date=${snapshot.service_date}&guests=2`,
    )
  ).json();
  assert.equal(quote.quote.departures[0].available, true);
  console.log(
    "PASS: same-origin/session guards, hold retry/conflict, cross-session denial, validated pending order, exact replay, recovery and release capacity",
  );
  console.log(`Synthetic audit operator retained: ${operatorId}`);
  if (process.argv.includes("--browser")) {
    console.log(
      `BROWSER READY: ${base}/book; date ${snapshot.service_date}; press Enter after QA to release holds and archive fixture`,
    );
    process.stdin.resume();
    await once(process.stdin, "data");
    process.stdin.pause();
  }
} finally {
  if (server && server.exitCode === null) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
  // Retain immutable financial/audit history; retire only this exact synthetic catalog.
  const active = ok(
    await client
      .from("inventory_holds")
      .select("id,session_key")
      .eq("operator_id", operatorId)
      .eq("status", "active"),
  );
  for (const hold of active)
    ok(
      await client.rpc("manage_hold_v1", {
        p_operator_id: operatorId,
        p_hold_id: hold.id,
        p_session_key: hold.session_key,
        p_release: true,
      }),
    );
  ok(
    await client
      .from("departures")
      .update({ status: "closed" })
      .eq("id", departureId)
      .eq("operator_id", operatorId),
  );
  ok(
    await client
      .from("products")
      .update({ status: "archived" })
      .eq("id", productId)
      .eq("operator_id", operatorId),
  );
  console.log(
    "PASS: synthetic active holds released and catalog archived; immutable test order/audit history retained, owner untouched",
  );
}
