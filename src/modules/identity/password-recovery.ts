export function recoveryRedirect(siteUrl: string | undefined): string {
  const url = new URL(siteUrl ?? "");
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("Invalid site URL");
  return new URL("/auth/activate", url).href;
}
export async function requestPasswordRecovery(email: unknown, siteUrl: string | undefined, send: (email:string, redirectTo:string)=>Promise<unknown>) {
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
  try { await send(email.trim(), recoveryRedirect(siteUrl)); } catch { /* Generic response prevents account enumeration and provider-detail leaks. */ }
}
