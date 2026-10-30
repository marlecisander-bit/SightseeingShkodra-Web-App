'use client';
import {useState} from 'react';
import {amenityIcons,type AmenityIconName} from '@/modules/content/hero-amenities';
import {productFeatureOptions,type ProductFeatureKey,type ProductFeatureIcons} from '@/modules/booking/product-features';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import styles from './product-amenities.module.css';
export function ProductAmenitiesInput({features=[],icons={}}:{features?:ProductFeatureKey[];icons?:ProductFeatureIcons}){
 const [selected,setSelected]=useState(features),[choices,setChoices]=useState(icons);
 const [dismissed,setDismissed]=useState<ProductFeatureKey|null>(null);
 const [tooltipOffset,setTooltipOffset]=useState(0);
 function reveal(element:HTMLLabelElement){setDismissed(null);setTooltipOffset(Math.min(0,window.innerWidth-element.getBoundingClientRect().left-208));}
 function toggle(key:ProductFeatureKey,enabled:boolean){setSelected(current=>enabled?[...current.filter(k=>k!==key&&!(key==='two_hours_ticket'&&k==='full_day_ticket')&&!(key==='full_day_ticket'&&k==='two_hours_ticket')),key]:current.filter(k=>k!==key));}
 const activeIcons=Object.fromEntries(selected.map(key=>[key,choices[key]??productFeatureOptions.find(f=>f.key===key)!.icon]));
 return <fieldset className={styles.field}><legend>Product amenities</legend>
 {selected.map(key=><input key={key} type="hidden" name="features" value={key}/>)}<input type="hidden" name="feature_icons" value={JSON.stringify(activeIcons)}/>
 <div className={styles.grid}>{productFeatureOptions.map(option=>{const enabled=selected.includes(option.key),icon=choices[option.key]??option.icon;return <label key={option.key} className={styles.toggle} data-selected={enabled} data-tooltip-hidden={dismissed===option.key} onMouseEnter={event=>reveal(event.currentTarget)} onFocus={event=>reveal(event.currentTarget)} onKeyDown={event=>{if(event.key==='Escape')setDismissed(option.key);}}><input type="checkbox" aria-label={option.label} checked={enabled} onChange={e=>toggle(option.key,e.target.checked)}/><AmenityIcon name={icon}/><span className={styles.tooltip} style={{transform:`translateX(${tooltipOffset}px)`}} aria-hidden="true">{option.label}</span></label>;})}</div>
 {selected.length>0&&<details className={styles.customize}><summary>Change icons</summary><div className={styles.iconGrid}>{productFeatureOptions.filter(option=>selected.includes(option.key)).map(option=><label key={option.key} className={styles.iconChoice}>{option.label}<select aria-label={`Icon for ${option.label}`} value={choices[option.key]??option.icon} onChange={e=>setChoices({...choices,[option.key]:e.target.value as AmenityIconName})}>{amenityIcons.map(name=><option key={name} value={name}>{({clock:'Clock',languages:'Languages',stop:'Stop',ticket:'Ticket',snowflake:'Air conditioning',wifi:'Wi-Fi',people:'People',van:'Van',map:'Map',pin:'Location',headphones:'Headphones',camera:'Camera',info:'Information'} as Record<string,string>)[name]}</option>)}</select></label>)}</div></details>}

 </fieldset>;
}
