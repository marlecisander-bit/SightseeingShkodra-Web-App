'use client';
import {useState} from 'react';
import {ImageField} from './image-field';
import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {saveProductCard} from './product-card-actions';
import type {BookableProduct} from '@/modules/booking/products';
export function ProductCardEditor({operatorId,product,canPublish}:{operatorId:string;product:{id:string;title:string;updated_at:string;card_draft?:BookableProduct['card']};canPublish:boolean}) {
 const card=product.card_draft;const [image,setImage]=useState(card?.image??'');
 return <MutationForm action={saveProductCard.bind(null,operatorId,product.id)}>
 <input type="hidden" name="updated_at" value={product.updated_at}/>
 <p>Product name: {product.title}. Edit the name and publication in Products &amp; suppliers; prices and seats in Calendar &amp; Pricing.</p>
 <label>Short introduction<textarea name="description" maxLength={700} defaultValue={card?.description??''}/></label>
 <ImageField operatorId={operatorId} name="image" label="Product photo" value={image} onChange={setImage} optional/>
 <label>Photo description<input name="alt" maxLength={200} defaultValue={card?.alt??''}/></label>
 <label>Display order<input name="order" type="number" min="0" max="99999" required defaultValue={card?.order??0}/></label>
 <label><input type="checkbox" name="enabled" defaultChecked={card?.enabled??false}/>Show booking card on homepage</label>
 <p>Publishing shows the card only when the product is published and linked to an active schedule or bookable dated departures. The primary Daily Ticket keeps its existing hero card.</p>
 <SubmitButton name="operation" value="draft">Save draft</SubmitButton>{canPublish&&<SubmitButton name="operation" value="publish">Publish card</SubmitButton>}
 </MutationForm>;
}
