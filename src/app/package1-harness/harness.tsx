'use client';
import {useState,type SyntheticEvent} from 'react';
import {HomepageHero} from '@/components/public/homepage-hero';
import {BookingProvider} from '@/components/public/booking';
import {DestinationsEditor} from '@/app/admin/destinations-editor';
import {WebsiteSectionEditor} from '@/app/admin/website-editor';
import {OverviewPanel} from '@/app/admin/overview-panel';
import {initialWebsiteContent,type WebsiteContent} from '@/modules/content/website-schema';
import {blankDestination} from '@/modules/content/destinations';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import admin from '@/app/admin/admin.module.css';
import styles from './harness.module.css';
const syntheticId='90000000-0000-4000-8000-000000000001';
const amenity={id:'90000000-0000-4000-8000-000000000099',title:'Audio Guide',icon:'headphones',description:'Retained synthetic historical description',published:true,display_order:1,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'};
const saved:WebsiteContent={...initialWebsiteContent,'hero.book':'Reserve synthetic day','route.text':'Retained synthetic route text','labels.ticket':'Retained synthetic ticket label','labels.faq':'Retained synthetic FAQ label','hero.amenities':JSON.stringify(['5 Stops','All Day','Hop On/Off','Audio Guide','Track Live'].map((title,i)=>({...amenity,id:`90000000-0000-4000-8000-00000000009${i}`,title,icon:['stop','clock','van','headphones','map'][i],display_order:i+1})))};
const records=['First sample','Second sample','Third sample'].map((name,i)=>({id:`90000000-0000-4000-8000-00000000000${i+2}`,body:{...blankDestination,name,slug:`synthetic-${i}`},published_body:null,status:'draft',destination_order:i,destination_aliases:[],updated_at:'2026-01-01T00:00:00Z'}));
export function Harness(){
 const [role,setRole]=useState<StaffRole>('owner'),[section,setSection]=useState('hero'),[values,setValues]=useState(saved),[notice,setNotice]=useState('');
 const canPublish=hasPermission(role,'content.publish');
 function block(event:SyntheticEvent){event.preventDefault();event.stopPropagation();setNotice('Synthetic harness: persistence, uploads and reorder actions are disabled.');}
 // No authentication simulation: only real component permission props and synthetic local state.
 // Production authorization continues to be tested independently in disposable SQL/CI.
 return <><header className={styles.notice}><h1>Package 1 synthetic acceptance</h1><p>No real operator, authentication, booking or database. Role choices test UI policy only. Writes and uploads are disabled. This branch refuses Production builds.</p><label>Fixture role<select value={role} onChange={e=>setRole(e.target.value as StaffRole)}><option value="owner">Owner</option><option value="admin">Admin publisher</option><option value="content_editor">Content editor</option></select></label></header>
 <div className="public-site"><BookingProvider preview><HomepageHero content={values} productTitle="Synthetic daily ticket" fare={{amount:1000,currency:'EUR',date:'2030-07-01'}} stopCount={5}/></BookingProvider></div>
 <main className={admin.shell+' '+styles.controls} onSubmitCapture={block} onChangeCapture={e=>{if(e.target instanceof HTMLInputElement&&e.target.type==='file')block(e);}} onClickCapture={e=>{const target=e.target as Element;const button=target.closest('button');if(button&&['Move earlier','Move later'].includes(button.textContent?.trim()??''))block(e);const link=target.closest('a');if(link)block(e);}}>
 <section aria-label="Website editor fixture"><h2>Website editor fixture</h2><label>Fixture section<select value={section} onChange={e=>setSection(e.target.value)}><option value="hero">Hero</option><option value="route">Route</option><option value="editorialLabels">Shared labels</option><option value="heroAmenities">Amenities</option></select></label><WebsiteSectionEditor key={section+role} operatorId={syntheticId} sectionId={section} content={saved} stamp="2026-01-01T00:00:00Z" values={values} setValues={setValues} canPublish={canPublish}/></section>
 <section aria-label="Destinations fixture"><DestinationsEditor operatorId={syntheticId} records={records} stops={[]} stopsAvailable={false} canPublish={canPublish}/></section>
 <section aria-label="Overview fixture"><h2>Overview fixture</h2><OverviewPanel operatorId={syntheticId} role={role}/></section>
 <details><summary>Synthetic retained data evidence</summary><output aria-label="Synthetic retained data">{JSON.stringify({route:values['route.text'],ticket:values['labels.ticket'],faq:values['labels.faq'],amenities:JSON.parse(values['hero.amenities'])})}</output></details><p role="status">{notice}</p></main></>;
}
