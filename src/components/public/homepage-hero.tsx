import { BookingPriceIndicator } from "./booking-controls";
import type { HeroFare } from "@/modules/content/hero-fare";
import { getImageProps } from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { homepageVisible, type WebsiteContent } from '@/modules/content/website-schema';
import { ActionLink } from './ui';
export function HomepageHero({content:c,fare,productTitle,stopCount}:{content:WebsiteContent;fare?:HeroFare;productTitle?:string;stopCount?:number}){
 const common={alt:c['hero.alt'],sizes:'100vw',quality:75};
 const desktop=getImageProps({...common,src:c['hero.desktop'],width:1920,height:1080}).props;
 const mobile=getImageProps({...common,src:c['hero.mobile'],width:900,height:1200}).props;
 return <section id="home-hero" className="p-hero p-hero-v2" style={{'--hero-desktop-position':c['hero.desktopPosition'],'--hero-mobile-position':c['hero.mobilePosition']} as CSSProperties}>
 <div className="p-media"><picture><source media="(max-width:900px) and (orientation:portrait)" srcSet={mobile.srcSet} sizes="100vw"/>{/* Browser selects one responsive image; no competing preload. */}<img {...desktop} loading="eager" fetchPriority="high" alt={c['hero.alt']}/></picture></div>
 <div className="p-hero-content"><p className="p-eyebrow">{c['hero.eyebrow']}</p><h1>{c['hero.title']}<br/><em>{c['hero.emphasis']}</em></h1><p><span className="p-hero-description">{c['hero.description']}<br/></span>{c['hero.subtitle']}</p><div className="p-hero-commercial">{productTitle && <p className="p-hero-product">{productTitle}</p>}{!!stopCount && <p className="p-hero-benefits">{stopCount} {stopCount===1?"stop":"stops"} around Shkodra</p>}<BookingPriceIndicator amount={fare?.amount} date={fare?.date} currency={fare?.currency}/><div className="p-actions"><ActionLink href="/book" className="p-button-booking">{c['hero.book']}</ActionLink><ActionLink href="/route" className="p-hero-track">{c['hero.track']}</ActionLink></div>{homepageVisible(c,"departures") && <div id="home-hero-service" className="p-hero-service" aria-live="polite"/>}</div></div>
 <Link className="p-hero-scroll" href={homepageVisible(c, "route") ? "#route" : "/tour"}>{c['hero.discover']}<span aria-hidden="true"/></Link>
 </section>;
}
