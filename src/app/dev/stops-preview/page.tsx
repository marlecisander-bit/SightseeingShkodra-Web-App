import {BookingProvider,Header} from '@/components/public/booking';
import {Footer} from '@/components/public/ui';
import {HomepageView} from '@/components/public/homepage-view';
import {RouteJourney} from '@/components/public/route-journey';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {notFound} from 'next/navigation';
import {SightseeingStopsExperience} from '@/components/public/sightseeing-stops-experience';
import '../../(public)/public.css';
export default async function StopsPreview({searchParams}:{searchParams:Promise<{mode?:string;state?:string;full?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();
 const params=await searchParams;const mode=params.mode==='live'?'live':'discover';
 const names=['City centre','Lake','Castle','Bridge','Old town'];
 const stops=names.map((label,i)=>({id:`fixture-${i}`,label}));
 const places=names.map((name,i)=>({id:`guide-${i}`,stopId:stops[i].id,name,text:'Editorial destination description for local layout testing. Explore at your own pace.',image:`/images/${['centre','lake','castle','bridge-view','centre'][i]}.webp`,link:'/explore',alt:name,tag:'',detail:''}));
 const journey={type:'shkodra:journey' as const,version:1 as const,unavailable:params.state==='unavailable',stops:stops.map((s,i)=>({...s,state:(i===0?'departed':i===1?params.state==='parked'?'current':'next':'upcoming') as 'departed'|'current'|'next'|'upcoming',eta:i===1?'14 min':''}))};
 if(params.full==='true'){const content={...initialWebsiteContent,'hero.showOnHomepage':'false','notebook.showOnHomepage':'false','reviews.showOnHomepage':'false'};const planner={date:'2026-10-09',title:'Local fixture',times:null,fares:[],stops};const home={state:'empty' as const,product:null,content:{},date:null,timezone:null,price:'',schedule:'unavailable' as const,departures:[],frequency:'Unavailable'};return <div className="public-site"><BookingProvider content={content}><Header content={content}/>{mode==='live'?<RouteJourney content={content} initial={planner} places={places}/>:<HomepageView content={content} home={home} planner={planner} places={places}/>}<Footer content={content}/></BookingProvider></div>;}
 return <div className="public-site"><main className="p-container" style={{paddingBlock:40}}><p>Local layout fixture — fictional status and editorial content, not live service information.</p><h1>{mode==='live'?'Your route today':'Our 5 stops'}</h1><p>{mode==='live'?'Follow our van in real time and discover the best of Shkodra.':'Iconic places, one amazing journey. Hop on, hop off and explore at your own pace.'}</p><SightseeingStopsExperience mode={mode} stops={stops} places={places} journey={journey} stale={params.state==='stale'}/></main></div>;
}
