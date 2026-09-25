import "server-only";
export type EmailMessage = { from: string; to: string[]; reply_to: string; subject: string; html: string; text: string };
export type EmailResult = { outcome: "accepted" | "retry" | "failed"; code?: string; reference?: string };
/** No SDK retries: the durable queue owns retries and the immutable idempotency key. */
export async function sendResendEmail(apiKey: string, key: string, message: EmailMessage, transport: typeof fetch = fetch): Promise<EmailResult> {
  try {
    const response = await transport("https://api.resend.com/emails", {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(message),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && typeof body?.id === "string" && /^[a-zA-Z0-9_-]{1,200}$/.test(body.id)) return { outcome: "accepted", reference: body.id };
    if (response.ok) return { outcome: "retry", code: "provider_response_uncertain" };
    if (response.status === 429 || response.status >= 500 || (response.status === 409 && body?.name === "concurrent_idempotent_requests")) return { outcome: "retry", code: `resend_http_${response.status}` };
    return { outcome: "failed", code: `resend_http_${response.status}` };
  } catch {
    // Do not log provider messages/request objects: they can contain recipient data or credentials.
    return { outcome: "retry", code: "provider_network_uncertain" };
  }
}
