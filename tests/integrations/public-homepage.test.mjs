import assert from "node:assert/strict";
import { test } from "node:test";
import { loadHomepage } from "../../src/modules/content/homepage.ts";
import { quoteAvailability } from "../../src/modules/booking/availability.ts";
const operatorId = "10000000-0000-4000-8000-000000000001",
  productId = "10000000-0000-4000-8000-000000000020";
const config = { operatorId, productSlug: "day-tour" };
function snapshot() {
  return {
    version: 1,
    operator: { id: operatorId, name: "Operator", timezone: "Europe/Tirane" },
    service_date: "2030-06-01",
    product: {
      id: productId,
      title: "Published tour",
      slug: "day-tour",
      description: "Description",
      stops: [],
      private_key: "must-not-leak",
    },
    content: [
      {
        slug: "homepage-hero",
        title: "Published heading",
        text: "<b>Plain text</b>",
        meta_title: "SEO heading",
        meta_description: "SEO description",
      },
    ],
    private_key: "must-not-leak",
  };
}
function quote(request) {
  return Promise.resolve(
    quoteAvailability(request, {
      operator_id: operatorId,
      product_id: productId,
      service_date: request.date,
      as_of: "2030-06-01T06:00:00Z",
      pricing_rules: {
        version: 1,
        model: "per_guest",
        currency: "EUR",
        unit_price: 1250,
      },
      departures: [
        {
          id: "10000000-0000-4000-8000-000000000050",
          start_time: "09:00:00",
          capacity: 2,
          held: 1,
          committed: 0,
        },
      ],
    }),
  );
}
test("missing or invalid site binding makes no privileged data call", async () => {
  const sources = {
    read: () => assert.fail("must not query"),
    quote: () => assert.fail("must not quote"),
  };
  for (const bad of [
    {},
    { operatorId: "invalid", productSlug: "day-tour" },
    { operatorId, productSlug: "../other" },
  ])
    assert.equal((await loadHomepage(bad, sources)).state, "unconfigured");
});
test("homepage displays the shared domain quote and projects public DTOs without raw provider fields", async () => {
  let requested;
  const data = await loadHomepage(config, {
    read: async (op, slug) => {
      assert.equal(op, operatorId);
      assert.equal(slug, "day-tour");
      return snapshot();
    },
    quote: async (request) => {
      requested = request;
      return quote(request);
    },
  });
  assert.equal(data.state, "ready");
  assert.equal(data.price, "€12.50 per guest");
  assert.equal(data.frequency, "1 upcoming departure today");
  assert.deepEqual(data.departures, [{ time: "09:00" }]);
  assert.equal(requested.guests, 1);
  assert.equal(requested.date, "2030-06-01");
  assert.equal(data.content["homepage-hero"].text, "<b>Plain text</b>");
  assert.ok(!JSON.stringify(data).includes("must-not-leak"));
  assert.ok(!JSON.stringify(data).includes("remaining"));
});
test("quote failure preserves published editorial data without inventing price or departures", async () => {
  const data = await loadHomepage(config, {
    read: async () => snapshot(),
    quote: async () => {
      throw new Error("secret provider detail");
    },
  });
  assert.equal(data.state, "ready");
  assert.equal(data.price, "Price coming soon");
  assert.equal(data.schedule, "unavailable");
  assert.equal(data.product.title, "Published tour");
  assert.deepEqual(data.departures, []);
  assert.ok(!JSON.stringify(data).includes("secret"));
});
test("wrong-tenant, wrong-product, malformed and failed snapshots fail closed without quoting", async () => {
  const wrongTenant = snapshot();
  wrongTenant.operator.id = productId;
  const wrongProduct = snapshot();
  wrongProduct.product.slug = "other";
  for (const raw of [null, {}, wrongTenant, wrongProduct])
    assert.equal(
      (
        await loadHomepage(config, {
          read: async () => raw,
          quote: () => assert.fail("must not quote"),
        })
      ).state,
      "unavailable",
    );
  assert.equal(
    (
      await loadHomepage(config, {
        read: async () => {
          throw new Error("private detail");
        },
        quote,
      })
    ).state,
    "unavailable",
  );
});
test("withdrawn publication is reflected on the next load without stale product or price fallback", async () => {
  const raw = snapshot();
  const sources = { read: async () => raw, quote };
  assert.equal((await loadHomepage(config, sources)).state, "ready");
  raw.product = null;
  raw.content = [];
  const data = await loadHomepage(config, sources);
  assert.equal(data.state, "empty");
  assert.equal(data.product, null);
  assert.equal(data.price, "Price coming soon");
  assert.deepEqual(data.content, {});
});
test("an empty valid schedule differs from an unavailable quote; mismatched quotes are not exposed", async () => {
  const sources = {
    read: async () => snapshot(),
    quote: async (request) => ({ ...(await quote(request)), departures: [] }),
  };
  const empty = await loadHomepage(config, sources);
  assert.equal(empty.schedule, "ready");
  assert.equal(empty.frequency, "No more departures today");
  sources.quote = async (request) => ({
    ...(await quote(request)),
    productId: operatorId,
  });
  assert.equal((await loadHomepage(config, sources)).schedule, "unavailable");
});
