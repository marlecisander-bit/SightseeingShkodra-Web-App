export const checkoutStorageKey = "shkodra-checkout-v1";
export function clearCheckoutSession() {
  try { sessionStorage.removeItem(checkoutStorageKey); } catch { /* Storage may be unavailable. */ }
}
export function freshBookingSelection(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/Tirane",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  return {date, guests:1, departureId:"", passengers:{adult:1,child:0,infant:0}};
}
