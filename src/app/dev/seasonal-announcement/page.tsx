import {notFound} from 'next/navigation';
import {SeasonalAnnouncement} from '@/components/public/seasonal-announcement';
import {Header,BookingProvider} from '@/components/public/booking';
import {HomepageView} from '@/components/public/homepage-view';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {emptyHomepage} from '@/modules/content/homepage';
import type {BookableProduct} from '@/modules/booking/products';
import '../../(public)/public.css';
const products:BookableProduct[]=[{id:'10000000-0000-4000-8000-000000000020',title:'Panoramic Sightseeing Tour',slug:'panoramic',mode:'selected_departure',minutes:120,adultPrice:1500,primary:true,card:{enabled:true,image:'/images/castle.webp',alt:'Synthetic layout photo',description:'Discover Shkodra on a scenic 2-hour tour.',order:0,features:['multilingual_audio_guide','two_hours_ticket','air_conditioning','live_tracking','audio_guide','wifi','van_tour']}},{id:'10000000-0000-4000-8000-000000000021',title:'Hop On Hop Off - Daily Ticket',slug:'daily',mode:'whole_day',minutes:120,adultPrice:1500,active:false,availability:{state:'seasonal_break',reopening:{precision:'month',value:'2027-04'}},unavailableMessage:'Bookings are paused for the season.',card:{enabled:true,image:'/images/lake.webp',alt:'Synthetic lake photo',description:'Your ticket is valid until the end of the day.',order:1,features:['multilingual_audio_guide','full_day_ticket','air_conditioning','live_tracking','hop_on_hop_off','audio_guide','wifi','walking']}}];
export default async function Page({searchParams}:{searchParams:Promise<{off?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();const {off}=await searchParams;
 const c={...initialWebsiteContent,'seasonal.enabled':'true'};
 return <div className="public-site"><BookingProvider content={c} products={products} preview><SeasonalAnnouncement content={c} initialActive={!off} preview><Header content={c} previewPathname="/"/></SeasonalAnnouncement><HomepageView preview content={c} products={products} home={emptyHomepage('ready')}/></BookingProvider></div>;
}
