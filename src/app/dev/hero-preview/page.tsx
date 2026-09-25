import {notFound} from 'next/navigation';
import {HomepageHero} from '@/components/public/homepage-hero';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {amenityIcons} from '@/modules/content/hero-amenities';
import '../../(public)/public.css';
export default async function HeroPreview({searchParams}:{searchParams:Promise<{count?:string}>}){if(process.env.NODE_ENV!=='development')notFound();const count=Math.max(0,Math.min(12,Number((await searchParams).count)||0));const rows=Array.from({length:count},(_,i)=>({id:`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`,icon:amenityIcons[i%amenityIcons.length],title:['09:00 - 17:00','6 languages','5 stops','Full-day pass','Air-conditioned','Wi-Fi','Small groups','8-seat van'][i%8],description:'Layout preview only',published:true,display_order:i,created_at:'2026-09-24T00:00:00Z',updated_at:'2026-09-24T00:00:00Z'}));return <div className="public-site"><HomepageHero content={{...initialWebsiteContent,'hero.amenities':JSON.stringify(rows)}}/><section id="home-intro">Development layout preview only. No service claims are published.</section></div>;}
