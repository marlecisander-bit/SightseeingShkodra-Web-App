import Image from 'next/image';
import type {DestinationRecord} from '@/modules/content/destinations';
import type {DestinationStop} from '@/modules/content/destination-stops-server';
import styles from './route-stops.module.css';

export function RouteStopsEditor({records,stops,stopsAvailable}:{records:DestinationRecord[];stops:DestinationStop[];stopsAvailable:boolean}) {
 return <section className={styles.panel} aria-label="Route stop presentation">
  <p>Review the published Live Map stops and their linked website destinations. Use All destinations to edit or link a destination.</p>
  <p className={styles.note}>Manage map pin names, map photos, locations, route order and GPS in Calendar → Live Map admin.</p>
  {!stopsAvailable&&<p role="status">Published Live Map stops are temporarily unavailable. Existing links are preserved. Destination content remains available in All destinations.</p>}
  {stopsAvailable&&!stops.length&&<p>No published route stops are available yet.</p>}
  <ol className={styles.list}>{stops.map((stop,index)=>{
   const matches=records.filter(r=>r.status!=='archived'&&(r.body.stopId===stop.id||r.published_body?.stopId===stop.id));
   const record=matches.length===1?matches[0]:undefined;
   const reassigned=record&&record.body.stopId!==stop.id;
   return <li key={stop.id} className={styles.card}>
    <span className={styles.number}>{index+1}</span>
    {record?.body.image?<Image src={record.body.image} alt={record.body.alt||record.body.name} width={96} height={96} unoptimized className={styles.photo}/>:<span className={styles.placeholder}>No photo</span>}
    <div className={styles.copy}><h2>{stop.label}</h2>{record?<p>Website destination: {record.body.name}</p>:matches.length===0&&<p>No linked destination</p>}{record&&<small>{record.status==='published'?'Published':'Draft'}{record.published_body&&JSON.stringify(record.body)!==JSON.stringify(record.published_body)?' · Saved draft changes':''}{record.body.showOnPage?'':' · Hidden on destination pages'}</small>}{matches.length>1&&<p role="alert">More than one destination is linked to this stop. Resolve the associations in All destinations.</p>}{reassigned&&<p role="alert">This destination has a saved change to its stop link. Review it in All destinations.</p>}</div>
   </li>;
  })}</ol>
 </section>;
}
