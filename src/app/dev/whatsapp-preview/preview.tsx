'use client';
import {useRef,useState} from 'react';
import {WhatsAppContact} from '@/components/public/whatsapp-contact';
import {BookingProvider,Header,BookButton} from '@/components/public/booking';
import {LiveMapEmbed} from '@/components/public/live-map-embed';
import {Footer} from '@/components/public/ui';
import {WebsiteWorkspace} from '@/app/admin/website-workspace';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {whatsappLink} from '@/modules/content/whatsapp';
export function WhatsAppFixture(){
 const [content,setContent]=useState<Record<string,string>>({...initialWebsiteContent,'whatsapp.enabled':'true','whatsapp.number':'+1 (202) 555-0123'}),[admin,setAdmin]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 return <div className="public-site"><BookingProvider><Header content={content}/><main id="main-content" className="p-container p-section" style={{paddingTop:120}}><h1>WhatsApp development fixture</h1><p>Synthetic number. Local presentation only; do not contact it. No settings are saved by these preview controls.</p>
 <label>Show button <input type="checkbox" checked={content['whatsapp.enabled']==='true'} onChange={e=>setContent(c=>({...c,'whatsapp.enabled':String(e.target.checked)}))}/></label>
 <label>Desktop visibility <input type="checkbox" checked={content['whatsapp.desktop']==='true'} onChange={e=>setContent(c=>({...c,'whatsapp.desktop':String(e.target.checked)}))}/></label>
 <label>Mobile visibility <input type="checkbox" checked={content['whatsapp.mobile']==='true'} onChange={e=>setContent(c=>({...c,'whatsapp.mobile':String(e.target.checked)}))}/></label>
 <label>Preview number <input value={content['whatsapp.number']} onChange={e=>setContent(c=>({...c,'whatsapp.number':e.target.value}))}/></label>
 <label>Preview message <input value={content['whatsapp.message']} onChange={e=>setContent(c=>({...c,'whatsapp.message':e.target.value}))}/></label>
 <button onClick={()=>dialog.current?.showModal()}>Open test dialog</button><dialog ref={dialog}><p>Dialog overlap check</p><button onClick={()=>dialog.current?.close()}>Close test dialog</button></dialog>
 <button onClick={()=>setAdmin(!admin)}>Inspect actual Admin editor</button>{admin&&<WebsiteWorkspace operatorId="10000000-0000-4000-8000-000000000001" record={{id:'fixture',updated_at:'2030-01-01T00:00:00Z',published_at:null,body:{content},published_body:null}} destinationManager={null}/>}
 <section style={{minHeight:900,paddingBlock:48}}><h2>Scroll and booking controls</h2><BookButton/><p>Actual booking dialog can be opened without submitting a booking.</p></section>
 <section><h2>Live Map overlap</h2><LiveMapEmbed presentation="full"/></section>
 <section style={{minHeight:800,paddingBlock:48}}><h2>Sticky booking control layout</h2><div className="p-booking-action"><button className="p-button">Synthetic booking action</button></div><p>Layout-only control, no booking mutation.</p></section>
 </main><Footer content={{...content,'final.showOnHomepage':'false'}}/><WhatsAppContact href={whatsappLink(content)} label={content['whatsapp.label']} desktop={content['whatsapp.desktop']==='true'} mobile={content['whatsapp.mobile']==='true'}/></BookingProvider></div>;
}

