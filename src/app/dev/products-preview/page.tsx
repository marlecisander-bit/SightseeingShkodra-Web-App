import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ProductsPreviewShell} from './shell';
import {SavedPreviewBoundary} from '../../admin/saved-preview-boundary';
import {ProductDetailsForm} from '../../admin/product-details-form';
import {ProductBookingSettings} from '../../admin/product-booking-settings';
import {HomepageView} from '@/components/public/homepage-view';
import {BookingProvider,Header} from '@/components/public/booking';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {emptyHomepage} from '@/modules/content/homepage';
import type {BookableProduct} from '@/modules/booking/products';
import styles from '../../admin/products.module.css';
import '../../(public)/public.css';
const op='10000000-0000-4000-8000-000000000001';
const products:BookableProduct[]=[{id:'10000000-0000-4000-8000-000000000020',title:'Hop On Hop Off — Daily Ticket',slug:'daily',mode:'selected_departure',minutes:120,adultPrice:1500,primary:true,card:{enabled:true,image:'/images/castle.webp',alt:'Synthetic layout photo',description:'Synthetic layout sample. Explore at your pace.',order:0,features:['audio_guide','live_tracking']}},{id:'10000000-0000-4000-8000-000000000021',title:'Sightseeing Loop Tour',slug:'loop',mode:'selected_departure',minutes:120,adultPrice:1000,card:{enabled:true,image:'/images/lake.webp',alt:'Synthetic layout photo',description:'Synthetic layout sample. One complete sightseeing loop.',order:1,features:['air_conditioning']}}];
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();const {view}=await searchParams;
 const content={...initialWebsiteContent,'hero.desktop':'/images/castle.webp','hero.mobile':'/images/castle.webp'};
 if(view==='public')return <SavedPreviewBoundary><div className="public-site"><BookingProvider preview><Header content={content} previewPathname="/"/><p className="p-container">Local synthetic layout only. Booking disabled.</p><HomepageView preview content={content} products={products} home={{...emptyHomepage('ready'),product:{id:products[0].id,slug:'daily',title:products[0].title,description:null,stops:[]}}}/></BookingProvider></div></SavedPreviewBoundary>;
 return <ProductsPreviewShell><SavedPreviewBoundary><div className={styles.workspace}><header className={styles.header}><div><h1>Products</h1><p>Local synthetic layout. Forms are disabled; nothing is saved.</p></div><Link href="?view=public">Public layout preview</Link></header><div className={styles.grid}>{products.map(p=><article className={styles.card} key={p.id}><div className={styles.placeholder}>{p.title}</div><span className={styles.status}>Published on homepage</span><h2>{p.title}</h2><p className={styles.meta}>120 minute reservation · Shared van schedule</p><a className={styles.button} href="#editor">Manage product</a></article>)}</div><aside className={styles.blockers}><h2>Complete before publishing</h2><ul><li>Add a product photo.</li><li>Choose a shared schedule.</li></ul></aside><nav className={styles.tabs} aria-label="Product editor">{['Details','Prices','Schedule & seats','Website'].map(t=><a key={t} href="#editor" aria-current={t==='Details'?'page':undefined}>{t}</a>)}</nav><section id="editor" className={styles.panel}><fieldset disabled><ProductDetailsForm operatorId={op} id={products[1].id} stamp="fixture" draft={{title:products[1].title,inclusions:'Synthetic inclusions',supplier_id:'',card:{...products[1].card!,image:''}}} suppliers={[]}/><ProductBookingSettings workspace operatorId={op} product={{id:products[1].id,title:products[1].title,updated_at:'fixture',inventory_product_id:products[0].id,seat_reservation_mode:'selected_departure',reservation_minutes:120}} sources={products}/></fieldset></section></div></SavedPreviewBoundary></ProductsPreviewShell>;
}
