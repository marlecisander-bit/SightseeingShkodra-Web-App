import {ProductCarousel} from './product-carousel';
import type {HeroFare} from '@/modules/content/hero-fare';
import {ProductCardBooking} from './product-card-booking';
import {Media} from './ui';
import {AvailabilityBadge} from './product-availability-status';
import type {BookableProduct} from '@/modules/booking/products';
import type {WebsiteContent} from '@/modules/content/website-schema';
import styles from './product-booking-cards.module.css';
/** Reuse the existing selectors, quote hook and checkout; each offer has isolated UI state. */
export function ProductBookingCards({products,content,preview=false,fares={},embedded=false}:{embedded?:boolean;overlap?:boolean;fares?:Record<string,HeroFare>;products:BookableProduct[];content:WebsiteContent;preview?:boolean}) {
 const visible=products.filter(p=>p.card?.enabled).toSorted((a,b)=>(a.displayOrder??a.card?.order??0)-(b.displayOrder??b.card?.order??0));
 if(!visible.length)return null;
 return <section id="experiences" className={`${embedded?styles.embedded:"p-section p-container"} ${styles.section}`} aria-label="Book your experience"><h2 className="p-screen-reader-only">Book your experience</h2><ProductCarousel titles={visible.map(product=>product.title)}>{visible.map((product,index)=><article className={styles.card} data-inactive={product.active===false||undefined} key={product.id}>
 {product.active===false&&<AvailabilityBadge product={product}/>}
 {product.card!.image?<Media src={product.card!.image} alt={product.card!.alt} priority={embedded&&index===0}/>:<div className={styles.placeholder}>Product photo</div>}
 <ProductCardBooking compactMobile={embedded} product={product} fare={fares[product.id]} bookingLabel={content["hero.book"]} preview={preview}/>
 </article>)}</ProductCarousel></section>;
}
