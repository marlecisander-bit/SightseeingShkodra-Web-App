import { readFile } from 'node:fs/promises';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { HomepageView } from '@/components/public/homepage-view';
import { TourView,ExploreView,LiveView } from '@/components/public/editorial-pages';
import { PageIntro } from '@/components/public/page-intro';
import { Header,BookingProvider } from '@/components/public/booking';
import { Footer } from '@/components/public/ui';
import { RoutePreview } from '@/components/public/route-preview';
import { websitePlaces } from '@/modules/content/website-schema';
import { websiteMetadata } from '@/modules/content/seo';
import '../../(public)/public.css';
async function fixture(){await connection();if(process.env.NODE_ENV!=='development')notFound();return JSON.parse(await readFile('private/cms-field-fixture.json','utf8'));}
export async function generateMetadata(){return websiteMetadata((await fixture()).content,false);}
export default async function Audit(){const {content:c,home,reviews}=await fixture();return <div className="public-site"><p>Isolated CMS field-consumption test. Not published content.</p><BookingProvider><Header content={c}/><HomepageView home={home} content={c} reviews={reviews}/><TourView tour={home} c={c} reviews={reviews}/><ExploreView home={home} c={c}/><LiveView c={c}/><PageIntro content={c} prefix="bookPage"/><PageIntro content={c} prefix="dayPage"/>{websitePlaces(c).map(p=><RoutePreview key={p.id} places={[p]}/>)}<Footer content={c}/></BookingProvider></div>;}
