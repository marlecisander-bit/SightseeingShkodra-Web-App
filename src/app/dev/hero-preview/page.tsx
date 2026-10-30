import {readFile} from 'node:fs/promises';
import {WhatsAppContact} from '@/components/public/whatsapp-contact';
import {notFound} from 'next/navigation';
import {HomepageHero} from '@/components/public/homepage-hero';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {BookingProvider,Header} from '@/components/public/booking';
import '../../(public)/public.css';
export default async function HeroPreview({searchParams}:{searchParams:Promise<{count?:string;published?:string;title?:string;copy?:string}>}){if(process.env.NODE_ENV!=='development')notFound();const params=await searchParams;const assets=params.published==='true'?JSON.parse(await readFile('private/hero-layout-fixture.json','utf8')):null;
 return <div className="public-site"><BookingProvider><Header content={initialWebsiteContent} previewPathname="/"/><HomepageHero fare={assets?{amount:1000,currency:"EUR",date:"2030-10-30"}:undefined} stopCount={5} productTitle={params.title?.slice(0,180)||"Hop On Hop Off"} content={{...initialWebsiteContent,...(assets?{'hero.desktop':assets.desktop,'hero.mobile':assets.mobile,'hero.desktopPosition':assets.desktopPosition,'hero.mobilePosition':assets.mobilePosition}:{}),...(params.copy==='long'?{'hero.title':'Découvrez toutes les merveilles de Shkodra.','hero.emphasis':'À votre rythme.','hero.eyebrow':'SHKODËR, ALBANIE','hero.subtitle':'Montez à bord. Explorez. Profitez de votre journée.'}:{})}}/><WhatsAppContact href="https://wa.me/355683313310" label="Chat with us" desktop mobile/><section id="home-intro">Development layout preview only. No service claims are published.</section></BookingProvider></div>;}
