'use client';
import {useState} from 'react';
import {SeasonalAnnouncement} from '@/components/public/seasonal-announcement';
import {seasonalActive} from '@/modules/content/seasonal-announcement';
export function SeasonalPreview({content}:{content:Record<string,string>}){
 const [mobile,setMobile]=useState(false);
 return <div aria-label="Seasonal announcement preview"><p>English is the current public language. These are announcement details only; Calendar &amp; Pricing still controls bookings. Dates include the end date in Europe/Tirane.</p><p>Current schedule: <strong>{seasonalActive(content)?'Visible':'Hidden'}</strong>. The presentation preview below always shows the ribbon, including when disabled.</p><div role="group" aria-label="Announcement preview size"><button type="button" aria-pressed={!mobile} onClick={()=>setMobile(false)}>Desktop preview</button> <button type="button" aria-pressed={mobile} onClick={()=>setMobile(true)}>Mobile preview</button></div><div style={{containerType:'inline-size',maxWidth:mobile?390:1000,marginTop:12,border:'1px solid #eadfd1',borderRadius:12,overflow:'clip'}}><SeasonalAnnouncement content={content} initialActive preview/><p style={{margin:0,padding:12,fontSize:12}}>Click Learn More to preview the information popup. The saved page preview also includes the existing navigation and homepage.</p></div></div>;
}
