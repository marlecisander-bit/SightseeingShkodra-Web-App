import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deliverNextBookingNotification,
  renderConfirmation,
} from "../../src/modules/integrations/booking-notifications.ts";
const confirmation = {
  reference: "SS-test",
  confirmed: true,
  currency: "EUR",
  total: 2500,
  collectionMode: "meeting_point",
  paid: false,
  email: "qa@example.invalid",
  phone: "+355691234567",
  whatsappAllowed: false,
  items: [
    {
      title: "Tour",
      date: "2030-01-01",
      time: "10:00",
      timezone: "Europe/Tirane",
      guests: 2,
    },
  ],
};
function fixture(data = { ...confirmation }, jobChanges = {}) {
  const calls = [];
  const job = {
    id: "delivery",
    operator_id: "op",
    lease_token: "token",
    attempt_count: 1,
    channel: null,
    last_error_code: null,
    ...jobChanges,
  };
  return {
    calls,
    job,
    store: {
      claim: async () => {
        calls.push("claim");
        return job;
      },
      read: async () => data,
      begin: async (_job, channel) => {
        calls.push(channel);
        return true;
      },
      finish: async (_job, ...outcome) => {
        calls.push(outcome);
      },
    },
  };
}
test("retry limits report failure and WhatsApp-only transient retries keep their channel", async () => {
  const exhausted = fixture({ ...confirmation }, { attempt_count: 5 });
  assert.equal(await deliverNextBookingNotification({
    enabled: true, operatorId: "op", store: exhausted.store,
    email: async () => ({ status: "rejected", retryable: true }),
  }), "failed");
  assert.deepEqual(exhausted.calls.at(-1), ["failed", "email_rejected"]);
  const retry = fixture({ ...confirmation, whatsappAllowed: true }, {
    attempt_count: 2, channel: "whatsapp", last_error_code: "whatsapp_rejected",
  });
  assert.equal(await deliverNextBookingNotification({
    enabled: true, operatorId: "op", store: retry.store,
    whatsapp: async () => ({ status: "accepted", reference: "wa-retry" }),
  }), "accepted");
  assert.equal(retry.calls[1], "whatsapp");
});

test("notifications are disabled by default and previews preserve unpaid confirmation wording", async () => {
  const f = fixture();
  assert.equal(
    await deliverNextBookingNotification({ operatorId: "op", store: f.store }),
    "disabled",
  );
  assert.deepEqual(f.calls, []);
  const m = renderConfirmation(confirmation);
  assert.match(m.text, /Payment due at the meeting point/);
  assert.doesNotMatch(m.text, /Payment received/);
  assert.match(m.text, /EUR 25.00/);
  assert.match(
    renderConfirmation({ ...confirmation, paid: true }).text,
    /Payment received/,
  );
  assert.throws(() =>
    renderConfirmation({ ...confirmation, confirmed: false }),
  );
});
test("no WhatsApp consent selects email and accepted does not mean delivered", async () => {
  const f = fixture();
  let message;
  const result = await deliverNextBookingNotification({
    enabled: true,
    operatorId: "op",
    store: f.store,
    email: async (m) => {
      message = m;
      return { status: "accepted", reference: "mail-1" };
    },
    whatsapp: async () => {
      throw Error("must not call");
    },
  });
  assert.equal(result, "accepted");
  assert.equal(message.to, confirmation.email);
  assert.equal(message.idempotencyKey, "booking-confirmation:delivery:email");
  assert.deepEqual(f.calls.at(-1), ["accepted", undefined, "mail-1"]);
});
test("WhatsApp rejection schedules email fallback; unknown acceptance never triggers fallback", async () => {
  const f = fixture({ ...confirmation, whatsappAllowed: true });
  let emails = 0;
  const email = async () => {
    emails++;
    return { status: "accepted", reference: "mail-2" };
  };
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: f.store,
      whatsapp: async () => ({ status: "rejected", retryable: false }),
      email,
    }),
    "retry",
  );
  assert.equal(emails, 0);
  assert.deepEqual(f.calls.at(-1), ["retry", "whatsapp_rejected"]);
  const retry = fixture(
    { ...confirmation, whatsappAllowed: true },
    { channel: "whatsapp", last_error_code: "whatsapp_rejected" },
  );
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: retry.store,
      whatsapp: async () => {
        throw Error("must not repeat");
      },
      email,
    }),
    "accepted",
  );
  assert.equal(emails, 1);
  const unknown = fixture({ ...confirmation, whatsappAllowed: true });
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: unknown.store,
      whatsapp: async () => {
        throw Error("private provider details");
      },
      email,
    }),
    "uncertain",
  );
  assert.equal(emails, 1);
  assert.deepEqual(unknown.calls.at(-1), [
    "uncertain",
    "provider_result_unknown",
  ]);
});
test("cancelled bookings, transient failures and sender timeouts never modify the booking", async () => {
  const cancelled = fixture({ ...confirmation, confirmed: false });
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: cancelled.store,
      email: async () => {
        throw Error("must not send");
      },
    }),
    "skipped",
  );
  const retry = fixture();
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: retry.store,
      email: async () => ({ status: "rejected", retryable: true }),
    }),
    "retry",
  );
  const timeout = fixture();
  assert.equal(
    await deliverNextBookingNotification({
      enabled: true,
      operatorId: "op",
      store: timeout.store,
      timeoutMs: 1,
      email: async () => new Promise(() => {}),
    }),
    "uncertain",
  );
  assert.equal(confirmation.confirmed, true);
});
