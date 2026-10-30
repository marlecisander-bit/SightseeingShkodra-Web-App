'use client';
import {useState} from 'react';
import {amenityIcons,type AmenityIconName} from '@/modules/content/hero-amenities';
import {productFeatureOptions,type ProductFeatureKey,type ProductFeatureIcons} from '@/modules/booking/product-features';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import styles from './product-amenities.module.css';
export function ProductAmenitiesInput({features=[],icons={}}:{features?:ProductFeatureKey[];icons?:ProductFeatureIcons}){
 const [selected,setSelected]=useState(features),[choices,setChoices]=useState(icons);
 function toggle(key:ProductFeatureKey,enabled:boolean){setSelected(current=>enabled?[...current.filter(k=>k!==key&&!(key==='two_hours_ticket'&&k==='full_day_ticket')&&!(key==='full_day_ticket'&&k==='two_hours_ticket')),key]:current.filter(k=>k!==key));}
 const activeIcons=Object.fromEntries(selected.map(key=>[key,choices[key]??productFeatureOptions.find(f=>f.key===key)!.icon]));
 return <fieldset className={styles.field}><legend>Product amenities</legend><p>Select what this product includes, then choose an icon for each amenity. These badges appear only on this product’s card.</p><p>Ticket validity is a display label. Seat occupancy is controlled separately in Schedule &amp; seats.</p>
 {selected.map(key=><input key={key} type="hidden" name="features" value={key}/>)}<input type="hidden" name="feature_icons" value={JSON.stringify(activeIcons)}/>
 <div className={styles.grid}>{productFeatureOptions.map(option=>{const enabled=selected.includes(option.key),icon=choices[option.key]??option.icon;return <div key={option.key} className={styles.option} data-selected={enabled}><label className={styles.toggle}><input type="checkbox" checked={enabled} onChange={e=>toggle(option.key,e.target.checked)}/><AmenityIcon name={icon}/><span>{option.label}</span></label>{enabled&&<label className={styles.iconChoice}>Icon<select aria-label={`Icon for ${option.label}`} value={icon} onChange={e=>setChoices({...choices,[option.key]:e.target.value as AmenityIconName})}>{amenityIcons.map(name=><option key={name} value={name}>{({clock:'Clock',languages:'Languages',stop:'Stop',ticket:'Ticket',snowflake:'Air conditioning',wifi:'Wi-Fi',people:'People',van:'Van',map:'Map',pin:'Location',headphones:'Headphones',camera:'Camera',info:'Information'} as Record<string,string>)[name]}</option>)}</select></label>}</div>;})}</div>
 </fieldset>;
}
