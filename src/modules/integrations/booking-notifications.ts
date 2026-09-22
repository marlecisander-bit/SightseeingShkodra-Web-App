export type Confirmation = {
  reference: string;
  confirmed: boolean;
  currency: string;
  total: number;
  collectionMode: string;
  paid: boolean;
  email: string | null;
  phone: string | null;
  whatsappAllowed: boolean;
  items: {
    title: string;
    date: string;
    time: string;
    timezone: string;
    guests: number;
  }[];
};
export type Delivery = {
  id: string;
  operator_id: string;
  lease_token: string;
  attempt_count: number;
  channel: "email" | "whatsapp" | null;
  last_error_code: string | null;
};
export type Outcome = "accepted" | "retry" | "failed" | "uncertain" | "skipped";
export interface NotificationStore {
  claim(operatorId: string): Promise<Delivery | null>;
  read(job: Delivery): Promise<Confirmation>;
  begin(job: Delivery, channel: "email" | "whatsapp"): Promise<boolean>;
  finish(
    job: Delivery,
    outcome: Outcome,
    code?: string,
    reference?: string,
  ): Promise<void>;
}
export type SendResult =
  | { status: "accepted"; reference: string }
  | { status: "rejected"; retryable: boolean }
  | { status: "uncertain" };
export type Message = {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};
export type Sender = (
  message: Message,
  signal: AbortSignal,
) => Promise<SendResult>;
const clean = (value: string) =>
  value.replace(/[\r\n\u0000-\u001f]/g, " ").trim();
export function renderConfirmation(data: Confirmation) {
  if (
    !data.confirmed ||
    !data.reference ||
    data.currency !== "EUR" ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !data.items.length
  )
    throw Error("invalid_confirmation");
  const total = BigInt(data.total),
    amount = `EUR ${total / BigInt(100)}.${String(total % BigInt(100)).padStart(2, "0")}`;
  const payment = data.paid
    ? "Payment received."
    : data.collectionMode === "meeting_point"
      ? "Payment due at the meeting point."
      : "Contact staff about payment.";
  return {
    subject: `Sightseeing Shkodra reservation ${clean(data.reference)}`,
    text: [
      "Your reservation is confirmed.",
      `Booking reference: ${clean(data.reference)}`,
      ...data.items.map(
        (item) =>
          `${clean(item.title)}: ${clean(item.date)} at ${clean(item.time)} (${clean(item.timezone)}), ${item.guests} guest(s).`,
      ),
      `Total: ${amount}`,
      payment,
      "Keep this reference and show it to staff at the meeting point.",
    ].join("\n"),
  };
}
/** No provider or scheduler is connected by default. Adapters must classify unknown acceptance as uncertain. */
export async function deliverNextBookingNotification(input: {
  operatorId: string;
  enabled?: boolean;
  store: NotificationStore;
  email?: Sender;
  whatsapp?: Sender;
  timeoutMs?: number;
}) {
  if (!input.enabled) return "disabled";
  if (!input.email && !input.whatsapp) return "unconfigured";
  const job = await input.store.claim(input.operatorId);
  if (!job) return "idle";
  if (job.operator_id !== input.operatorId) throw Error("operator_mismatch");
  let data: Confirmation;
  try {
    data = await input.store.read(job);
  } catch {
    await input.store.finish(job, "retry", "snapshot_unavailable");
    return "retry";
  }
  if (!data.confirmed) {
    await input.store.finish(job, "skipped", "booking_not_confirmed");
    return "skipped";
  }
  let body: ReturnType<typeof renderConfirmation>;
  try {
    body = renderConfirmation(data);
  } catch {
    await input.store.finish(job, "failed", "invalid_confirmation");
    return "failed";
  }
  const canWhatsapp =
    data.whatsappAllowed &&
    /^\+[1-9][0-9]{7,14}$/.test(data.phone ?? "") &&
    input.whatsapp;
  const channel =
    canWhatsapp &&
    job.channel !== "email" &&
    !(job.last_error_code === "whatsapp_rejected" && input.email)
      ? "whatsapp"
      : "email";
  const sender = channel === "whatsapp" ? input.whatsapp : input.email;
  const recipient = channel === "whatsapp" ? data.phone : data.email;
  if (
    !sender ||
    !recipient ||
    (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
  ) {
    await input.store.finish(job, "failed", "channel_unavailable");
    return "failed";
  }
  if (!(await input.store.begin(job, channel))) return "skipped";
  let result: SendResult;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    result = await Promise.race([
      sender(
        {
          ...body,
          to: recipient,
          idempotencyKey: `booking-confirmation:${job.id}:${channel}`,
        },
        controller.signal,
      ),
      new Promise<SendResult>((resolve) => {
        timer = setTimeout(
          () => {
            controller.abort();
            resolve({ status: "uncertain" });
          },
          Math.max(1, Math.min(30000, input.timeoutMs ?? 15000)),
        );
      }),
    ]);
  } catch {
    result = { status: "uncertain" };
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (result.status === "accepted") {
    if (!/^[a-zA-Z0-9_.:+/=-]{1,200}$/.test(result.reference)) {
      await input.store.finish(job, "uncertain", "invalid_provider_receipt");
      return "uncertain";
    }
    await input.store.finish(job, "accepted", undefined, result.reference);
    return "accepted";
  }
  if (result.status === "uncertain") {
    await input.store.finish(job, "uncertain", "provider_result_unknown");
    return "uncertain";
  }
  const retry =
    job.attempt_count < 5 &&
    ((channel === "whatsapp" && Boolean(input.email)) || result.retryable);
  await input.store.finish(
    job,
    retry ? "retry" : "failed",
    channel === "whatsapp" ? "whatsapp_rejected" : "email_rejected",
  );
  return retry ? "retry" : "failed";
}
