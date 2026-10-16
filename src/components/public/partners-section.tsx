import Image from 'next/image';
import {visiblePartners, type Partner} from '@/modules/content/partners';
import {safePartnerDestination} from '@/modules/content/partner-settings';
import {homepageVisible, type WebsiteContent} from '@/modules/content/website-schema';
import styles from './partners-section.module.css';
export function PartnersSection({content:c,partners}:{content:WebsiteContent;partners:Partner[]}) {
 if(!homepageVisible(c,'partners'))return null;
 const rows=visiblePartners(partners);
 if(!rows.length)return null;
 const cta=c['partners.ctaUrl'];
 return <section id="partners" className={styles.section} aria-labelledby="partners-title"><div className="p-container">
 <header className={styles.heading}><p className={`p-eyebrow ${styles.eyebrow}`}>{c['partners.eyebrow']}</p><h2 id="partners-title">{c['partners.title']}</h2><p>{c['partners.description']}</p></header>
 <ul className={styles.grid}>{rows.map(p=>{
 const identity=<><span className={styles.logo}><Image src={p.logo_url} alt={`${p.name} logo`} fill sizes="(min-width:640px) 126px, 118px" loading="lazy" style={{objectFit:'contain'}}/></span><span className={styles.name}>{p.name}</span></>;
 return <li key={p.id} className={styles.card}>{p.website_url?<a href={p.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.name} website (opens in a new tab)`}>{identity}</a>:<div className={styles.identity}>{identity}</div>}{p.description&&<p>{p.description}</p>}</li>;
 })}</ul>
 {c['partners.ctaEnabled']==='true'&&safePartnerDestination(cta)&&<div className={styles.action}><a className={styles.cta} href={cta} {...(cta.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{c['partners.ctaLabel']}{cta.startsWith('https:')&&<span className="p-screen-reader-only"> (opens in a new tab)</span>}</a></div>}
 </div></section>;
}
