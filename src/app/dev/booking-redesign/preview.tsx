"use client";

import {useEffect,useState} from 'react';
import {BookingProvider, BookButton, BookingFlow} from '@/components/public/booking';
import {HomepageHero} from '@/components/public/homepage-hero';
import {ProductBookingCards} from '@/components/public/product-booking-cards';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import type {BookableProduct} from '@/modules/booking/products';

const products:BookableProduct[] = [
  {id:'10000000-0000-4000-8000-000000000020',title:'Hop On Hop Off',slug:'daily',primary:true,mode:'whole_day',minutes:120,adultPrice:1500,card:{enabled:true,order:0,image:'/images/castle.webp',alt:'Synthetic layout reference',description:'Synthetic layout description for a day exploring Shkodra.',features:['audio_guide']}},
  {id:'10000000-0000-4000-8000-000000000021',title:'Sightseeing Loop Tour',slug:'loop',mode:'selected_departure',minutes:120,adultPrice:1000,card:{enabled:true,order:1,image:'/images/lake.webp',alt:'Synthetic layout reference',description:'Synthetic description for a complete sightseeing loop.',features:['air_conditioning']}},
];
const content={...initialWebsiteContent,'hero.desktop':'/images/castle.webp','hero.mobile':'/images/castle.webp'};

/** Deny real booking requests; acceptance installs synthetic responses in this isolated tab. */
export function BookingRedesignPreview() {
  const [ready,setReady] = useState(false);
  useEffect(() => {
    const original = window.fetch;
    const guarded:typeof fetch = (input,init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin);
      if (url.origin === window.location.origin && ["/api/public/availability","/api/public/checkout"].includes(url.pathname)) {
        return Promise.resolve(Response.json({error:"NOT_PUBLISHED"},{status:503}));
      }
      return original.call(window,input,init);
    };
    window.fetch = guarded;
    let mounted = true;
    queueMicrotask(() => { if (mounted) setReady(true); });
    return () => { mounted = false; if (window.fetch === guarded) window.fetch = original; };
  }, []);
  if (!ready) return <p>Preparing isolated booking preview…</p>;
  return <div className="public-site">
    <p style={{position:'relative',zIndex:4,background:'white',margin:0,padding:8}}>Development fixture. Synthetic content. Do not submit a booking.</p>
    <main className="p-home"><HomepageHero content={content}/><ProductBookingCards products={products} content={content} overlap/></main>
    <section className="p-container p-section"><BookingProvider content={content} product={products[1]}><BookButton>Open Loop booking dialog</BookButton></BookingProvider></section>
    <main className="p-container p-book-page"><BookingProvider content={content} product={products[0]}><BookingFlow/></BookingProvider></main>
  </div>;
}
