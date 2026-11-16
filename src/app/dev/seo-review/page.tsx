import {notFound} from 'next/navigation';
import {TourSummary} from '@/components/public/tour-summary';
import {SeasonalAnnouncement} from '@/components/public/seasonal-announcement';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import type {BookableProduct} from '@/modules/booking/products';
import '../../(public)/public.css';
export default function Page(){
 if(process.env.NODE_ENV!=='development')notFound();
 const content={...initialWebsiteContent,'seasonal.enabled':'true'};
 const products:BookableProduct[]=[{id:'7d7257f2-ee83-43cf-85bf-5dba3bbf5196',title:'Sightseeing Panorama Tour',slug:'panorama',mode:'selected_departure',minutes:120,card:{enabled:true,description:'Explore Shkodra on an approximately two-hour panorama tour.',image:'/images/lake.webp',alt:'Lake Shkodra',order:0}},{id:'10000000-0000-4000-8000-000000000021',title:'Hop On Hop Off - Daily Ticket',slug:'daily',mode:'selected_departure',minutes:120,active:false,unavailableMessage:'Bookings are paused for the season.',card:{enabled:true,description:'Explore independently and rejoin later departures.',image:'/images/lake.webp',alt:'Lake Shkodra',order:1}}];
 return <div className="public-site"><SeasonalAnnouncement content={content} initialActive preview><header className="p-container"><p>Sightseeing Shkodra · Local SEO review</p></header></SeasonalAnnouncement><main className="p-container p-subpage"><h1>Tour information</h1><p>Local layout fixture. Sample boarding and inclusion text; no live availability or booking requests.</p><TourSummary products={products} content={content} meeting={{name:'Boarding point — layout sample',directions:'Use the meeting point in your confirmation.',url:'https://maps.app.goo.gl/rssrPnaBYZVWp316A',label:'View meeting point',stopId:null}} inclusions={{[products[0].id]:'Sample inclusion text for layout review.\nAdmission is included only when expressly listed.'}}/></main></div>;
}
