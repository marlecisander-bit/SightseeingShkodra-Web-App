"use client";
import {useState} from 'react';
import {useHomepageMobile} from './use-homepage-mobile';
import {useHomepageJourney} from './homepage-journey';
import dynamic from 'next/dynamic';
const LiveMapEmbed=dynamic(()=>import('./live-map-embed').then(m=>m.LiveMapEmbed),{ssr:false,loading:()=> <p role="status">Loading map controls…</p>});
/** One lazy map supplies both the homepage journey and visible map. */
export function HomepageMapDisclosure(){const [open,setOpen]=useState(true);const live=useHomepageJourney();const mobile=useHomepageMobile();return <details open className="p-home-inline-map" onToggle={event=>{setOpen(event.currentTarget.open);if(!event.currentTarget.open)live?.receive(null,'loading');}}><summary>Show live map here</summary>{open&&<LiveMapEmbed collapseRecovery onJourney={mobile===false?live?.receive:undefined}/>}</details>;}
