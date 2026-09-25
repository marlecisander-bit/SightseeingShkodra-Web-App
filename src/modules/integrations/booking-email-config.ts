import "server-only";

export function validEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..")
    && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) && domain.includes(".")
    && domain.split(".").every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
}
export type EmailConfig = { enabled: false } | {
  enabled: true; apiKey: string; from: string; owner: string; replyTo: string;
  siteUrl: string; operatorId: string; since: string; testRecipient: string | null;
};
export function bookingEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  if (env.EMAIL_ENABLED !== "true") return { enabled: false };
  const from = env.RESEND_FROM_EMAIL?.trim() ?? "";
  const fromAddress = from.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] ?? from;
  const owner = env.BOOKING_OWNER_EMAIL?.trim() ?? "";
  const replyTo = env.BOOKING_REPLY_TO_EMAIL?.trim() ?? "";
  const testRecipient = env.EMAIL_TEST_RECIPIENT?.trim() || null;
  const operatorId = env.PUBLIC_OPERATOR_ID ?? "";
  const since = env.EMAIL_START_AT ?? "";
  let site: URL;
  try { site = new URL(env.NEXT_PUBLIC_SITE_URL ?? ""); } catch { throw Error("email_configuration_invalid"); }
  const production = env.NODE_ENV === "production" && env.APP_ENV === "production" && (!env.VERCEL_ENV || env.VERCEL_ENV === "production");
  if (!env.RESEND_API_KEY || !validEmail(fromAddress) || /[\r\n]/.test(from) || !validEmail(owner) || !validEmail(replyTo)
    || (testRecipient !== null && !validEmail(testRecipient)) || (!production && !testRecipient)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operatorId)
    || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(since) || !Number.isFinite(Date.parse(since))
    || !["http:","https:"].includes(site.protocol) || site.username || site.password
    || (production && site.protocol !== "https:")) throw Error("email_configuration_invalid");
  return { enabled: true, apiKey: env.RESEND_API_KEY, from, owner, replyTo, testRecipient, operatorId, since, siteUrl: site.origin };
}
