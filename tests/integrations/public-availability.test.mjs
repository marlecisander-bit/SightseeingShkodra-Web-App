import assert from "node:assert/strict";
import { test } from "node:test";
import { publicAvailability } from "../../src/modules/booking/public-availability.ts";
import { AvailabilityError } from "../../src/modules/booking/availability.ts";
const operatorId = "10000000-0000-4000-8000-000000000001";
const productId = "10000000-0000-4000-8000-000000000020";
const request = (query = "date=2030-06-01&guests=2") =>
  new Request(`http://localhost/api/public/availability?${query}`);
test("public availability rejects malformed and tenant-controlling inputs before privileged access", async () => {
  for (const query of [
    "",
    "date=2030-02-30&guests=2",
    "date=2030-06-01&guests=0",
    "date=2030-06-01&guests=1.5",
    "date=2030-06-01&guests=2&operatorId=foreign",
    "date=2030-06-01&guests=2&guests=3",
    "date=2030-06-01&guests=2147483648",
  ]) {
    const response = await publicAvailability(request(query), {
      resolve: () => assert.fail("must not query"),
      quote: () => assert.fail("must not quote"),
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
});
test("public availability binds product server-side and returns shared quote without recalculation", async () => {
  const quote = {
    version: 1,
    productId,
    date: "2030-06-01",
    guests: 2,
    currency: "EUR",
    unitPrice: 1250,
    total: 2500,
    asOf: "2030-06-01T06:00:00Z",
    departures: [
      {
        id: "departure",
        startTime: "09:00:00",
        available: false,
        remaining: 1,
      },
    ],
  };
  const response = await publicAvailability(request(), {
    resolve: async () => ({ operatorId, productId, timezone: "Europe/Tirane" }),
    quote: async (input) => {
      assert.deepEqual(input, {
        version: 1,
        operatorId,
        productId,
        date: quote.date,
        guests: 2,
      });
      return quote;
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { quote, timezone: "Europe/Tirane" });
});
test("unpublished product never invokes pricing and archival race is hidden", async () => {
  let response = await publicAvailability(request(), {
    resolve: async () => null,
    quote: () => assert.fail("must not quote"),
  });
  assert.equal(response.status, 404);
  response = await publicAvailability(request(), {
    resolve: async () => ({ operatorId, productId, timezone: "Europe/Tirane" }),
    quote: async () => {
      throw new AvailabilityError("NOT_FOUND");
    },
  });
  assert.equal(response.status, 404);
});
test("provider errors and bad pricing configuration expose no internals", async () => {
  for (const error of [
    new Error("private secret"),
    new AvailabilityError("INVALID_CONFIGURATION"),
  ]) {
    const response = await publicAvailability(request(), {
      resolve: async () => {
        throw error;
      },
      quote: () => assert.fail(),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "UNAVAILABLE" });
  }
});
