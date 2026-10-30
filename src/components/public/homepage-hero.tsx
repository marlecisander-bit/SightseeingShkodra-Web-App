import {heroHeadlineParts} from './hero-headline';
import { getImageProps } from 'next/image';
import type { CSSProperties } from 'react';
import type { HeroFare } from '@/modules/content/hero-fare';
import { type WebsiteContent } from '@/modules/content/website-schema';
import styles from './homepage-hero.module.css';
export function HomepageHero({content:c}:{content:WebsiteContent;fare?:HeroFare;productTitle?:string;stopCount?:number}) {
 const headline=heroHeadlineParts(c['hero.title']);

 const common={alt:c['hero.alt'],sizes:'100vw',quality:75};
 const desktop=getImageProps({...common,src:c['hero.desktop'],width:1920,height:1080}).props;
 const mobile=getImageProps({...common,src:c['hero.mobile'],width:900,height:1200}).props;
 return <section id="home-hero" className={styles.hero} style={{'--hero-desktop-position':c['hero.desktopPosition'],'--hero-mobile-position':c['hero.mobilePosition'],'--hero-wide-position':c['hero.desktopPosition'].replace(/ center$/, ' bottom')} as CSSProperties}>
  <div className={styles.visual}><div className={styles.media}><picture><source media="(max-width:599px) and (orientation:portrait)" srcSet={mobile.srcSet} sizes="100vw"/>{/* One browser-selected CMS photograph; no competing preload. */}<img {...desktop} loading="eager" fetchPriority="high" alt={c['hero.alt']}/></picture></div>
  <div className={styles.intro}><p className={styles.eyebrow}>{c['hero.eyebrow']}</p><h1><span className={styles.headlineLead}>{headline?.lead??c['hero.title']}</span>{' '}{headline&&<><span className={styles.headlineDestination}>{headline.destination}</span>{' '}</>}<em>{c['hero.emphasis']}</em></h1><p className={styles.subtitle}>{c['hero.subtitle']}</p>
  </div>
  </div>
 </section>;
}
