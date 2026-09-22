import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const checkoutCookie = "shkodra_checkout";
function signature(value: string, secret: string) {
  if (secret.length < 32) throw new Error("Session configuration unavailable");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function issueCheckoutSession(secret: string, now = Date.now()) {
  const value = `${randomBytes(32).toString("hex")}.${now + 86400000}`;
  return `${value}.${signature(value, secret)}`;
}
export function verifyCheckoutSession(
  cookie: string | undefined,
  secret: string,
  now = Date.now(),
) {
  if (!cookie || !/^[a-f0-9]{64}\.\d{13}\.[a-f0-9]{64}$/.test(cookie))
    return null;
  const [key, expiry, mac] = cookie.split(".");
  if (Number(expiry) <= now || Number(expiry) > now + 86400000) return null;
  return timingSafeEqual(
    Buffer.from(mac, "hex"),
    Buffer.from(signature(`${key}.${expiry}`, secret), "hex"),
  )
    ? key
    : null;
}
