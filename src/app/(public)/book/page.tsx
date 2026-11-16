import {getBookableProducts} from '@/modules/booking/products-server';
import {getCurrentMeetingPoint} from '@/modules/booking/meeting-point-server';
import {getTourInclusions} from '@/modules/content/tour-details-server';
import {TourSummary} from '@/components/public/tour-summary';
import {notFound} from 'next/navigation';
import {resolveBookableProduct} from '@/modules/booking/products-server';
import {isPublicTourPublished} from '@/modules/content/sitemap-server';
import {PageIntro} from '@/components/public/page-intro';
import {getWebsitePublication,getPublishedWebsite} from '@/modules/content/website-server';
import {editorialMetadata} from '@/modules/content/seo';
import {BookingEntry,BookingFlow,BookingProvider} from '@/components/public/booking';
export async function generateMetadata(){const [{content,published},product]=await Promise.all([getWebsitePublication(),isPublicTourPublished().catch(()=>false)]);return editorialMetadata('/book','bookPage',content,published&&product);}
export default async function Book({searchParams}:{searchParams:Promise<{productId?:string|string[]}>}){
 const [c,products,meeting,inclusions]=await Promise.all([getPublishedWebsite(),getBookableProducts().catch(()=>[]),getCurrentMeetingPoint(),getTourInclusions()]);
 const {productId}=await searchParams;
 if(productId!==undefined&&typeof productId!=='string')notFound();
 const product=productId?await resolveBookableProduct(productId,true):null;
 if(productId!==undefined&&!product)notFound();
 return <main id="main-content" className="p-subpage p-container p-book-page"><PageIntro content={c} prefix="bookPage"/>{product?<BookingProvider product={product} content={c}><h2>{product.title}</h2><BookingFlow productHeading={false}/></BookingProvider>:<BookingEntry/>}<TourSummary products={products} content={c} meeting={meeting} inclusions={inclusions}/></main>;
}
