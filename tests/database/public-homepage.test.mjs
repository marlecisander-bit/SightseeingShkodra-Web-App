import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import {
  createTestDatabase,
  loadDevelopmentFixtures,
} from "../helpers/database.mjs";
let db;
const id = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function read(operator = id(1), slug = "demo-van-tour") {
  return (
    await db.query("select read_public_homepage_v1($1,$2) as data", [
      operator,
      slug,
    ])
  ).rows[0].data;
}
before(async () => {
  db = await createTestDatabase();
  await loadDevelopmentFixtures(db);
  await db.exec(
    "update products set status='published',meta_description='Published description';",
  );
  for (const [operator, slug, status, format] of [
    [id(1), "homepage-hero", "published", "plain_text"],
    [id(2), "homepage-hero", "published", "plain_text"],
    [id(1), "homepage-intro", "draft", "plain_text"],
    [id(1), "homepage-final", "published", "html"],
    [id(1), "internal-notes", "published", "plain_text"],
  ]) {
    await db.query(
      "insert into content_pages(operator_id,slug,title,status,body) values($1,$2,$3,$4,$5)",
      [
        operator,
        slug,
        operator === id(1) ? "Our title" : "Foreign title",
        status,
        JSON.stringify({
          version: 1,
          format,
          text: "<script>plain text only</script>",
        }),
      ],
    );
  }
});
after(async () => {
  await db.close();
});
test("public projection selects the configured tenant/product, ordered stops and only public fields", async () => {
  const data = await read();
  assert.equal(data.operator.id, id(1));
  assert.equal(data.product.id, id(20));
  assert.deepEqual(
    data.product.stops.map((s) => s.sort_order),
    [0, 1, 2],
  );
  assert.deepEqual(Object.keys(data.product).sort(), [
    "description",
    "id",
    "slug",
    "stops",
    "title",
  ]);
  assert.ok(!JSON.stringify(data).includes("pricing_rules"));
  assert.ok(!JSON.stringify(data).includes("supplier_id"));
  assert.equal(
    data.service_date,
    (
      await db.query(
        "select (statement_timestamp() at time zone 'Europe/Tirane')::date::text as date",
      )
    ).rows[0].date,
  );
  assert.equal((await read(id(2))).product.id, id(21));
});
test("draft/archive withdrawal and unknown operator/slug do not fall back to another product", async () => {
  assert.equal(await read(id(999)), null);
  assert.equal((await read(id(1), "missing")).product, null);
  await db.exec("begin");
  try {
    for (const status of ["draft", "archived"]) {
      await db.query("update products set status=$1 where id=$2", [
        status,
        id(20),
      ]);
      assert.equal((await read()).product, null);
    }
  } finally {
    await db.exec("rollback");
  }
});
test("only published allowlisted plain-text content appears; other tenants and formats stay private", async () => {
  const pages = (await read()).content;
  assert.equal(pages.length, 1);
  assert.equal(pages[0].slug, "homepage-hero");
  assert.equal(pages[0].title, "Our title");
  assert.equal(pages[0].text, "<script>plain text only</script>");
  await db.exec("begin");
  try {
    await db.query(
      "update content_pages set status='archived' where operator_id=$1 and slug='homepage-hero'",
      [id(1)],
    );
    assert.deepEqual((await read()).content, []);
  } finally {
    await db.exec("rollback");
  }
});
test("public homepage RPC is denied to anon/authenticated and executable only by service role", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(read(), (e) => e.code === "42501");
    } finally {
      await db.exec("reset role");
    }
  }
  await db.exec("set role service_role");
  try {
    assert.equal((await read()).product.id, id(20));
  } finally {
    await db.exec("reset role");
  }
});
