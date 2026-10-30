'use client';
import {useState,useEffect,useRef} from 'react';
import {ProductAmenitiesInput} from './product-amenities-input';
import {EditorActions} from './editor-action-bar';
import {ImageField} from './image-field';
import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {saveProductWorkspace} from './products-actions';
import type {ProductDraft} from '@/modules/booking/product-workspace';
export function ProductDetailsForm({operatorId,id,stamp,draft,suppliers,website=false,canPublish=false,saveAction}:{saveAction?:(form:FormData)=>Promise<{error:string}|void>;canPublish?:boolean;operatorId:string;id:string;stamp:string;draft:ProductDraft;suppliers:{id:string;name:string}[];website?:boolean}){
 const dirtyRef=useRef(false);
 const [image,setImage]=useState(draft.card.image),[dirty,setDirty]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{
  const guard=(event:Event)=>{if(dirtyRef.current){event.preventDefault();setNotice('Save or discard your changes before switching products or tabs.');}};
  const unload=(event:BeforeUnloadEvent)=>{if(dirtyRef.current){event.preventDefault();event.returnValue='';}};
  window.addEventListener('admin:before-navigation',guard);window.addEventListener('beforeunload',unload);
  return()=>{window.removeEventListener('admin:before-navigation',guard);window.removeEventListener('beforeunload',unload);};
 },[dirty]);
 return <div onChange={()=>{dirtyRef.current=true;setDirty(true);}}>{notice&&<p role="alert">{notice} <button type="button" onClick={()=>{dirtyRef.current=false;setDirty(false);window.location.reload();}}>Discard unsaved changes</button></p>}<MutationForm action={saveAction??saveProductWorkspace.bind(null,operatorId,id)}>
 <input type="hidden" name="tab" value={website?'website':'details'}/><input type="hidden" name="updated_at" value={stamp}/>
 {website?<><h2>Homepage placement</h2><label><input type="checkbox" name="enabled" defaultChecked={draft.card.enabled}/>Show booking card on homepage</label><label>Display order<input name="order" type="number" min="0" max="99999" defaultValue={draft.card.order} required/></label><p>Cards appear directly below the hero, in this order. Save your draft, preview it, then publish the product.</p><input type="hidden" name="image" value={draft.card.image}/><input type="hidden" name="alt" value={draft.card.alt}/><input type="hidden" name="description" value={draft.card.description}/>{draft.card.features?.map(f=><input key={f} type="hidden" name="features" value={f}/>)}<input type="hidden" name="feature_icons" value={JSON.stringify(draft.card.feature_icons??{})}/></>:<><h2>Product details</h2><label>Product name<input name="title" maxLength={200} required defaultValue={draft.title}/></label><label>Booking page introduction<textarea name="description" maxLength={700} defaultValue={draft.card.description}/></label><ImageField operatorId={operatorId} name="image" label="Product photo" value={image} onChange={value=>{setImage(value);dirtyRef.current=true;setDirty(true);}} optional/><label>Photo description<input name="alt" maxLength={200} defaultValue={draft.card.alt}/></label><ProductAmenitiesInput features={draft.card.features} icons={draft.card.feature_icons}/><label>Ticket inclusions<textarea name="inclusions" maxLength={700} defaultValue={draft.inclusions}/></label><label>Supplier<select name="supplier_id" defaultValue={draft.supplier_id}><option value="">No supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><input type="hidden" name="order" value={draft.card.order}/>{draft.card.enabled&&<input type="hidden" name="enabled" value="on"/>}</>}
 <EditorActions dirty={dirty} scope="Save draft keeps these details private. Publish updates this product, including its saved homepage placement. Prices and schedules take effect when saved in their own tabs."><SubmitButton name="operation" value="draft">Save draft</SubmitButton>{!dirty?<a href={`/admin/${operatorId}/products/preview?product=${id}`} target="_blank" rel="noopener noreferrer">Preview saved draft</a>:<span>Save draft to preview your changes</span>}{canPublish&&<SubmitButton name="operation" value="publish">Publish product</SubmitButton>}</EditorActions>
 </MutationForm></div>;
}
