import {ProductBookingLink} from './product-booking-link';
import {reservationLabel} from '@/modules/booking/products';
import type {BookableProduct} from '@/modules/booking/products';
import {productFeatureBadges} from '@/modules/booking/product-features';
import type {HeroFare} from '@/modules/content/hero-fare';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import {bookingMoney} from './booking-presentation';
import styles from './product-booking-cards.module.css';
/** A concise offer. All live selection and checkout happen on the shared booking dialog. */
export function ProductCardBooking({product,fare,bookingLabel,preview=false,compactMobile=false}:{product:BookableProduct;fare?:HeroFare;bookingLabel:string;preview?:boolean;compactMobile?:boolean}){
 const price=product.adultPrice===undefined?fare?.amount:product.adultPrice;
 const validPrice=typeof price==='number'&&Number.isSafeInteger(price)&&price>=0;
 const features=productFeatureBadges(product.card);
 const category=features[0];
 const normalize=(value:string)=>value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const repeatsTitle=!!product.card?.description&&normalize(product.title).includes(normalize(product.card.description));
 return <div className={styles.body}>
 {compactMobile&&category&&<p className={styles.category}>{category.label}</p>}
 <h3>{product.title}</h3>
 {product.card?.description && <p className={styles.description} data-repeats-title={repeatsTitle||undefined}>{product.card.description}</p>}
 <p className={styles.duration}>{reservationLabel(product)}</p>
 {features.length>0&&<ul className={styles.badges} aria-label={`${product.title} information`}>
 {features.map(f=><li key={f.key} data-card-category={compactMobile&&f.key===category?.key||undefined}><AmenityIcon name={f.icon}/>{f.label}</li>)}
 </ul>}
 <div className={styles.purchaseSummary}><div className={styles.price} data-product-booking>{validPrice?<><strong>{bookingMoney(price,'EUR')}</strong><span>{product.adultPrice===undefined?'Quoted adult fare':'Standard adult price'}</span></>:<span>See prices when booking</span>}</div>
 {compactMobile&&<details className={styles.mobileDetails} data-product-details><summary aria-label={`View details for ${product.title}`}>View details</summary><div>
 <p>{product.card?.description}</p><p>{reservationLabel(product)}</p>
 {features.length>0&&<ul aria-label={`${product.title} full information`}>{features.map(f=><li key={f.key}><AmenityIcon name={f.icon}/>{f.label}</li>)}</ul>}
 </div></details>}
 </div>
 {preview?<button className={`p-button p-button-booking ${styles.book}`} type="button" disabled>{bookingLabel}</button>:<ProductBookingLink product={product} data-product-booking className={`p-button p-button-booking ${styles.book}`} >{bookingLabel}</ProductBookingLink>}
 </div>;
}
