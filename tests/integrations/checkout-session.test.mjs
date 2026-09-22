import assert from "node:assert/strict";
import { test } from "node:test";
import {
  issueCheckoutSession,
  verifyCheckoutSession,
} from "../../src/modules/booking/checkout-session.ts";
const secret = "test-only-signing-secret-with-more-than-32-characters";
test("checkout session is server-issued, unique and verified without exposing its signature as identity", () => {
  const now = 1800000000000;
  const first = issueCheckoutSession(secret, now),
    second = issueCheckoutSession(secret, now);
  assert.notEqual(first, second);
  assert.match(verifyCheckoutSession(first, secret, now), /^[a-f0-9]{64}$/);
  assert.notEqual(verifyCheckoutSession(first, secret, now), first);
});
test("forged, expired, malformed and wrong-key checkout sessions fail closed", () => {
  const now = 1800000000000,
    cookie = issueCheckoutSession(secret, now);
  for (const candidate of [
    undefined,
    "chosen-by-browser",
    cookie.replace(/^./, cookie[0] === "a" ? "b" : "a"),
    cookie + "extra",
  ])
    assert.equal(verifyCheckoutSession(candidate, secret, now), null);
  assert.equal(verifyCheckoutSession(cookie, secret, now + 86400000), null);
  assert.equal(verifyCheckoutSession(cookie, secret + "different", now), null);
  assert.throws(() => issueCheckoutSession("short", now));
});
