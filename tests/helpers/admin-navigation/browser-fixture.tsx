'use client';
// Synthetic local layout fixture. Synthetic composition only; never submit real editor forms. Notification requests are inert local projections.
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {AdminNavigation,AdminPageTrail} from '../../../src/app/admin/admin-navigation';
import {adminNavigationGroups} from '../../../src/modules/identity/admin-navigation-layout';
import type {StaffRole} from '../../../src/modules/identity/roles';
import {WebsiteWorkspace} from '../../../src/app/admin/website-workspace';
import {initialWebsiteContent} from '../../../src/modules/content/website-schema';
import styles from '../../../src/app/admin/admin.module.css';
import {AdminIcon} from '../../../src/app/admin/admin-icon';
import {NotificationContext,NotificationBell,NotificationCenter} from '../../../src/app/admin/notifications';
import {AdminStatus} from '../../../src/app/admin/admin-status';

import {OperationsCalendar} from '../../../src/app/admin/operations-calendar';
import {DestinationsEditor} from '../../../src/app/admin/destinations-editor';
import {PartnerEditor} from '../../../src/app/admin/partners-editor';
import {ReviewEditor} from '../../../src/app/admin/reviews-editor';
const fixtureInbox={items:[{id:'synthetic',notification_id:'synthetic',read_at:null,created_at:'2030-06-01T08:00:00Z',notification:{id:'synthetic',type:'booking_created' as const,title:'Synthetic reservation received',message:'Local visual sample. No customer or reservation was created.',booking_id:'11111111-1111-4111-8111-111111111111',severity:'info',event_at:'2030-06-01T08:00:00Z'}}],unread:1,next:null};
const fixtureSettings={history:[],canManageEmail:false,devices:[],preferences:[],publicKey:'',workerEnabled:false,configured:false,pushEnabled:false,paused:true};
const fixtureContext={operator:'11111111-1111-4111-8111-111111111111',inbox:fixtureInbox,error:'',connection:'Local synthetic fixture',version:0,refresh:async()=>{},mutate:async()=>{throw Error('Fixture mutations disabled');},request:async(query='')=>query.includes('settings=1')?fixtureSettings:fixtureInbox};
const stamp='2030-01-01T00:00:00Z';
const calendarDays=Array.from({length:30},(_,i)=>({date:`2030-06-${String(i+1).padStart(2,'0')}`,slots:[{id:null,time:'09:00',capacity:20,open:true,booked:4,held:1,remaining:15,quote:null}],range:null,exception:null}));
const schedule={id:'synthetic',operator_id:'fixture',product_id:'synthetic',vehicle_id:'synthetic',start_date:'2030-06-01',end_date:'2030-06-30',weekdays:[1,2,3,4,5,6,7],departure_times:[{time:'09:00'}],default_capacity:20,status:'published',updated_at:stamp,calendar_ranges:[]};

export default function NavigationFixture({catalog,email}:{catalog:React.ReactNode;email?:React.ReactNode}){
 const [role,setRole]=useState<StaffRole>('owner'),[section,setSection]=useState('overview');
 const groups=adminNavigationGroups('fixture',role);
 const account=<div className={styles.accountActions}><p>Synthetic workspace / {role}</p><a href="/" target="_blank" rel="noopener noreferrer">View website <AdminIcon name="external-link" size={16}/></a><Link prefetch={false} href="/admin">Switch workspace</Link><button type="button">Sign out (inert fixture)</button></div>;
 const content={...initialWebsiteContent};
 const record={id:'synthetic',updated_at:'2030-01-01T00:00:00Z',published_at:'2030-01-01T00:00:00Z',body:{content},published_body:{content}};
 return <NotificationContext.Provider value={fixtureContext}><main className={styles.shell} data-admin-phase="navigation-a"><a className={styles.skip} href="#workspace-content">Skip to content</a><header className={styles.header}><div className={styles.headerIdentity}><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={116} height={35} unoptimized/><div className={styles.workspaceIdentity}><strong>Synthetic workspace</strong><span>{role}</span></div></div><div className={styles.headerActions}>{role!=='content_editor'&&<NotificationBell/>}</div></header>
 <div className={styles.workspace}><AdminNavigation groups={groups} section={section} account={account}/><div className={styles.panel} id="workspace-content"><AdminPageTrail groups={groups} section={section}/><h1>Local navigation review</h1><p>No hosted data, authenticated role session or persistence acceptance. Do not submit editor forms.</p><label>Fixture role<select value={role} onChange={e=>setRole(e.target.value as StaffRole)}>{['owner','admin','operations','content_editor'].map(r=><option key={r}>{r}</option>)}</select></label><label>Fixture page<select value={section} onChange={e=>setSection(e.target.value)}>{['overview','bookings','departures','catalog','content','destinations','partners','reviews','notifications','email'].map(s=><option key={s}>{s}</option>)}</select></label>
 {section==='notifications'?<NotificationCenter/>:section==='email'?email:section==='catalog'?catalog:section==='departures'?<OperationsCalendar operatorId="fixture" schedule={schedule} days={calendarDays} month="2030-06-01" today="2030-06-01" canPrice={role==='owner'||role==='admin'}/>:section==='destinations'?<DestinationsEditor operatorId="fixture" records={[]} stops={[]} stopsAvailable={false} canPublish={role==='owner'||role==='admin'}/>:section==='partners'?<PartnerEditor operatorId="fixture"/>:section==='reviews'?<ReviewEditor operatorId="fixture"/>:section==='content'?<WebsiteWorkspace operatorId="fixture" record={record} canPublish={role==='owner'||role==='admin'} canSensitive={role==='owner'} destinationManager={<p>Synthetic canonical destinations</p>}/>:<><h2>Existing workspace content</h2><p>{["confirmed","pending","cancelled","inactive"].map(status=><AdminStatus key={status} status={status}>{status}</AdminStatus>)}</p><p>Navigation presentation fixture with a representative form.</p><form onSubmit={e=>e.preventDefault()}><label>Date<input type="date" defaultValue="2030-06-01"/></label><label>Passengers<select><option>One adult</option><option>One adult and one child</option></select></label><label>Notes<textarea defaultValue="Synthetic content only"/></label><button type="button">Save (inert fixture)</button></form><details data-admin-context="prices"><summary>Standard Pricing</summary><p>Existing pricing editor position.</p></details><details data-admin-context="schedule"><summary>Standard Schedule</summary><p>Existing schedule editor position.</p></details></>}
 </div></div></main></NotificationContext.Provider>;
}
