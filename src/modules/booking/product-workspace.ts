import type {BookableProduct} from './products';
export type ProductDraft={title:string;inclusions:string;supplier_id:string;card:NonNullable<BookableProduct['card']>};
export type WorkspaceProduct={id:string;title:string;slug:string;type:string;status:string;inclusions:string|null;supplier_id:string|null;updated_at:string;inventory_product_id:string|null;seat_reservation_mode:string;reservation_minutes:number;card_draft:BookableProduct['card'];card_published:BookableProduct['card'];editor_draft:Partial<ProductDraft>};
export function productDraft(product:WorkspaceProduct):ProductDraft{
 return {title:product.title,inclusions:product.inclusions??'',supplier_id:product.supplier_id??'',...product.editor_draft,card:{image:'',alt:'',description:'',order:0,enabled:false,...product.card_published,...product.card_draft,...product.editor_draft?.card}};
}
export function productWebsiteState(product:WorkspaceProduct,blockers:string[]){
 if(product.status==='archived')return 'Archived';
 if(product.status!=='published')return product.card_published?'Sales paused':blockers.length?'Needs setup':'Draft';
 if(!product.card_published?.enabled)return 'Not on homepage';
 return blockers.length?'Needs attention':'Published on homepage';
}
