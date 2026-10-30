export type JourneyStop = {id:string;number?:string;label:string;state:'current'|'next'|'departed'|'upcoming';eta:string};
export type JourneySnapshot = {type:'shkodra:journey';version:1;unavailable:boolean;stops:JourneyStop[];movement?:string;lastObservationAt?:string|null;confidence?:{position:'live'|'delayed'|'unavailable'}};
export function parseJourney(value:unknown):JourneySnapshot|null {
 if(!value||typeof value!=='object')return null;
 const d=value as JourneySnapshot;
 if(d.type!=='shkodra:journey'||d.version!==1||typeof d.unavailable!=='boolean'||!Array.isArray(d.stops)||d.stops.length>100)return null;
 // Additive v1 presentation metadata; never interpret GPS or infer a stop here.
 if(d.movement!==undefined&&(typeof d.movement!=='string'||d.movement.length>180))return null;
 if(d.lastObservationAt!=null&&(typeof d.lastObservationAt!=='string'||d.lastObservationAt.length>40||!Number.isFinite(Date.parse(d.lastObservationAt))))return null;
 if(d.confidence!==undefined&&(!d.confidence||typeof d.confidence!=='object'||!['live','delayed','unavailable'].includes(d.confidence.position)))return null;
 const ids=new Set<string>();
 for(const s of d.stops){if(!s||typeof s.id!=='string'||!s.id||s.id.length>180||ids.has(s.id)||(s.number!==undefined&&(typeof s.number!=='string'||s.number.length>30))||typeof s.label!=='string'||s.label.length>180||typeof s.eta!=='string'||s.eta.length>80||!['current','next','departed','upcoming'].includes(s.state))return null;ids.add(s.id);}
 return d;
}
