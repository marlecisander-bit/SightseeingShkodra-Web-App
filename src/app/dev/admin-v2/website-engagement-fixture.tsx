'use client';
import {ReviewSummary,PartnerSummary,PartnerWebsite} from '@/app/admin/website-engagement';
import {ReviewEditor} from '@/app/admin/reviews-editor';
import {PartnerEditor} from '@/app/admin/partners-editor';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import type {GuestReview} from '@/modules/content/reviews';
import type {Partner} from '@/modules/content/partners';
import styles from '@/app/admin/catalog.module.css';
const op='10000000-0000-4000-8000-000000000001';
const review:GuestReview={id:'synthetic-review',author:'Local review guest',rating:5,body:'Illustrative review for local layout testing. This is synthetic content and is never published.',source:'Google Maps',review_date:'2026-10-24',original_url:null,avatar_url:null,language:'it',featured:true,display_order:1,published:true,updated_at:'2026-10-24T08:00:00Z'};
const partner:Partner={id:'synthetic-partner',name:'Local review partner',logo_url:'/images/lake.webp',website_url:'https://example.test',description:'Synthetic partner used only for local visual review.',display_order:1,is_active:true,updated_at:'2026-10-24T08:00:00Z'};
export function WebsiteEngagementFixture({section,role}:{section:'reviews'|'partners';role:StaffRole}){const canEdit=hasPermission(role,'content.publish');return <><h1>{section==='reviews'?'Guest reviews':'Partners'}</h1><p>Local synthetic records. Every form submission and external destination is blocked.</p><div className={styles.group}><details className={styles.record}><summary>{section==='reviews'?<ReviewSummary review={review}/>:<PartnerSummary partner={partner}/>}</summary><div className={styles.recordBody}>{section==='partners'&&<PartnerWebsite partner={partner}/>} {canEdit?(section==='reviews'?<ReviewEditor operatorId={op} review={review}/>:<PartnerEditor operatorId={op} partner={partner}/>):<p>Published content editing is unavailable for this role.</p>}</div></details></div></>;}
