import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createClient } from "@supabase/supabase-js";
import { loadHomepage } from "../src/modules/content/homepage.ts";
import { getAvailability } from "../src/modules/booking/availability-server.ts";

// Explicit development-only integration verification. No real owner data is used.
assert.equal(process.env.APP_ENV, "development");
if (process.argv.includes("--browser")) {
  assert.ok(
    process.stdin.isTTY,
    "Run --browser in an interactive terminal (tty=true)",
  );
}
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://ybngoppqqiohcduojfyg.supabase.co",
);
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const anonymous = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const ids = {
  operators: [randomUUID(), randomUUID()],
  products: [randomUUID(), randomUUID()],
  stops: [randomUUID()],
  content_pages: [randomUUID(), randomUUID(), randomUUID()],
  departures: [randomUUID()],
};
const operator = ids.operators[0],
  slug = "homepage-qa";
const config = { operatorId: operator, productSlug: slug };
const ok = (result) => {
  if (result.error)
    throw new Error(
      `Development verification failed: ${result.error.code ?? "unknown"}`,
    );
  return result.data;
};
const read = async (operatorId, productSlug) =>
  ok(
    await client.rpc("read_public_homepage_v1", {
      p_operator_id: operatorId,
      p_product_slug: productSlug,
    }),
  );
let server;
try {
  ok(
    await client.from("operators").insert(
      ids.operators.map((id) => ({
        id,
        name: "Synthetic homepage verification",
        timezone: "Europe/Tirane",
      })),
    ),
  );
  ok(
    await client.from("products").insert(
      ids.products.map((id, i) => ({
        id,
        operator_id: ids.operators[i],
        title: i ? "FOREIGN PRODUCT MUST NOT APPEAR" : "QA Published Tour",
        slug,
        type: "van_tour",
        status: "published",
        meta_description: "Synthetic tour used only for verification.",
        pricing_rules: {
          version: 1,
          model: "per_guest",
          currency: "EUR",
          unit_price: 1250,
        },
        capacity_rules: { version: 1, model: "departure_seats" },
      })),
    ),
  );
  ok(
    await client.from("stops").insert({
      id: ids.stops[0],
      operator_id: operator,
      product_id: ids.products[0],
      name: "QA Published Boarding Stop",
      lat: 42.06,
      lng: 19.51,
      sort_order: 0,
    }),
  );
  ok(
    await client.from("content_pages").insert(
      ids.content_pages.map((id, i) => ({
        id,
        operator_id: i === 2 ? ids.operators[1] : operator,
        slug: i === 1 ? "homepage-intro" : "homepage-hero",
        title:
          i === 0 ? "QA Published Homepage" : "HIDDEN CONTENT MUST NOT APPEAR",
        status: i === 1 ? "draft" : "published",
        body: {
          version: 1,
          format: "plain_text",
          text: "<script>qaUnsafe()</script> is plain text.",
        },
        meta_title: "QA Homepage",
        meta_description: "Synthetic verification only.",
      })),
    ),
  );
  const snapshot = await read(operator, slug);
  ok(
    await client.from("departures").insert({
      id: ids.departures[0],
      operator_id: operator,
      product_id: ids.products[0],
      service_date: snapshot.service_date,
      start_time: "23:59:59",
      capacity: 2,
      status: "scheduled",
    }),
  );
  const home = await loadHomepage(config, {
    read,
    quote: (request) => getAvailability(request, AbortSignal.timeout(5000)),
  });
  assert.equal(home.product.title, "QA Published Tour");
  assert.equal(home.price, "€12.50 per guest");
  assert.equal(home.product.stops[0].name, "QA Published Boarding Stop");
  assert.equal(home.content["homepage-hero"].title, "QA Published Homepage");
  assert.ok(!JSON.stringify(home).includes("MUST NOT APPEAR"));
  assert.ok(
    (
      await anonymous.rpc("read_public_homepage_v1", {
        p_operator_id: operator,
        p_product_slug: slug,
      })
    ).error,
  );
  console.log(
    "PASS: hosted public projection, shared domain quote, tenant/draft isolation and anonymous RPC denial",
  );

  // Separate loopback-only build server. Do not change the user's actual site binding.
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
        PUBLIC_OPERATOR_ID: operator,
        PUBLIC_HOMEPAGE_PRODUCT_SLUG: slug,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      windowsHide: true,
      stdio: "ignore",
    },
  );
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error("QA server failed to start");
    try {
      const response = await fetch("http://127.0.0.1:3001", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "QA server did not become ready");
  async function html() {
    const response = await fetch("http://127.0.0.1:3001", {
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200);
    return response.text();
  }
  const published = await html();
  assert.match(published, /QA Published Homepage/);
  assert.match(published, /QA Published Boarding Stop/);
  assert.match(published, /12\.50 per guest/);
  assert.match(published, /&lt;script&gt;qaUnsafe\(\)&lt;\/script&gt;/);
  assert.ok(!published.includes("<script>qaUnsafe()"));
  assert.ok(!published.includes("MUST NOT APPEAR"));
  assert.match(published, /noindex/);
  ok(
    await client
      .from("products")
      .update({ status: "archived" })
      .eq("id", ids.products[0])
      .eq("operator_id", operator),
  );
  ok(
    await client
      .from("content_pages")
      .update({ status: "archived" })
      .eq("id", ids.content_pages[0])
      .eq("operator_id", operator),
  );
  const withdrawn = await html();
  assert.ok(!withdrawn.includes("QA Published Homepage"));
  assert.ok(!withdrawn.includes("QA Published Boarding Stop"));
  assert.ok(!withdrawn.includes("12.50 per guest"));
  console.log(
    "PASS: real Next HTTP renders published data, escapes CMS text, and removes archived content on next request",
  );
  if (process.argv.includes("--browser")) {
    ok(
      await client
        .from("products")
        .update({ status: "published" })
        .eq("id", ids.products[0])
        .eq("operator_id", operator),
    );
    ok(
      await client
        .from("content_pages")
        .update({ status: "published" })
        .eq("id", ids.content_pages[0])
        .eq("operator_id", operator),
    );
    console.log(
      "BROWSER READY: http://127.0.0.1:3001 - press Enter after visual QA to clean fixtures and stop this server",
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
  let failed = false;
  for (const table of [
    "departures",
    "stops",
    "content_pages",
    "products",
    "operators",
  ]) {
    const result = await client.from(table).delete().in("id", ids[table]);
    if (result.error) {
      failed = true;
      console.error(
        `Cleanup failed for synthetic ${table}: ${result.error.code}`,
      );
    }
  }
  assert.equal(failed, false, "Synthetic cleanup incomplete");
  console.log(
    "PASS: exact synthetic fixtures removed; owner workspace unchanged",
  );
}
