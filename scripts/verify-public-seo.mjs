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
const operator = randomUUID(),
  foreign = randomUUID();
const ids = [randomUUID(), randomUUID(), randomUUID()];
const ok = (r) => {
  if (r.error) throw new Error(`Fixture failed: ${r.error.code}`);
  return r.data;
};
const base = "http://127.0.0.1:3001";
let server;
async function read(path) {
  const response = await fetch(`${base}${path}`, {
    headers: { "User-Agent": "Googlebot" },
  });
  return { status: response.status, text: await response.text() };
}
try {
  ok(
    await client
      .from("operators")
      .insert(
        [operator, foreign].map((id) => ({
          id,
          name: "Synthetic Explore SEO verification",
          timezone: "Europe/Tirane",
        })),
      ),
  );
  ok(
    await client
      .from("content_pages")
      .insert(
        ids.map((id, i) => ({
          id,
          operator_id: i === 2 ? foreign : operator,
          slug: i === 1 ? "explore-lake" : "explore-castle",
          title: i === 0 ? "QA Castle Guide" : "PRIVATE GUIDE MUST NOT APPEAR",
          status: i === 1 ? "draft" : "published",
          body: {
            version: 1,
            format: "plain_text",
            text: "Published guide text.\n\n<script>unsafe()</script> stays plain text.",
          },
          meta_title: "QA Castle SEO",
          meta_description: "Synthetic published guide description.",
        })),
      ),
  );
  // Production indexing settings are simulated only in this isolated loopback process.
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
        APP_ENV: "production",
        SITE_INDEXING_ENABLED: "true",
        NEXT_PUBLIC_SITE_URL: "https://seo.example.invalid",
        PUBLIC_OPERATOR_ID: operator,
        PUBLIC_HOMEPAGE_PRODUCT_SLUG: "no-tour",
      },
      windowsHide: true,
      stdio: "ignore",
    },
  );
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      if ((await read("/explore")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready);
  const listing = await read("/explore");
  assert.ok(listing.text.includes("/explore/castle"));
  assert.ok(!listing.text.includes("PRIVATE GUIDE MUST NOT APPEAR"));
  const guide = await read("/explore/castle");
  assert.equal(guide.status, 200);
  assert.ok(guide.text.includes("QA Castle Guide"));
  assert.ok(guide.text.includes("QA Castle SEO"));
  assert.match(
    guide.text,
    /rel="canonical" href="https:\/\/seo.example.invalid\/explore\/castle"/,
  );
  assert.ok(guide.text.includes("BreadcrumbList"));
  assert.ok(!guide.text.includes("<script>unsafe()"));
  assert.ok(guide.text.includes("&lt;script&gt;unsafe()"));
  assert.equal((await read("/explore/lake")).status, 404);
  assert.equal((await read("/explore/not-a-guide")).status, 404);
  const map = await read("/sitemap.xml");
  assert.ok(map.text.includes("https://seo.example.invalid/explore/castle"));
  assert.ok(!map.text.includes("/explore/lake"));
  assert.ok(!map.text.includes("/book"));
  const robots = await read("/robots.txt");
  assert.ok(
    robots.text.includes("Sitemap: https://seo.example.invalid/sitemap.xml"),
  );
  ok(
    await client
      .from("content_pages")
      .update({ status: "archived" })
      .eq("id", ids[0])
      .eq("operator_id", operator),
  );
  assert.equal((await read("/explore/castle")).status, 404);
  assert.ok(!(await read("/sitemap.xml")).text.includes("/explore/castle"));
  console.log(
    "PASS: published guide HTML, canonical metadata, safe structured data, draft/tenant isolation, robots/sitemap gate and immediate withdrawal",
  );
  if (process.argv.includes("--browser")) {
    ok(
      await client
        .from("content_pages")
        .update({ status: "published" })
        .eq("id", ids[0])
        .eq("operator_id", operator),
    );
    console.log(
      `BROWSER READY: ${base}/explore/castle; press Enter after QA to remove fixtures`,
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
  ok(await client.from("content_pages").delete().in("id", ids));
  ok(await client.from("operators").delete().in("id", [operator, foreign]));
  console.log("PASS: exact SEO fixtures removed; owner content unchanged");
}
