import {notFound} from 'next/navigation';
import {JourneyPanelFixture} from './fixture';
import '../../(public)/public.css';
export default async function Page({searchParams}:{searchParams:Promise<{map?:string}>}){if(process.env.NODE_ENV!=='development')notFound();const {map}=await searchParams;return <JourneyPanelFixture liveMap={map==='live'}/>;}
