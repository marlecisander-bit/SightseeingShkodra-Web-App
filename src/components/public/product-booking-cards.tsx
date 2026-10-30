import {BookingProvider} from './booking';
import {HeroBookingWidget} from './hero-booking-widget';
import {Media} from './ui';
import type {BookableProduct} from '@/modules/booking/products';
import type {WebsiteContent} from '@/modules/content/website-schema';
import styles from './product-booking-cards.module.css';
/** Reuse the existing selectors, quote hook and checkout; each offer has isolated UI state. */
export function ProductBookingCards({products,content,preview=false}:{products:BookableProduct[];content:WebsiteContent;preview?:boolean}) {
 const visible=products.filter(p=>p.card?.enabled);
 if(!visible.length)return null;
 return <section className={`p-section p-container ${styles.section}`} aria-label="More van experiences"><h2>Choose your experience</h2><div className={styles.grid}>{visible.map(product=><article className={styles.card} key={product.id}>
 <Media src={product.card!.image} alt={product.card!.alt}/>
 <p>{product.card!.description}</p>
 <BookingProvider product={product} content={content} preview={preview}><HeroBookingWidget productTitle={product.title} bookingLabel="Book this experience" embedded/></BookingProvider>
 </article>)}</div></section>;
}
