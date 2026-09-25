import { withOperatorService } from "../identity/operator-service";
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { connection } from 'next/server';
import { defaultReviewSettings, type ReviewSelection } from './reviews';
const fields='id,author,rating,body,source,review_date,original_url,avatar_url,language,featured,display_order,published,updated_at';
export { fields as reviewFields };
export async function getPublicReviews():Promise<ReviewSelection> {
 await connection();
 const empty={reviews:[],settings:defaultReviewSettings};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,operator=process.env.PUBLIC_OPERATOR_ID;
 if(!url||!key||!operator)return empty;
 try {
 const client=createClient(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(4000)})}});
 return await readPublishedReviews(client,operator);
 }catch{return empty;}
}
export async function readPublishedReviews(client:SupabaseClient,operator:string):Promise<ReviewSelection> {
 const empty={reviews:[],settings:defaultReviewSettings};
 const config=await client.from('review_settings').select('display_limit,google_reviews_url,leave_review_url').eq('operator_id',operator).maybeSingle();
 if(config.error)return empty;
 const settings=config.data??defaultReviewSettings;
 const result=await client.from('reviews').select(fields).eq('operator_id',operator).eq('published',true).is('deleted_at',null).order('featured',{ascending:false}).order('display_order').order('created_at',{ascending:false}).order('id').limit(settings.display_limit);
 if(result.error)return empty;
 return {reviews:result.data,settings};
}

export async function getEditorReviews(operatorId:string) { return withOperatorService(operatorId,"content.manage",(client,context)=>readPublishedReviews(client,context.operatorId)); }
