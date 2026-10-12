export const measurementId = 'G-TYPP062HC7';
export const consentKey = 'ss-analytics-consent-v1';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
export function analyticsAllowedPath(path: string) {
  return ['/', '/book', '/route', '/explore', '/faq', '/privacy-policy', '/terms-and-conditions', '/credits'].includes(path) || /^\/explore\/[a-z0-9-]+$/.test(path);
}
export function hasConsent() {
  try { return localStorage.getItem(consentKey) === 'granted'; } catch { return false; }
}
export function trackBookingEvent(name: 'view_item' | 'begin_checkout' | 'purchase' | 'booking_cancelled' | 'booking_modified', key: string, amount?: number, currency = 'EUR') {
  if (typeof window === 'undefined' || !hasConsent()) return;
  const w = window as AnalyticsWindow;
  if (!w.gtag || !(analyticsAllowedPath(location.pathname) || location.pathname === '/booking/manage')) return;
  // Persist only a digest of the opaque action identity; never store credentials here.
  void crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)).then(buffer => {
    if (!hasConsent()) return;
    const id = Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
    const marker = `ss-ga:${name}:${id}`;
    try {
      if (localStorage.getItem(marker)) return;
      localStorage.setItem(marker, '1');
    } catch { return; } // Fail closed when durable retry protection is unavailable.
    w.gtag?.('event', name, {
      send_to: measurementId,
      page_location: 'https://sightseeingshkodra.app' + location.pathname,
      page_referrer: '', page_title: 'Sightseeing Shkodra',
      ...(amount !== undefined && Number.isFinite(amount) ? { value: amount / 100, currency } : {}),
      ...(name === 'purchase' ? { transaction_id: id, payment_type: 'pay_at_meeting_point' } : {}),
      ...(name === 'view_item' || name === 'begin_checkout' || name === 'purchase' ? { items: [{ item_id: 'shkodra-sightseeing-ticket', item_name: 'Shkodra sightseeing ticket' }] } : {}),
    });
  }).catch(() => {});
}
export function initializeAnalytics() {
  const w = window as AnalyticsWindow;
  if (w.gtag) return;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function (...args: unknown[]) { w.dataLayer?.push(args); };
  w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  w.gtag('js', new Date());
  w.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: 'https://sightseeingshkodra.app' + location.pathname, page_referrer: '', page_title: 'Sightseeing Shkodra' });
}
export function trackPage(path: string) {
  if (!hasConsent() || !analyticsAllowedPath(path)) return;
  (window as AnalyticsWindow).gtag?.('event', 'page_view', { send_to: measurementId, page_location: 'https://sightseeingshkodra.app' + path, page_referrer: '', page_title: 'Sightseeing Shkodra' });
}

export function analyticsSessionIdentity() {
  try { const existing = sessionStorage.getItem('ss-ga-session'); if (existing) return existing; const id = crypto.randomUUID(); sessionStorage.setItem('ss-ga-session', id); return id; } catch { return 'unavailable'; }
}
