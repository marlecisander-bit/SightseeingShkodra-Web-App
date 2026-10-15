import {notFound} from 'next/navigation';
import {PartnersSection} from '@/components/public/partners-section';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import type {Partner} from '@/modules/content/partners';
import '../../(public)/public.css';
export default async function PartnersPreview({searchParams}:{searchParams:Promise<{count?:string;hidden?:string;cta?:string}>}) {
 if(process.env.NODE_ENV!=='development')notFound();
 const query=await searchParams;
 const count=Math.max(0,Math.min(20,Number(query.count??7)||0));
 const partners:Partner[]=Array.from({length:count},(_,i)=>({id:String(i),name:i===2?'Long destination organization name for wrapping verification':`Layout sample ${i+1}`,description:i===1?'Synthetic layout demonstration only.':'',logo_url:i%2?'/images/castle.webp':'/images/lake.webp',website_url:'https://example.com',is_active:true,display_order:i,updated_at:''}));
 // Development-only fixture: no records are stored or treated as approved partners.
 // Use an existing allowlisted local raster to exercise the same optimized image path.
 return <div className="public-site"><p className="p-container">Development layout samples only. These are not partner records or approved logos.</p><main id="main-content"><h1 className="p-screen-reader-only">Partner layout preview</h1><PartnersSection partners={partners} content={{...initialWebsiteContent,'partners.showOnHomepage':query.hidden==='true'?'false':'true','partners.ctaEnabled':query.cta==='true'?'true':'false','partners.ctaUrl':'/explore'}}/></main><footer className="p-container">Footer position reference</footer></div>;
}
