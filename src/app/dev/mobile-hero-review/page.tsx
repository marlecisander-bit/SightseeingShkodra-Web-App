import {notFound} from 'next/navigation';
import {BookingProvider,Header} from '@/components/public/booking';
import {SeasonalAnnouncement} from '@/components/public/seasonal-announcement';
import {HomepageHero} from '@/components/public/homepage-hero';
import {ProductBookingCards} from '@/components/public/product-booking-cards';
import {WhatsAppContact} from '@/components/public/whatsapp-contact';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import type {BookableProduct} from '@/modules/booking/products';
import type {ProductFeatureKey} from '@/modules/booking/product-features';
import '../../(public)/public.css';
export default async function Page({searchParams}:{searchParams:Promise<{long?:string;amenities?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();
 const query=await searchParams;
 const media='https://ybngoppqqiohcduojfyg.supabase.co/storage/v1/object/public/website-media/9185510e-0e82-4027-ab1c-8604dad5c92e/';
 const content={...initialWebsiteContent,'seasonal.enabled':'true','hero.desktop':media+'9279c6e1-9802-4b36-83d2-69fcc05e6b87.png','hero.mobile':media+'be5c37e0-19aa-46dd-9d8e-951908a9e9aa.png'};
 const features:ProductFeatureKey[]=['multilingual_audio_guide','two_hours_ticket','air_conditioning','live_tracking','audio_guide','wifi','van_tour'];
 const count=query.amenities!==undefined?Math.min(7,Math.max(0,Number(query.amenities)||0)):7;
 const products:BookableProduct[]=[{id:'7d7257f2-ee83-43cf-85bf-5dba3bbf5196',title:query.long?'Sightseeing Panorama Tour — a longer published product title for text resizing checks':'Sightseeing Panorama Tour',slug:'panorama',active:true,mode:'selected_departure',minutes:120,adultPrice:1000,card:{enabled:true,image:media+'8067d781-dc8b-4d1f-bd73-dea7e39c871a.png',alt:'Sightseeing Shkodra tour vehicle',description:'Discover Shkodra on a scenic 2-hour tour.',order:0,features:features.slice(0,count)}},{id:'10000000-0000-4000-8000-000000000021',title:'Hop On Hop Off - Daily Ticket',slug:'daily',active:false,mode:'selected_departure',minutes:120,adultPrice:1500,availability:{state:'seasonal_break',reopening:{precision:'month',value:'2027-04'}},unavailableMessage:'Bookings are paused for the season.',card:{enabled:true,image:'/images/lake.webp',alt:'Lake Shkodra',description:'Your ticket is valid on the selected operating day.',order:1,features:['multilingual_audio_guide','full_day_ticket','air_conditioning','live_tracking','hop_on_hop_off','audio_guide','wifi','walking']}}];
 return <div className="public-site"><BookingProvider content={content} products={products} preview><SeasonalAnnouncement content={content} initialActive preview><Header content={content} previewPathname="/"/></SeasonalAnnouncement><main id="main-content" className="p-home"><HomepageHero content={content}><ProductBookingCards embedded products={products} content={content}/></HomepageHero><section className="p-container p-section"><h2>Local layout review</h2><p>Audit photographs and sample offers. No booking is submitted by this fixture.</p></section></main><WhatsAppContact href="https://wa.me/355683313310" label="Chat with us" desktop={false} mobile/></BookingProvider></div>;
}
