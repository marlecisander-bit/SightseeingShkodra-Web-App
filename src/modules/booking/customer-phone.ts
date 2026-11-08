/** Accept international contact numbers; formatting is not proof of WhatsApp membership. */
export function normalizeCustomerPhone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 50) return null;
  const input = value.trim();
  if (!/^\+[1-9][0-9 ()-]+$/.test(input)) return null;
  const normalized = input.replace(/[ ()-]/g, '');
  return /^\+[1-9][0-9]{6,14}$/.test(normalized) ? normalized : null;
}
