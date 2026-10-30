'use client';

import Image from 'next/image';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import type {DestinationRecord} from '@/modules/content/destinations';
import type {DestinationStop} from '@/modules/content/destination-stops-server';
import type {saveDestination} from './destination-actions';
import {DestinationsEditor} from './destinations-editor';
import styles from './route-stops.module.css';
import cmsStyles from './website-editor.module.css';

/** A stop-ordered entry point to the canonical destination editor, never a second CMS. */
export function RouteStopsEditor({operatorId,records,stops,stopsAvailable,canPublish=false,saveAction}:{saveAction?:typeof saveDestination;operatorId:string;records:DestinationRecord[];stops:DestinationStop[];stopsAvailable:boolean;canPublish?:boolean}) {
 const [editing,setEditing]=useState<{stop:DestinationStop;record?:DestinationRecord}|null>(null);
 const [notice,setNotice]=useState('');
 const [linking,setLinking]=useState<string|null>(null);
 if(editing)return <div className={cmsStyles.cms}><DestinationsEditor saveAction={saveAction} key={`${editing.stop.id}:${editing.record?.id??'new'}`} operatorId={operatorId} records={records} stops={stops} stopsAvailable={stopsAvailable} canPublish={canPublish} routeStop={editing.stop} initialRecord={editing.record} onDone={message=>{setEditing(null);setNotice(message??'');}}/></div>;
 const unlinked=records.filter(r=>!r.body.stopId&&!r.published_body?.stopId&&r.status!=='archived');
 return <section className={styles.panel} aria-label="Route stop presentation">
  {notice&&<p role="status">{notice}</p>}
  <p>Change the names and photos shown on the website’s route tracker. These are shared destination details; updates also appear wherever that destination is used.</p>
  <p className={styles.note}>Live Map continues to control stop locations, route order, van position, live status and ETA. Its own map labels are managed in the Live Map app.</p>
  {!stopsAvailable&&<p role="status">Published Live Map stops are temporarily unavailable. Existing links are preserved. Try again later or <a href={`/admin/${operatorId}/route-stops?view=destinations`}>open All destinations</a> to edit existing destination content.</p>}
  {stopsAvailable&&!stops.length&&<p>No published route stops are available yet.</p>}
  <ol className={styles.list}>{stops.map((stop,index)=>{
   const matches=records.filter(r=>r.status!=='archived'&&(r.body.stopId===stop.id||r.published_body?.stopId===stop.id));
   const record=matches.length===1?matches[0]:undefined;
   const reassigned=record&&record.body.stopId!==stop.id;
   return <li key={stop.id} className={styles.card}>
    <span className={styles.number}>{index+1}</span>
    {record?.body.image?<Image src={record.body.image} alt={record.body.alt||record.body.name} width={96} height={96} unoptimized className={styles.photo}/>:<span className={styles.placeholder}>No photo</span>}
    <div className={styles.copy}><h2>{record?.body.name||stop.label}</h2><p>Live Map: {stop.label}</p>{record&&<small>{record.status==='published'?'Published':'Draft'}{record.published_body&&JSON.stringify(record.body)!==JSON.stringify(record.published_body)?' · Saved draft changes':''}{record.body.showOnPage?'':' · Hidden on destination pages'}</small>}{matches.length>1&&<p role="alert">More than one destination is linked to this stop. Resolve the associations in All destinations before editing here.</p>}{reassigned&&<p role="alert">This destination has a saved change to its stop link. Review it in All destinations before editing here.</p>}</div>
    <div className={styles.actions}>{record&&!reassigned?<Button onClick={()=>setEditing({stop,record})}>Edit name &amp; image</Button>:!matches.length?<><Button onClick={()=>setLinking(linking===stop.id?null:stop.id)} aria-expanded={linking===stop.id}>Set up stop content</Button>{linking===stop.id&&<div className={styles.setup}><p>Reuse an existing destination, or create one if this stop has no destination yet.</p>{unlinked.length>0&&<label>Existing destination<select defaultValue="" onChange={event=>{const chosen=unlinked.find(r=>r.id===event.target.value);if(chosen)setEditing({stop,record:chosen});}}><option value="" disabled>Choose a destination</option>{unlinked.map(r=><option value={r.id} key={r.id}>{r.body.name}</option>)}</select></label>}<Button className="ss-button--outline" onClick={()=>setEditing({stop})}>Create destination for this stop</Button></div>}</>:<a href={`/admin/${operatorId}/route-stops?view=destinations`}>Review destination links</a>}</div>
   </li>;
  })}</ol>
  <a href="/route" target="_blank" rel="noopener noreferrer">View public Route &amp; Live Map →</a>
 </section>;
}
