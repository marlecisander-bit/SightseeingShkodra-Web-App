import {notFound} from 'next/navigation';
import {resolveBookableProduct} from '@/modules/booking/products-server';
import {isPublicTourPublished} from '@/modules/content/sitemap-server';
import {PageIntro} from '@/components/public/page-intro';
import {getWebsitePublication,getPublishedWebsite} from '@/modules/content/website-server';
import {editorialMetadata} from '@/modules/content/seo';
import {BookingFlow,BookingProvider} from '@/components/public/booking';
export async function generateMetadata(){const [{content,published},product]=await Promise.all([getWebsitePublication(),isPublicTourPublished().catch(()=>false)]);return editorialMetadata('/book','bookPage',content,published&&product);}
export default async function Book({searchParams}:{searchParams:Promise<{productId?:string|string[]}>}){
 const c=await getPublishedWebsite(),{productId}=await searchParams;
 if(productId!==undefined&&typeof productId!=='string')notFound();
 const product=productId?await resolveBookableProduct(productId):null;
 if(productId!==undefined&&!product)notFound();
 return <main id="main-content" className="p-subpage p-container p-book-page"><PageIntro content={c} prefix="bookPage"/>{product?<BookingProvider product={product} content={c}><h2>{product.title}</h2>{product.card?.description&&<p>{product.card.description}</p>}<BookingFlow/></BookingProvider>:<BookingFlow/>}</main>;
}
