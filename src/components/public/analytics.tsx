'use client';
import Script from 'next/script';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { analyticsSessionIdentity, analyticsAllowedPath, consentKey, initializeAnalytics, measurementId, trackBookingEvent, trackPage } from '@/modules/analytics/browser';
export function PublicAnalytics() {
  const path = usePathname();
  const [consent, setConsent] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(false);
  const lastPage = useRef('');
  useEffect(() => { const timer = setTimeout(() => { try { setConsent(localStorage.getItem(consentKey) ?? 'unknown'); } catch { setConsent('unknown'); } }, 0); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    if (consent !== 'granted' || !loaded || !analyticsAllowedPath(path)) { lastPage.current = ''; return; }
    if (lastPage.current === path) return;
    lastPage.current = path;
    trackPage(path);
    if (path === '/book') trackBookingEvent('begin_checkout', 'checkout:' + analyticsSessionIdentity());
  }, [path, consent, loaded]);
  function choose(value: string) {
    try { localStorage.setItem(consentKey, value); } catch { return; }
    // Reload drops queued events and the loaded tag when consent is withdrawn.
    window.location.reload();
  }
  return <>
    {consent === 'granted' && (analyticsAllowedPath(path) || path === '/booking/manage') && <Script id="ss-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onLoad={() => { initializeAnalytics(); setLoaded(true); window.dispatchEvent(new Event("ss-analytics-ready")); }} />}
    {consent && <aside className="p-analytics-consent" aria-label="Analytics privacy settings">
      {(consent === 'unknown' || settings) ? <><p>Allow optional Google Analytics cookies to help us understand website visits and bookings? Your choice does not affect booking. <Link href="/privacy-policy">Privacy policy</Link></p><button className="p-button" onClick={() => choose('granted')}>Allow analytics</button> <button className="p-button" onClick={() => choose('denied')}>Decline analytics</button></> : <button className="p-text-button" onClick={() => setSettings(true)}>Analytics cookie settings</button>}
    </aside>}
  </>;
}