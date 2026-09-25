export const amenityIcons = ['clock','languages','stop','ticket','snowflake','wifi','people','van','map','pin','headphones','camera','info'] as const;
export type AmenityIconName = typeof amenityIcons[number];
export type HeroAmenity = {id:string;icon:AmenityIconName;title:string;description:string;published:boolean;display_order:number;created_at:string;updated_at:string};
export function parseAmenities(value:string):HeroAmenity[]{
 const rows:unknown=JSON.parse(value);
 if(!Array.isArray(rows)||rows.length>50)throw Error('Use up to 50 amenities.');
 const ids=new Set<string>();
 for(const a of rows){
  if(!a||typeof a!=='object'||Object.keys(a).sort().join(',')!=='created_at,description,display_order,icon,id,published,title,updated_at'||! /^[a-f0-9-]{36}$/.test(a.id)||ids.has(a.id)||!amenityIcons.includes(a.icon)||typeof a.title!=='string'||!a.title.trim()||a.title.length>100||typeof a.description!=='string'||a.description.length>180||typeof a.published!=='boolean'||!Number.isInteger(a.display_order)||a.display_order<0||a.display_order>999||typeof a.created_at!=='string'||!Number.isFinite(Date.parse(a.created_at))||typeof a.updated_at!=='string'||!Number.isFinite(Date.parse(a.updated_at)))throw Error('Check amenity title, icon, order and dates.');
  ids.add(a.id);
 }
 return rows as HeroAmenity[];
}
export const focalPositions=['left top','center top','right top','left center','center center','right center','left bottom','center bottom','right bottom'] as const;
export function publishedAmenities(value:string){return parseAmenities(value).filter(a=>a.published).sort((a,b)=>a.display_order-b.display_order||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));}
