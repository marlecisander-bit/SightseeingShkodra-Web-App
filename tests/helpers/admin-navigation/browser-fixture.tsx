'use client';
// Synthetic local layout fixture. No authentication, service clients or mutation transports.
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {AdminNavigation,AdminPageTrail} from '../../../src/app/admin/admin-navigation';
import {adminNavigationGroups} from '../../../src/modules/identity/admin-navigation-layout';
import type {StaffRole} from '../../../src/modules/identity/roles';
import {WebsiteWorkspace} from '../../../src/app/admin/website-workspace';
import {initialWebsiteContent} from '../../../src/modules/content/website-schema';
import styles from '../../../src/app/admin/admin.module.css';
export default function NavigationFixture(){
 const [role,setRole]=useState<StaffRole>('owner'),[section,setSection]=useState('overview');
 const groups=adminNavigationGroups('fixture',role);
 const account=<div className={styles.accountActions}><p>Synthetic workspace / {role}</p><a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a><Link prefetch={false} href="/admin">Switch workspace</Link><button type="button">Sign out (inert fixture)</button></div>;
 const content={...initialWebsiteContent};
 const record={id:'synthetic',updated_at:'2030-01-01T00:00:00Z',published_at:'2030-01-01T00:00:00Z',body:{content},published_body:{content}};
 return <main className={styles.shell} data-admin-phase="navigation-a"><a className={styles.skip} href="#workspace-content">Skip to content</a><header className={styles.header}><div className={styles.headerIdentity}><Image src="/brand/logo-light.svg" alt="Sightseeing Shkodra" width={116} height={35} unoptimized/><div className={styles.workspaceIdentity}><strong>Synthetic workspace</strong><span>{role}</span></div></div></header>
 <div className={styles.workspace}><AdminNavigation groups={groups} section={section} account={account}/><div className={styles.panel} id="workspace-content"><AdminPageTrail groups={groups} section={section}/><h1>Local navigation review</h1><p>No hosted data, authenticated role session or persistence acceptance. Do not submit editor forms.</p><label>Fixture role<select value={role} onChange={e=>setRole(e.target.value as StaffRole)}>{['owner','admin','operations','content_editor'].map(r=><option key={r}>{r}</option>)}</select></label><label>Fixture page<select value={section} onChange={e=>setSection(e.target.value)}>{['overview','bookings','departures','catalog','content','partners','reviews','notifications','email'].map(s=><option key={s}>{s}</option>)}</select></label>
 {section==='content'?<WebsiteWorkspace operatorId="fixture" record={record} canPublish={role==='owner'||role==='admin'} canSensitive={role==='owner'} destinationManager={<p>Synthetic canonical destinations</p>}/>:<><h2>Existing workspace content</h2><p>Navigation presentation fixture with a representative form.</p><form onSubmit={e=>e.preventDefault()}><label>Date<input type="date" defaultValue="2030-06-01"/></label><label>Passengers<select><option>One adult</option><option>One adult and one child</option></select></label><label>Notes<textarea defaultValue="Synthetic content only"/></label><button type="button">Save (inert fixture)</button></form><details data-admin-context="prices"><summary>Standard Pricing</summary><p>Existing pricing editor position.</p></details><details data-admin-context="schedule"><summary>Standard Schedule</summary><p>Existing schedule editor position.</p></details></>}
 </div></div></main>;
}
