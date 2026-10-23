import {notFound} from 'next/navigation';
import {ExploreView} from '@/components/public/editorial-pages';
import {ExploreBaseline} from './baseline-view';
import {BookingProvider,Header} from '@/components/public/booking';
import {initialWebsiteContent,websitePlaces} from '@/modules/content/website-schema';
import '../../(public)/public.css';
export default async function Page({searchParams}:{searchParams:Promise<{before?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();
 const {before}=await searchParams;const View=before==='true'?ExploreBaseline:ExploreView;
 return <div className="public-site"><BookingProvider><Header content={initialWebsiteContent} previewPathname="/explore"/><View c={initialWebsiteContent} places={websitePlaces(initialWebsiteContent)}/><p>Local synthetic performance fixture. No database or live tracking connection.</p></BookingProvider></div>;
}
