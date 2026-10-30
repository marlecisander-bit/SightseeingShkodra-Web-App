import {AdminSectionContext} from '../../../admin-workspace-context';
import {sectionAccess,type SectionProps} from '../../../section-access';
import {withOperatorService} from '@/modules/identity/operator-service';
import {hasPermission} from '@/modules/identity/roles';
import {ProductCardEditor} from '../../../product-card-editor';
export default async function Page(props:SectionProps){
 const context=await sectionAccess('content',props);
 const products=await withOperatorService(context.operatorId,'content.manage',async client=>{const {data,error}=await client.from('products').select('id,title,updated_at,card_draft').eq('operator_id',context.operatorId).eq('type','van_tour').neq('status','archived').order('title').limit(100);return error?null:data;});
 return <><h1>Product booking cards</h1><p>One card per product, using the shared booking engine. Draft edits stay private until published.</p>{products?products.map(product=><details key={product.id}><summary>{product.title}</summary><ProductCardEditor key={product.updated_at} operatorId={context.operatorId} product={product} canPublish={hasPermission(context.role,'content.publish')}/></details>):<p role="alert">Product cards are unavailable. Check the shared-products migration before using this editor.</p>}<AdminSectionContext identity={context}/></>;
}
