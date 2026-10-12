import { getImageProps } from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { HeroFare } from '@/modules/content/hero-fare';
import { homepageVisible, type WebsiteContent } from '@/modules/content/website-schema';
import { publishedAmenities } from '@/modules/content/hero-amenities';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { HeroBookingWidget } from './hero-booking-widget';
import styles from './homepage-hero.module.css';
export function HomepageHero({content:c,fare,productTitle,stopCount}:{content:WebsiteContent;fare?:HeroFare;productTitle?:string;stopCount?:number}) {
 const amenities=publishedAmenities(c['hero.amenities']);
 const common={alt:c['hero.alt'],sizes:'100vw',quality:75};
 const desktop=getImageProps({...common,src:c['hero.desktop'],width:1920,height:1080}).props;
 const mobile=getImageProps({...common,src:c['hero.mobile'],width:900,height:1200}).props;
 return <section id="home-hero" className={styles.hero} style={{'--hero-desktop-position':c['hero.desktopPosition'],'--hero-mobile-position':c['hero.mobilePosition'],'--hero-wide-position':c['hero.desktopPosition'].replace(/ center$/, ' bottom')} as CSSProperties}>
  <div className={styles.visual}><div className={styles.media}><picture><source media="(max-width:599px) and (orientation:portrait)" srcSet={mobile.srcSet} sizes="100vw"/>{/* One browser-selected CMS photograph; no competing preload. */}<img {...desktop} loading="eager" fetchPriority="high" alt={c['hero.alt']}/></picture></div>
  <div className={styles.intro}><p className={styles.eyebrow}>{c['hero.eyebrow']}</p><h1>{c['hero.title']} <em>{c['hero.emphasis']}</em></h1><p className={styles.subtitle}>{c['hero.subtitle']}</p>
  </div><ul className={styles.benefits} aria-label="Daily ticket benefits">{amenities.length?amenities.map(amenity=><li key={amenity.id}><AmenityIcon name={amenity.icon}/><span>{amenity.title}</span></li>):<>{!!stopCount&&<li><AmenityIcon name="stop"/><span>{stopCount} {stopCount===1?'Stop':'Stops'}</span><span className="p-screen-reader-only">{stopCount===1?'1 stop':`${stopCount} stops`} around Shkodra</span></li>}{productTitle&&<><li><AmenityIcon name="clock"/><span>All Day</span></li><li><AmenityIcon name="van"/><span>Hop On / Hop Off</span></li></>}{homepageVisible(c,'live')&&<li><AmenityIcon name="map"/><span>{c['hero.track']}</span></li>}</>}</ul>
  </div><div className={styles.content}><HeroBookingWidget fare={fare} productTitle={productTitle} bookLabel={c['hero.book']}/>
  <div className={styles.shortcuts}><Link href="/route"><AmenityIcon name="map"/><span>{c['hero.track']}</span></Link><Link href={homepageVisible(c,'route')?'#route':'/route'}>{c['hero.discover']} <span aria-hidden="true">↓</span></Link></div>   {c['hero.description']&&<details className={styles.about}><summary>About your day</summary><p>{c['hero.description']}</p></details>}
</div>
 </section>;
}
