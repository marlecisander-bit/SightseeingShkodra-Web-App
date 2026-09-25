/** Published map identity/order only. No editorial destinations or GPS interpretation. */
export function mapStopSummary(features:unknown[]) {
 const seen=new Set<string>();
 return features.flatMap(value=>{
  if(!value||typeof value!=='object')return [];
  const f=value as {geometry?:{type?:string};properties?:{pointType?:string;active?:boolean;objectId?:string;stopNumber?:number;name?:string}};
  const p=f.properties;
  if(f.geometry?.type!=='Point'||!p||p.pointType==='poi'||p.active===false||typeof p.objectId!=='string'||seen.has(p.objectId))return [];
  seen.add(p.objectId);
  return [{id:p.objectId,label:`Stop ${p.stopNumber??''} - ${String(p.name??'Boarding point').slice(0,160)}`,order:Number(p.stopNumber)||0}];
 }).sort((a,b)=>a.order-b.order).map(({id,label})=>({id,label}));
}
