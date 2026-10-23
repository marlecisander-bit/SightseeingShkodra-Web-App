import {notFound} from 'next/navigation';
import {RouteStopsEditor} from '@/app/admin/route-stops-editor';
import {blankDestination,type DestinationRecord} from '@/modules/content/destinations';
import styles from '@/app/admin/admin.module.css';

export default async function RouteStopsPreview({searchParams}:{searchParams:Promise<{state?:string;role?:string}>}) {
 if(process.env.NODE_ENV!=='development')notFound();
 const {state,role}=await searchParams;
 const names=['Start / Stop — Rozafa Hotel','Shiroka & Lake','Rozafa Castle','Historic Centre','Mesi Bridge'];
 const stops=names.map((label,i)=>({id:`fixture-stop-${i}`,label}));
 const records:DestinationRecord[]=names.slice(1).map((name,i)=>{const body={...blankDestination,name,slug:`fixture-${i}`,stopId:stops[i+1].id,text:'Local fixture destination description.',image:`/images/${['lake','castle','centre','bridge-view'][i]}.webp`,alt:name,seoTitle:name,seoDescription:'Fixture search description.'};return {id:`fixture-record-${i}`,body,published_body:{...body},status:'published',destination_order:i,updated_at:'2026-10-23T08:00:00Z',destination_aliases:[]};});
 if(state==='duplicate')records.push({...records[0],id:'fixture-conflict'});
 if(state==='unlinked')records[0]={...records[0],body:{...records[0].body,stopId:null},published_body:{...records[0].body,stopId:null}};
 return <main className={styles.shell} style={{maxWidth:1200,margin:'24px auto'}}><div className={styles.panel}><p>Local UI fixture — no production content. Do not save or upload in this preview.</p><h1>Route stops</h1><RouteStopsEditor operatorId="10000000-0000-4000-8000-000000000001" records={records} stops={state==='unavailable'?[]:stops} stopsAvailable={state!=='unavailable'} canPublish={role!=='editor'}/></div></main>;
}
