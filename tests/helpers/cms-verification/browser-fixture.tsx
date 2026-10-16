'use client';
// Synthetic local browser fixture only. No route, credentials, Auth bypass or persistence transport.
import adminStyles from '../../../src/app/admin/admin.module.css';
import editorStyles from '../../../src/app/admin/website-editor.module.css';
import {useState} from 'react';
import {WebsiteSectionEditor} from '../../../src/app/admin/website-editor';
import {DestinationsEditor} from '../../../src/app/admin/destinations-editor';
import {OverviewPanel} from '../../../src/app/admin/overview-panel';
import {initialWebsiteContent} from '../../../src/modules/content/website-schema';
import {blankDestination} from '../../../src/modules/content/destinations';
import {hasPermission,type StaffRole} from '../../../src/modules/identity/roles';
const records=[0,1,2].map(i=>({id:`synthetic-${i}`,body:{...blankDestination,slug:`fixture-${i}`,name:`Synthetic destination ${i+1}`},published_body:null,status:'draft',destination_order:i,destination_aliases:[],updated_at:'2030-01-01T00:00:00Z'}));
export default function BrowserFixture(){
 const [role,setRole]=useState<StaffRole>('content_editor'),[values,setValues]=useState(initialWebsiteContent);
 return <main className={adminStyles.shell} style={{maxWidth:1100,margin:'auto',padding:16}}><h1>Local synthetic F10 browser checks</h1><p>No authenticated session or persistence acceptance is claimed. Do not submit fixture forms.</p><label>Fixture role<select value={role} onChange={e=>setRole(e.target.value as StaffRole)}>{(['owner','admin','content_editor','operations'] as const).map(r=><option key={r}>{r}</option>)}</select></label><OverviewPanel operatorId="synthetic" role={role}/><DestinationsEditor operatorId="synthetic" records={records} stops={[]} stopsAvailable={false} canPublish={hasPermission(role,'content.publish')}/><div className={editorStyles.cms}><WebsiteSectionEditor operatorId="synthetic" sectionId="hero" content={initialWebsiteContent} values={values} setValues={setValues} stamp="2030-01-01T00:00:00Z" canPublish={hasPermission(role,'content.publish')}/></div></main>;
}
