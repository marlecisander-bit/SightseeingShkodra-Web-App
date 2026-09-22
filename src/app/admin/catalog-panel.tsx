import { createSessionClient } from '../../modules/identity/supabase-server';
import { requirePermission } from '../../modules/identity/require-permission';
import { saveCatalog } from './catalog-actions';
import { SubmitButton } from './submit-button';

type Row = Record<string,string | number | null>;
const fields: Record<string,{ key:string; label:string; type?:string; required?:boolean; options?:string[] }[]>={
  product:[{key:'title',label:'Title',required:true},{key:'slug',label:'URL slug',required:true},
    {key:'type',label:'Experience type',options:['van_tour','boat_trip','attraction_ticket']},{key:'status',label:'Publication',options:['draft','published','archived']},
    {key:'meta_title',label:'SEO title (required to publish)'},{key:'meta_description',label:'SEO description (required to publish)'},
    {key:'og_image',label:'Social image HTTPS URL',type:'url'},{key:'og_image_alt',label:'Image description (required with an image)'}],
  supplier:[{key:'name',label:'Supplier name',required:true},{key:'type',label:'Supplier type',options:['owned','partner']}],
  stop:[{key:'name',label:'Stop name',required:true},{key:'lat',label:'Latitude',type:'number',required:true},{key:'lng',label:'Longitude',type:'number',required:true},{key:'sort_order',label:'Route position (0, 1, 2…)',type:'number',required:true}],
};
function Editor({entity,row,operatorId,products,suppliers}:{entity:string;row:Row;operatorId:string;products:Row[];suppliers:Row[]}) {
  return <form action={saveCatalog.bind(null,operatorId,entity)} className="catalog-form">
    <input type="hidden" name="id" value={row.id ?? ''}/>
    {fields[entity].map(field=><label key={field.key}>{field.label}{field.options ? <select name={field.key} defaultValue={String(row[field.key] ?? field.options[0])}>{field.options.map(value=><option key={value}>{value}</option>)}</select> :
      <input name={field.key} type={field.type ?? 'text'} step={field.type==='number'?(field.key==='sort_order'?'1':'any'):undefined} required={field.required} defaultValue={row[field.key] ?? ''} maxLength={field.type==='number'?undefined:field.key==='meta_description'?500:field.key==='og_image'?2000:200}/> }</label>)}
    {entity==='product' && <label>Supplier<select name="supplier_id" defaultValue={String(row.supplier_id ?? '')}><option value="">No supplier</option>{suppliers.map(s=><option key={s.id} value={String(s.id)}>{s.name}</option>)}</select></label>}
    {entity==='stop' && <label>Product<select name="product_id" required defaultValue={String(row.product_id ?? '')}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={String(p.id)}>{p.title}</option>)}</select></label>}
    <SubmitButton name="operation" value="save" disabled={entity==='stop' && products.length===0}>{row.id?'Save changes':'Create'}</SubmitButton>
    {entity==='stop' && products.length===0 && <p>Create a product before adding its route stops.</p>}
    {row.id && <div><label><input type="checkbox" name="confirm_remove" value="yes"/> Confirm {entity==='product'?'archive':'deletion'}</label><SubmitButton name="operation" value="remove" formNoValidate>{entity==='product'?'Archive product':`Delete ${entity}`}</SubmitButton></div>}
  </form>;
}
export async function CatalogPanel({operatorId,result}:{operatorId:string;result?:string}) {
  await requirePermission(operatorId,'catalog.manage');
  const client=await createSessionClient();
  const [p,s,t]=await Promise.all([
    client.from('products').select('id,title,slug,type,status,supplier_id,meta_title,meta_description,og_image,og_image_alt').eq('operator_id',operatorId).order('title').limit(100),
    client.from('suppliers').select('id,name,type').eq('operator_id',operatorId).order('name').limit(100),
    client.from('stops').select('id,name,product_id,lat,lng,sort_order').eq('operator_id',operatorId).order('sort_order').limit(100),
  ]);
  if(p.error||s.error||t.error) return <p role="alert">Catalog is temporarily unavailable.</p>;
  const products=p.data ?? [], suppliers=s.data ?? [];
  return <div>{result && <p role="status">{result==='saved'?'Changes saved.':'Unable to save. Check the required fields, unique slug/route position and linked records.'}</p>}
    <p>Publish only when SEO fields are ready. Pricing and capacity configuration are managed separately.</p>
    {(['product','supplier','stop'] as const).map(entity=><div key={entity}><h2>{entity==='product'?'Products':entity==='supplier'?'Suppliers':'Route stops'}</h2>
      <details><summary>Create {entity}</summary><Editor entity={entity} row={{}} operatorId={operatorId} products={products} suppliers={suppliers}/></details>
      {(entity==='product'?products:entity==='supplier'?suppliers:t.data ?? []).map(row=><details key={row.id}><summary>{'title' in row?row.title:row.name}</summary><Editor entity={entity} row={row} operatorId={operatorId} products={products} suppliers={suppliers}/></details>)}</div>)}
    <p>Showing up to 100 records per group. Referenced suppliers cannot be deleted.</p></div>;
}
