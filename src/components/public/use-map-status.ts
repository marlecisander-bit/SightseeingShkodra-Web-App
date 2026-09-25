'use client';
import {useEffect,useState} from 'react';
const origin='https://sightseeingshkodralivetrackingapp.netlify.app';
export function useMapStatus() {
 const [status,setStatus]=useState<string|null>(null);
 useEffect(()=>{
  let expires:ReturnType<typeof setTimeout>|undefined;
  const frames=()=>Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe')).filter(f=>f.src.startsWith(origin+'/live-map.html?'));
  const request=()=>frames().forEach(f=>f.contentWindow?.postMessage({type:'shkodra:request-status'},origin));
  const receive=(event:MessageEvent)=>{
   if(event.origin!==origin||!frames().some(f=>f.contentWindow===event.source))return;
   const d=event.data;if(d?.type!=='shkodra:public-status'||d.version!==1||![d.label,d.name,d.movement].every(v=>typeof v==='string'&&v.length<=180))return;
   const name=/^(--|Calculating|undefined|NaN)/i.test(d.name)?'':d.name;
   setStatus(d.unavailable?d.movement:name?`${d.label}: ${name}`:d.movement||null);
   clearTimeout(expires);expires=setTimeout(()=>setStatus(null),45000);
  };
  window.addEventListener('message',receive);request();const timer=setInterval(request,15000);
  return()=>{window.removeEventListener('message',receive);clearInterval(timer);clearTimeout(expires);};
 },[]);
 return status;
}
