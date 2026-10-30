import type {HeroFare} from '@/modules/content/hero-fare';
import {ProductCardBooking} from './product-card-booking';
import {Media} from './ui';
import type {BookableProduct} from '@/modules/booking/products';
import type {WebsiteContent} from '@/modules/content/website-schema';
import styles from './product-booking-cards.module.css';
/** Reuse the existing selectors, quote hook and checkout; each offer has isolated UI state. */
export function ProductBookingCards({products,content,preview=false,fares={},overlap=false}:{overlap?:boolean;fares?:Record<string,HeroFare>;products:BookableProduct[];content:WebsiteContent;preview?:boolean}) {
 const visible=products.filter(p=>p.card?.enabled);
 if(!visible.length)return null;
 return <section id="experiences" className={`p-section p-container ${styles.section}${overlap?` ${styles.overlap}`:""}`} aria-label="Book your experience"><h2 className="p-screen-reader-only">Book your experience</h2><div className={styles.grid}>{visible.map(product=><article className={styles.card} key={product.id}>
 {product.card!.image?<Media src={product.card!.image} alt={product.card!.alt}/>:<div className={styles.placeholder}>Product photo</div>}
 <ProductCardBooking product={product} fare={fares[product.id]} bookingLabel={content["hero.book"]} preview={preview}/>
 </article>)}</div></section>;
}
