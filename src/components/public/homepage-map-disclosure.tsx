"use client";
import {useState} from 'react';
import dynamic from 'next/dynamic';
const LiveMapEmbed=dynamic(()=>import('./live-map-embed').then(m=>m.LiveMapEmbed),{loading:()=> <p role="status">Loading map controls…</p>});
/** No iframe or map controls bundle until the existing disclosure is opened. */
export function HomepageMapDisclosure(){const [open,setOpen]=useState(false);return <details className="p-home-inline-map" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Show live map here</summary>{open&&<LiveMapEmbed collapseRecovery/>}</details>;}
