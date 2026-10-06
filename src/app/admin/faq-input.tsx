'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import styles from './website-editor.module.css';
import type {FaqItem} from '@/modules/content/faq';
export function FaqInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const items=JSON.parse(value) as FaqItem[];
 const [deleting,setDeleting]=useState<string|null>(null);
 const save=(next:FaqItem[])=>onChange(JSON.stringify(next));
 const update=(id:string,patch:Partial<FaqItem>)=>save(items.map(item=>item.id===id?{...item,...patch}:item));
 const move=(index:number,delta:number)=>{const next=[...items];[next[index],next[index+delta]]=[next[index+delta],next[index]];save(next);};
 return <div className={styles.faqList}><input type="hidden" name="faq.items" value={value}/><p>Questions appear in this order. Answers are plain text. Disabled questions stay saved.</p>
  {items.map((item,index)=><fieldset className={styles.faqItem} key={item.id}><legend>Question {index+1}</legend>
   <label>Question<input required maxLength={300} value={item.question} onChange={e=>update(item.id,{question:e.target.value})}/></label>
   <label>Answer source<select value={item.answerSource} onChange={e=>update(item.id,{answerSource:e.target.value as FaqItem['answerSource']})}><option value="text">Write an answer</option><option value="product-inclusions">Published ticket inclusions</option></select></label>
   {item.answerSource==='text'?<label>Answer<textarea required rows={4} maxLength={4000} value={item.answer} onChange={e=>update(item.id,{answer:e.target.value})}/></label>:<p>Uses the product’s published inclusions. Choose “Write an answer” to replace this with FAQ text.</p>}
   <label className={styles.faqToggle}><input type="checkbox" checked={item.active} onChange={e=>update(item.id,{active:e.target.checked})}/> Show on FAQ page</label>
   <div className={styles.faqActions}><Button type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={`Move question ${index+1} up`}>Move up</Button><Button type="button" disabled={index===items.length-1} onClick={()=>move(index,1)} aria-label={`Move question ${index+1} down`}>Move down</Button><Button type="button" onClick={()=>setDeleting(item.id)}>Delete question</Button></div>
   {deleting===item.id&&<div role="alert"><p>Delete this question? Save or publish to persist its removal.</p><Button type="button" onClick={()=>{save(items.filter(i=>i.id!==item.id));setDeleting(null);}}>Confirm deletion</Button><Button type="button" onClick={()=>setDeleting(null)}>Keep question</Button></div>}
  </fieldset>)}
  {!items.length&&<p>No questions. The public FAQ will show an availability message.</p>}
  <Button type="button" disabled={items.length>=50} onClick={()=>save([...items,{id:crypto.randomUUID(),question:'',answer:'',active:true,answerSource:'text'}])}>Add question</Button>
 </div>;
}
