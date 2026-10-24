import Image from 'next/image';
import {AdminIcon} from './admin-icon';
import type {GuestReview} from '@/modules/content/reviews';
import type {Partner} from '@/modules/content/partners';
import {safeWebsiteImage,safeSocialUrl} from '@/modules/content/website-schema';
import styles from './website-engagement.module.css';
export function ReviewSummary({review:r}:{review:GuestReview}){return <span className={styles.review}><span className={styles.identity}><span className={styles.avatar}><AdminIcon name="star"/></span><span><strong>{r.author}</strong><small>{r.source}{r.review_date?' · '+r.review_date:''}{r.language?' · '+r.language:''}</small></span><span className={styles.status}>{r.published?'Published':'Draft'}</span></span><span className={styles.body}>{r.body}</span><span className={styles.meta}><span aria-label={r.rating+' out of 5 stars'}>{r.rating}/5 stars</span><span>Order {r.display_order}</span>{r.featured&&<span>Featured</span>}<span>Edit details <AdminIcon name="chevron-down" size={16}/></span></span></span>;}
export function PartnerSummary({partner:p}:{partner:Partner}){return <span className={styles.partner}>{p.logo_url&&safeWebsiteImage(p.logo_url)?<Image unoptimized loading="lazy" src={p.logo_url} width={72} height={52} alt=""/>:<span className={styles.avatar}><AdminIcon name="handshake"/></span>}<span className={styles.partnerCopy}><strong>{p.name}</strong><small>{p.website_url||'Logo without website link'}</small><span className={styles.meta}><span>{p.is_active?'Active':'Inactive'}</span><span>Order {p.display_order}</span></span></span><AdminIcon name="chevron-down" size={16}/></span>;}

export function PartnerWebsite({partner}:{partner:Partner}){return partner.website_url&&safeSocialUrl(partner.website_url)?<p><a href={partner.website_url} target="_blank" rel="noopener noreferrer">Visit {partner.name} website <AdminIcon name="external-link" size={16}/></a></p>:null;}
