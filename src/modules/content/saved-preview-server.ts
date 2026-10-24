import 'server-only';
import {withOperatorService} from '../identity/operator-service';
import {loadHomepage} from './homepage';

/** Editorial projection only. The existing STABLE snapshot RPC never prepares inventory.
 * Keep availability and next-date sources deliberately absent from this private preview.
 */
export async function getSavedPreviewHomepage(operatorId:string){
 return withOperatorService(operatorId,'content.manage',async(client,context)=>loadHomepage(
  {operatorId:context.operatorId,productSlug:process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG},
  {read:async(operator,slug)=>{const {data,error}=await client.rpc('read_public_homepage_v1',{p_operator_id:operator,p_product_slug:slug});if(error)throw Error('Preview unavailable');return data;},
   quote:async()=>{throw Error('Operational availability is excluded from saved previews');}},
 ));
}
