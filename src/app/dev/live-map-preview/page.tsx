import {notFound} from 'next/navigation';
import {LiveMapEmbed} from '@/components/public/live-map-embed';
import {BookingProvider,Header} from '@/components/public/booking';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import styles from '@/components/public/route-journey.module.css';
import '../../(public)/public.css';
export default async function MapPreview({searchParams}:{searchParams:Promise<{presentation?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();
 const {presentation}=await searchParams;
 return <div className="public-site"><BookingProvider><Header content={initialWebsiteContent} previewPathname="/route"/><main id="main-content" className={`p-container ${styles.page}`}><header className={styles.intro}><p className="p-eyebrow">Local controlled fixture · simulated status</p><h1>Live tour map</h1><p>Explore Shkodra with us</p></header><LiveMapEmbed priority presentation={presentation==='compact'?'compact':'full'} collapseRecovery localPreview/></main></BookingProvider></div>;
}
