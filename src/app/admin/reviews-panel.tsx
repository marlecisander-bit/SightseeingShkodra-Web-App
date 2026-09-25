import { CatalogCreate } from './catalog-create';
import styles from './catalog.module.css';
import badges from './website-editor.module.css';
import { withOperatorService } from '@/modules/identity/operator-service';
import { defaultReviewSettings } from '@/modules/content/reviews';
import { reviewFields } from '@/modules/content/reviews-server';
import { ReviewEditor, ReviewSettingsEditor } from './reviews-editor';
export async function ReviewsPanel({operatorId}:{operatorId:string}) {
 const data=await withOperatorService(operatorId,'content.manage',async(client,context)=>{
 const [reviews,settings]=await Promise.all([client.from('reviews').select(reviewFields).eq('operator_id',context.operatorId).is('deleted_at',null).order('featured',{ascending:false}).order('display_order').order('created_at',{ascending:false}).limit(100),client.from('review_settings').select('display_limit,google_reviews_url,leave_review_url').eq('operator_id',context.operatorId).maybeSingle()]);
 if(reviews.error||settings.error)return null;return {reviews:reviews.data,settings:settings.data??defaultReviewSettings};});
 if(!data)return <p role="alert">Review management is unavailable. Check that the manual reviews migration has been applied.</p>;
 return <><p>Add genuine reviews with their original wording and source. Featured reviews appear first, then display order. No overall Google rating is calculated.</p><div className={styles.group}><CatalogCreate label="Homepage review settings" settings><ReviewSettingsEditor operatorId={operatorId} settings={data.settings}/></CatalogCreate><CatalogCreate label="Add review"><ReviewEditor operatorId={operatorId}/></CatalogCreate><p className={styles.listLabel}>Existing reviews</p>{data.reviews.map(r=><details key={r.id} className={styles.record}><summary>{r.author}<span className={styles.metadata}><span>{r.source}</span><span aria-label={r.rating+' out of 5 stars'}>{'\u2605'.repeat(r.rating)}{'\u2606'.repeat(5-r.rating)}</span><span className={r.published?badges.badge:badges.draftBadge}>{r.published?'Published':'Draft'}</span>{r.featured&&<span>Featured</span>}</span><small className={styles.order}>Order: {r.display_order}</small></summary><div className={styles.recordBody}><ReviewEditor key={r.updated_at} operatorId={operatorId} review={r}/></div></details>)}</div>{!data.reviews.length&&<p>No reviews entered yet. The homepage section stays hidden until you publish one.</p>}<p>Showing up to 100 reviews. Delete removes a review from display and retains its history.</p></>;
}
