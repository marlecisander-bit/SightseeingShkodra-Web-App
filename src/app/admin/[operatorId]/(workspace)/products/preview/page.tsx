import Link from 'next/link';
import {notFound} from 'next/navigation';
import {sectionAccess,type SectionProps} from '../../../../section-access';
import {withOperatorService} from '@/modules/identity/operator-service';
import {productDraft,type WorkspaceProduct} from '@/modules/booking/product-workspace';
import {getPublishedWebsite} from '@/modules/content/website-server';
import {ProductBookingCards} from '@/components/public/product-booking-cards';
import {SavedPreviewBoundary} from '../../../../saved-preview-boundary';
import type {BookableProduct} from '@/modules/booking/products';
import '../../../../../(public)/public.css';
export const metadata={title:'Private product draft preview',robots:{index:false,follow:false}};
export default async function Page(props:SectionProps){
 const ctx=await sectionAccess('products',props),id=(await props.searchParams).product;
 const product=await withOperatorService(ctx.operatorId,'catalog.read',async client=>{const {data}=await client.from('products').select('*').eq('operator_id',ctx.operatorId).eq('id',id??'').maybeSingle();return data as WorkspaceProduct|null;});
 if(!product)notFound();const d=productDraft(product);
 const preview:BookableProduct={id:product.id,title:d.title,slug:product.slug,mode:product.seat_reservation_mode as BookableProduct['mode'],minutes:product.reservation_minutes,card:{...d.card,enabled:true}};
 return <><Link href={`/admin/${ctx.operatorId}/products?product=${product.id}`}>← Back to product</Link><p>Private saved draft preview. Availability, checkout and booking writes are disabled. Missing photos appear as placeholders.</p><SavedPreviewBoundary><div className="public-site"><ProductBookingCards products={[preview]} content={await getPublishedWebsite()} preview/></div></SavedPreviewBoundary></>;
}
