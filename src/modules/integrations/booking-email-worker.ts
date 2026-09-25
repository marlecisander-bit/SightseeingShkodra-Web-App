import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bookingEmailConfig, validEmail, type EmailConfig } from "./booking-email-config";
import { bookingEmailTemplate, type BookingEmailEvent, type EmailBooking, type EmailEnvelope, type RecipientType } from "./booking-email-template";
import { sendResendEmail, type EmailMessage, type EmailResult } from "./resend-provider";

export type EmailJob = {
  id: string; operator_id: string; booking_id: string; booking_reference: string;
  event_type: BookingEmailEvent; recipient_type: RecipientType; manual: boolean;
  status: string; attempt_count: number; lease_token: string;
  send_snapshot: EmailBooking; envelope: EmailEnvelope;
};
export type EmailStore = {
  enqueue(operator: string, since: string): Promise<void>;
  claim(operator: string): Promise<EmailJob | null>;
  prepare(job: EmailJob, envelope: EmailEnvelope): Promise<EmailJob>;
  finish(job: EmailJob, outcome: string, code?: string, reference?: string): Promise<void>;
  redact(operator: string): Promise<void>;
};
export function bookingEmailStore(client: Pick<SupabaseClient, "rpc">): EmailStore {
  const call = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw Error("email_persistence_unavailable");
    return data;
  };
  return {
    async enqueue(operator, since) { await call("enqueue_booking_emails_v2", { p_operator_id: operator, p_since: since }); },
    async claim(operator) { const rows = await call("claim_booking_email_v2", { p_operator_id: operator }); return rows?.[0] ?? null; },
    async prepare(job, envelope) {
      const data = await call("prepare_booking_email_v2", { p_operator_id: job.operator_id, p_id: job.id, p_token: job.lease_token, p_envelope: envelope });
      const prepared = Array.isArray(data) ? data[0] : data;
      if (!prepared || prepared.id !== job.id) throw Error("email_persistence_unavailable");
      return prepared;
    },
    async finish(job, outcome, code, reference) {
      await call("finish_booking_notification_v1", { p_operator_id: job.operator_id, p_delivery_id: job.id, p_token: job.lease_token, p_outcome: outcome, p_error_code: code ?? null, p_reference: reference ?? null });
    },
    async redact(operator) { await call("redact_booking_email_logs_v2", { p_operator_id: operator }); },
  };
}
type AuditEntry = { event: string; reference?: string; recipient?: string; manual?: boolean; status: string; providerId?: string; code?: string };
/** Trusted scheduler only. No public caller-supplied operator, message or recipient. */
export async function processBookingEmails(store: EmailStore, config: EmailConfig = bookingEmailConfig(), send: (key: string, message: EmailMessage) => Promise<EmailResult> = (key, message) => sendResendEmail(config.enabled ? config.apiKey : "", key, message), log: (entry: AuditEntry) => void = entry => console.info(JSON.stringify({ component: "booking_email", ...entry }))) {
  if (!config.enabled) { log({ event: "worker", status: "disabled" }); return { status: "disabled", processed: 0 }; }
  const startDeadline = Date.now() + 25_000;
  await store.redact(config.operatorId);
  await store.enqueue(config.operatorId, config.since);
  let processed = 0;
  // Leave room for one claim/prepare/send/finish cycle before the 60-second limit.
  for (; processed < 4 && Date.now() < startDeadline; processed++) {
    const claimed = await store.claim(config.operatorId);
    if (!claimed) break;
    const job = await store.prepare(claimed, { version: 1, from: config.from, owner: config.owner, replyTo: config.replyTo, siteUrl: config.siteUrl, testRecipient: config.testRecipient });
    const audit = { event: job.event_type, reference: job.booking_reference, recipient: job.recipient_type, manual: job.manual };
    if (job.status === "skipped") { log({ ...audit, status: "skipped" }); continue; }
    // A saved production job must never escape into live delivery on a development host.
    if (job.envelope.version !== 1 || job.envelope.testRecipient !== config.testRecipient) {
      await store.finish(job, "failed", "email_mode_changed"); log({ ...audit, status: "failed", code: "email_mode_changed" }); continue;
    }
    const originalTo = job.recipient_type === "customer" ? job.send_snapshot.email : job.envelope.owner;
    if (!validEmail(originalTo)) {
      await store.finish(job, "skipped", "recipient_email_invalid"); log({ ...audit, status: "skipped", code: "recipient_email_invalid" }); continue;
    }
    const template = bookingEmailTemplate(job.event_type, job.recipient_type, job.send_snapshot, job.envelope, job.operator_id, job.booking_id);
    const result = await send(`booking-email/${job.id}`, { from: job.envelope.from, to: [job.envelope.testRecipient ?? originalTo], reply_to: job.envelope.replyTo, ...template });
    const outcome = result.outcome === "retry" && job.attempt_count >= 5 ? "uncertain" : result.outcome;
    await store.finish(job, outcome, result.code, result.reference);
    log({ ...audit, status: outcome, providerId: result.reference, code: result.code });
  }
  return { status: config.testRecipient ? "test" : "live", processed };
}
