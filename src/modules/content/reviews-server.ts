import { withOperatorService } from "../identity/operator-service";
import 'server-only';
import {cache} from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { connection } from 'next/server';
import { defaultReviewSettings, type ReviewSelection, type ReviewSettings } from './reviews';
const fields='id,author,rating,body,source,review_date,original_url,avatar_url,language,featured,display_order,published,updated_at';
export { fields as reviewFields };

export async function readReviewSettings(client:SupabaseClient,operator:string):Promise<ReviewSettings|null> {
 const config=await client.from('review_settings').select('display_limit,google_reviews_url,leave_review_url').eq('operator_id',operator).maybeSingle();
 return config.error?null:config.data??defaultReviewSettings;
}
async function readReviewRows(client:SupabaseClient,operator:string,settings:ReviewSettings):Promise<ReviewSelection> {
 const result=await client.from('reviews').select(fields).eq('operator_id',operator).eq('published',true).is('deleted_at',null).order('featured',{ascending:false}).order('display_order').order('created_at',{ascending:false}).order('id').limit(settings.display_limit);
 return {reviews:result.error?[]:result.data??[],settings};
}
// One request-scoped settings read shared by the footer and review sections.
const publicReviewContext=cache(async()=>{
 await connection();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,operator=process.env.PUBLIC_OPERATOR_ID;
 if(!url||!key||!operator)return null;
 try {
  const client=createClient(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(4000)})}});
  const settings=await readReviewSettings(client,operator);
  return settings?{client,operator,settings}:null;
 }catch{return null;}
});
export async function getPublicReviewSettings():Promise<ReviewSettings> {
 return (await publicReviewContext())?.settings??defaultReviewSettings;
}
export const getPublicReviews=cache(async ():Promise<ReviewSelection> => {
 const context=await publicReviewContext();
 if(!context)return {reviews:[],settings:defaultReviewSettings};
 try{return await readReviewRows(context.client,context.operator,context.settings);}
 catch{return {reviews:[],settings:context.settings};}
});
export async function readPublishedReviews(client:SupabaseClient,operator:string):Promise<ReviewSelection> {
 const settings=await readReviewSettings(client,operator);
 return settings?readReviewRows(client,operator,settings):{reviews:[],settings:defaultReviewSettings};
}
export async function getEditorReviews(operatorId:string) { return withOperatorService(operatorId,"content.manage",(client,context)=>readPublishedReviews(client,context.operatorId)); }
export async function getEditorReviewSettings(operatorId:string) { return withOperatorService(operatorId,"content.manage",async(client,context)=>(await readReviewSettings(client,context.operatorId))??defaultReviewSettings); }
