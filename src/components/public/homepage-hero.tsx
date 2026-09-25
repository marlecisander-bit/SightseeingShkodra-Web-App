import { getImageProps } from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { WebsiteContent } from '@/modules/content/website-schema';
import { publishedAmenities } from '@/modules/content/hero-amenities';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { ActionLink } from './ui';
export function HomepageHero({content:c}:{content:WebsiteContent}){
 const common={alt:c['hero.alt'],sizes:'100vw',quality:75};
 const desktop=getImageProps({...common,src:c['hero.desktop'],width:1920,height:1080}).props;
 const mobile=getImageProps({...common,src:c['hero.mobile'],width:900,height:1200}).props;
 const amenities=publishedAmenities(c['hero.amenities']);
 return <section id="home-hero" className="p-hero p-hero-v2" style={{'--hero-desktop-position':c['hero.desktopPosition'],'--hero-mobile-position':c['hero.mobilePosition']} as CSSProperties}>
 <div className="p-media"><picture><source media="(max-width:700px)" srcSet={mobile.srcSet} sizes="100vw"/>{/* Browser selects one responsive image; no competing preload. */}<img {...desktop} loading="eager" fetchPriority="high" alt={c['hero.alt']}/></picture></div>
 <div className="p-hero-content"><p className="p-eyebrow">{c['hero.eyebrow']}</p><h1>{c['hero.title']}<br/><em>{c['hero.emphasis']}</em></h1><p>{c['hero.description']}<br/>{c['hero.subtitle']}</p><div className="p-actions"><ActionLink href="/book" className="p-button-booking">{c['hero.book']}</ActionLink><ActionLink href="/live" className="p-hero-track">{c['hero.track']}</ActionLink></div></div>
 {amenities.length>0&&<ul className="p-hero-amenities" aria-label="Tour highlights">{amenities.map(a=><li key={a.id}><AmenityIcon name={a.icon}/><div><strong>{a.title}</strong>{a.description&&<span>{a.description}</span>}</div></li>)}</ul>}
 <Link className="p-hero-scroll" href="#home-intro">{c['hero.discover']}<span aria-hidden="true"/></Link>
 </section>;
}
