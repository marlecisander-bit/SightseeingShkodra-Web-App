import 'server-only';
import {cache} from 'react';
import {createClient} from '@supabase/supabase-js';
/** Published editorial inclusions, scoped to the same operator as the public directory. */
export const getTourInclusions = cache(async ():Promise<Record<string,string>> => {
 const {PUBLIC_OPERATOR_ID:operator,NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SECRET_KEY:key}=process.env;
 if(!operator||!url||!key)return {};
 try {
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(4000)})}});
  const {data,error}=await client.from('products').select('id,inclusions').eq('operator_id',operator).eq('status','published').eq('type','van_tour').limit(100);
  if(error)return {};
  return Object.fromEntries((data??[]).filter(p=>typeof p.inclusions==='string'&&p.inclusions.trim()).map(p=>[p.id,p.inclusions]));
 }catch{return {};}
});
