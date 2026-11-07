import {availabilityPresentation} from '@/modules/booking/product-availability';
import type {BookableProduct} from '@/modules/booking/products';
import styles from './product-booking-cards.module.css';
type StatusProduct=Pick<BookableProduct,'active'|'availability'|'unavailableMessage'>;
export function AvailabilityBadge({product}:{product:StatusProduct}){
 const status=availabilityPresentation(product);
 return <span className={styles.statusBadge}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{status.label}</span>;
}
export function AvailabilityDetails({product}:{product:StatusProduct}){
 const status=availabilityPresentation(product);
 return <><div className={styles.statusPanel}>{status.reopening&&<p className={styles.reopeningHeadline}>{status.reopening}</p>}<p>{status.message}</p></div>{status.actionUrl&&<a className={`${styles.book} ${styles.secondaryAction}`} href={status.actionUrl}>{status.actionLabel}</a>}</>;
}
