import type {BookableProduct} from '@/modules/booking/products';
import type {MeetingPoint} from '@/modules/booking/meeting-point';
import {seasonalActive} from '@/modules/content/seasonal-announcement';
import {safeJsonLd,seoConfig} from '@/modules/content/seo';
import styles from './tour-summary.module.css';
export function TourSummary({products,content,meeting,inclusions}:{products:BookableProduct[];content:Record<string,string>;meeting:MeetingPoint|null;inclusions:Record<string,string>}) {
 const visible=products.filter(p=>p.card?.enabled);
 if(!visible.length)return null;
 const winter=seasonalActive(content),origin=seoConfig().origin;
 const daily=visible.find(product=>/daily ticket/i.test(product.title));
 return <section className={styles.summary} aria-labelledby="tour-information"><h2 id="tour-information">Your sightseeing experience</h2>
 <div className={styles.grid}>{visible.map(product=>{
 const panorama=product.id==='7d7257f2-ee83-43cf-85bf-5dba3bbf5196';
 const stops=panorama&&winter?content['seasonal.stops'].split('\n').filter(Boolean):[];
 const description=product.card?.description??'';
 const url=origin?origin+'/book#tour-'+product.id:null;
 return <article key={product.id} id={'tour-'+product.id}>{product.id===daily?.id&&<span id="daily-ticket"/>}<h3>{product.title}</h3><p>{description}</p>
 {panorama&&winter&&<><p>Approximately two hours, with departures at {content['seasonal.departures']}. Each photo stop lasts 15 minutes.</p><h4>Photo stops</h4><ul>{stops.map(stop=><li key={stop}>{stop}</li>)}</ul><p>This panorama-tour ticket covers your selected tour. It is separate from the hop-on hop-off Daily Ticket.</p></>}
 {product.mode==='whole_day'||/daily ticket/i.test(product.title)?<p>The hop-on hop-off Daily Ticket is valid on the selected operating day, during that day’s operating hours. It is not valid for 24 hours. Hop-on hop-off returns in April 2027.</p>:null}
 {inclusions[product.id]&&<><h4>Inclusions</h4><p className={styles.copy}>{inclusions[product.id]}</p></>}
 {meeting&&<><h4>Boarding point</h4><p>{meeting.name}{meeting.directions&&<> — {meeting.directions}</>}</p><a href={meeting.url}>{meeting.label}</a></>}
 <p>Check your selected date for operating departures, current prices and available seats. Your confirmation contains the exact meeting details.</p>
 {product.active===false?<p>{product.unavailableMessage||'Temporarily unavailable'}</p>:<a href={'/book?productId='+product.id}>Book {product.title}</a>}
 {url&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd({'@context':'https://schema.org','@type':'TouristTrip','@id':url,url,name:product.title,description,provider:{'@id':origin+'/#organization'},...(stops.length?{itinerary:{'@type':'ItemList',itemListElement:stops.map((name,index)=>({'@type':'ListItem',position:index+1,name}))}}:{})})}}/>}
 </article>;
 })}</div></section>;
}
