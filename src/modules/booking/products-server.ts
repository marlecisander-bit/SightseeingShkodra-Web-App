import 'server-only';
import {cache} from 'react';
import {createClient} from '@supabase/supabase-js';
import {type BookableProduct,validProductId} from './products';
/** Fixed tenant binding. Browser product selection is checked against this directory. */
export const getBookableProducts = cache(async ():Promise<BookableProduct[]> => {
 const operator=process.env.PUBLIC_OPERATOR_ID,url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!operator||!url||!key)return [];
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(5000)})}});
 const {data,error}=await client.rpc('read_public_products_v1',{p_operator:operator});
 if(error||!Array.isArray(data)||data.length>100)throw Error('Product directory unavailable');
 if(!data.every(p=>validProductId(p.id)&&typeof p.title==='string'&&p.title.length<=200&&typeof p.slug==='string'&&['selected_departure','whole_day'].includes(p.mode)&&Number.isInteger(p.minutes)&&p.minutes>0&&p.minutes<=1440))throw Error('Invalid product directory');
 return data.map(p=>({...p,primary:p.slug===process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG}));
});
export async function resolveBookableProduct(id?:string):Promise<BookableProduct|null> {
 if(id!==undefined&&!validProductId(id))return null;
 const products=await getBookableProducts();
 return products.find(p=>id ? p.id===id : p.slug===process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG)??null;
}
