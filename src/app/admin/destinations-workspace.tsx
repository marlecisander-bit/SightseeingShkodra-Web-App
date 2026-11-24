'use client';
import type {saveDestination} from './destination-actions';
import {useState} from 'react';
import type {DestinationRecord} from '@/modules/content/destinations';
import type {DestinationStop} from '@/modules/content/destination-stops-server';
import {RouteStopsEditor} from './route-stops-editor';
import {DestinationsEditor} from './destinations-editor';
import styles from './products.module.css';
export function DestinationsWorkspace({initialView='stops',...props}:{saveAction?:typeof saveDestination;initialView?:'stops'|'destinations';operatorId:string;records:DestinationRecord[];stops:DestinationStop[];stopsAvailable:boolean;canPublish?:boolean}){
 const [view,setView]=useState(initialView);
 function change(next:typeof view){if(next!==view&&window.dispatchEvent(new CustomEvent('admin:before-navigation',{cancelable:true})))setView(next);}
 return <section><nav className={styles.tabs} aria-label="Stops and destinations"><button type="button" aria-pressed={view==='stops'} onClick={()=>change('stops')}>Route stops</button><button type="button" aria-pressed={view==='destinations'} onClick={()=>change('destinations')}>All destinations</button></nav>{view==='stops'?<RouteStopsEditor {...props}/>:<DestinationsEditor {...props}/>}</section>;
}
