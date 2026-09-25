"use client";
import { useState } from "react";
import { amenityIcons, type HeroAmenity, type AmenityIconName } from '@/modules/content/hero-amenities';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { Button } from '@/components/ui/button';
import styles from './hero-amenities.module.css';
export function AmenitiesInput({value,onChange}:{value:string;onChange:(v:string)=>void}){
 const rows=JSON.parse(value) as HeroAmenity[];
 const [openRows,setOpenRows]=useState<Record<string,boolean>>({});
 function update(id:string,patch:Partial<HeroAmenity>){onChange(JSON.stringify(rows.map(a=>a.id===id?{...a,...patch,updated_at:new Date().toISOString()}:a)));}
 function move(index:number,delta:number){const next=[...rows].sort((a,b)=>a.display_order-b.display_order);[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(JSON.stringify(next.map((a,i)=>({...a,display_order:i+1,updated_at:new Date().toISOString()}))));}
 return <div className={styles.editor}><p>Manage the service highlights displayed inside the homepage hero. These are marketing descriptions; manage actual schedules, capacity and stops in their operational editors. Save Draft to preview; Publish makes changes visible.</p>
 <input type="hidden" name="hero.amenities" value={value}/>
 {rows.length===0&&<p>No amenities. The public hero hides this area.</p>}
 {rows.toSorted((a,b)=>a.display_order-b.display_order).map((a,i)=><details className={styles.row} key={a.id} open={openRows[a.id]??!a.title} onToggle={e=>{const open=e.currentTarget.open;setOpenRows(v=>v[a.id]===open?v:{...v,[a.id]:open});}}><summary><AmenityIcon name={a.icon}/><strong>{a.title||'New amenity'}</strong><span>{a.published?'Published on next publication':'Hidden'}</span><span>Order {a.display_order}</span></summary>
 <div className={styles.fields}><label>Title<input aria-label={`Amenity ${i+1} title`} value={a.title} maxLength={100} required onChange={e=>update(a.id,{title:e.target.value})}/></label><label>Description<input value={a.description} maxLength={180} onChange={e=>update(a.id,{description:e.target.value})}/></label><label>Display order<input type="number" min={0} max={999} step={1} value={a.display_order} onChange={e=>update(a.id,{display_order:Number(e.target.value)})}/></label><label className={styles.toggle}><input type="checkbox" checked={a.published} onChange={e=>update(a.id,{published:e.target.checked})}/>Published</label></div>
 <fieldset className={styles.icons}><legend>Choose icon</legend>{amenityIcons.map(icon=><label key={icon}><input type="radio" name={`icon-${a.id}`} value={icon} checked={a.icon===icon} onChange={()=>update(a.id,{icon:icon as AmenityIconName})}/><AmenityIcon name={icon}/><span>{icon}</span></label>)}</fieldset>
 <div className={styles.actions}><Button type="button" disabled={i===0} onClick={()=>move(i,-1)}>Move up</Button><Button type="button" disabled={i===rows.length-1} onClick={()=>move(i,1)}>Move down</Button><Button type="button" onClick={()=>onChange(JSON.stringify(rows.filter(r=>r.id!==a.id)))}>Remove amenity</Button></div></details>)}
 <Button type="button" disabled={rows.length>=50} onClick={()=>{const now=new Date().toISOString();onChange(JSON.stringify([...rows,{id:crypto.randomUUID(),icon:'info',title:'',description:'',published:false,display_order:Math.min(999,Math.max(0,...rows.map(a=>a.display_order))+1),created_at:now,updated_at:now}]))}}>Add amenity</Button><p>Removal takes effect when published. Discard restores the saved list.</p></div>;
}
