import {heroHeadlineParts} from './hero-headline';
import { homepageHeroImages } from './homepage-hero-images';
import type { CSSProperties, ReactNode } from 'react';
import type { HeroFare } from '@/modules/content/hero-fare';
import { type WebsiteContent } from '@/modules/content/website-schema';
import styles from './homepage-hero.module.css';
export function HomepageHero({content:c,children}:{content:WebsiteContent;children?:ReactNode;fare?:HeroFare;productTitle?:string;stopCount?:number}) {
 const headline=heroHeadlineParts(c['hero.title']);

 const {desktop,mobile}=homepageHeroImages(c);
 const intro = <div className={styles.intro}><p className={styles.eyebrow}>{c['hero.eyebrow']}</p><h1><span className={styles.headlineLead}>{headline?.lead??c['hero.title']}</span>{' '}{headline&&<><span className={styles.headlineDestination}>{headline.destination}</span>{' '}</>}<em>{c['hero.emphasis']}</em></h1><p className={styles.subtitle}>{c['hero.subtitle']}</p>
  </div>;
 return <section id="home-hero" className={`${styles.hero}${children ? ` ${styles.composed}` : ""}`} style={{'--hero-desktop-position':c['hero.desktopPosition'],'--hero-mobile-position':c['hero.mobilePosition'],'--hero-phone-position':c['hero.mobilePosition']==='center center'?'center 75%':c['hero.mobilePosition'],'--hero-wide-position':c['hero.desktopPosition'].replace(/ center$/, ' bottom')} as CSSProperties}>
  <div className={styles.visual}><div className={styles.media}><picture><source media="(max-width:599px)" srcSet={mobile.srcSet} sizes="100vw"/>{/* The preload uses these same candidates and complementary media queries. */}<img {...desktop} loading="eager" fetchPriority="high" alt={c['hero.alt']}/></picture></div>
  {children ? <div className={styles.layout}>{intro}{children}</div> : intro}
  </div>
 </section>;
}
