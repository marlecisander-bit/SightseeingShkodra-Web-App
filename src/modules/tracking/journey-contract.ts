export type EmbeddedDisplay = {version:1;label:string;destination:string;activity:string;eta:string;nextStop:string;live:boolean;stops:{id:string;number:string;name:string;label:string;state:'unknown'|'current'|'approaching'|'next'|'completed'|'upcoming';color?:string;photoUrl?:string;skipped?:boolean;checked?:boolean}[]};
function safePhoto(value:unknown):boolean { if(value==='')return true; if(typeof value!=='string'||value.length>2048)return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;} }
function validDisplay(value:unknown):value is EmbeddedDisplay {
 if(!value||typeof value!=='object')return false;
 const d=value as EmbeddedDisplay;
 if(d.version!==1||typeof d.live!=='boolean'||!['label','destination','activity','eta','nextStop'].every(key=>typeof d[key as keyof EmbeddedDisplay]==='string'&&(d[key as keyof EmbeddedDisplay] as string).length<=240)||!Array.isArray(d.stops)||d.stops.length>100)return false;
 const ids=new Set<string>();
 return d.stops.every(s=>{if(!s||!['id','number','name','label'].every(key=>{const field=s[key as keyof typeof s];return typeof field==='string'&&field.length<=180;})||(s.checked!==undefined&&typeof s.checked!=='boolean')||(s.skipped!==undefined&&typeof s.skipped!=='boolean')||(s.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(s.color))||(s.photoUrl!==undefined&&!safePhoto(s.photoUrl))||!s.id||ids.has(s.id)||!['unknown','current','approaching','next','completed','upcoming'].includes(s.state))return false;ids.add(s.id);return true;});
}
export type JourneyStop = {id:string;number?:string;label:string;state:'current'|'next'|'departed'|'upcoming';eta:string};
export type JourneySnapshot = {type:'shkodra:journey';version:1;unavailable:boolean;stops:JourneyStop[];embeddedDisplay?:EmbeddedDisplay;movement?:string;presentationKind?:'fresh'|'reported_stopped'|'historical_stopped'|'historical_location'|'unavailable';phase?:'ARRIVING'|'PARKED'|'LEAVING'|'EN_ROUTE'|'UNKNOWN';statusValidUntil?:string|null;lastObservationAt?:string|null;confidence?:{position:'live'|'delayed'|'unavailable'}};
export function parseJourney(value:unknown):JourneySnapshot|null {
 if(!value||typeof value!=='object')return null;
 const d=value as JourneySnapshot;
 if(d.type!=='shkodra:journey'||d.version!==1||typeof d.unavailable!=='boolean'||!Array.isArray(d.stops)||d.stops.length>100)return null;
 if(d.embeddedDisplay!==undefined&&!validDisplay(d.embeddedDisplay))return null;
 // Additive v1 presentation metadata; never interpret GPS or infer a stop here.
 if(d.movement!==undefined&&(typeof d.movement!=='string'||d.movement.length>180))return null;
 if(d.lastObservationAt!=null&&(typeof d.lastObservationAt!=='string'||d.lastObservationAt.length>40||!Number.isFinite(Date.parse(d.lastObservationAt))))return null;
 if(d.confidence!==undefined&&(!d.confidence||typeof d.confidence!=='object'||!['live','delayed','unavailable'].includes(d.confidence.position)))return null;
 if(d.presentationKind!==undefined&&!['fresh','reported_stopped','historical_stopped','historical_location','unavailable'].includes(d.presentationKind))return null;
 if(d.phase!==undefined&&!['ARRIVING','PARKED','LEAVING','EN_ROUTE','UNKNOWN'].includes(d.phase))return null;
 if(d.statusValidUntil!=null&&(typeof d.statusValidUntil!=='string'||d.statusValidUntil.length>40||!Number.isFinite(Date.parse(d.statusValidUntil))))return null;
 const ids=new Set<string>();
 for(const s of d.stops){if(!s||typeof s.id!=='string'||!s.id||s.id.length>180||ids.has(s.id)||(s.number!==undefined&&(typeof s.number!=='string'||s.number.length>30))||typeof s.label!=='string'||s.label.length>180||typeof s.eta!=='string'||s.eta.length>80||!['current','next','departed','upcoming'].includes(s.state))return null;ids.add(s.id);}
 return d;
}

// Validate the upstream presentation lifetime; never reclassify GPS or infer parking here.
export function presentationMessage(d:Pick<JourneySnapshot,'movement'|'phase'|'statusValidUntil'|'lastObservationAt'|'presentationKind'>,now=Date.now()):string|null {
 if(!d.movement||typeof d.movement!=='string'||d.movement.length>180)return null;
 if(d.presentationKind&&d.presentationKind!=='unavailable'){
  if(d.presentationKind.startsWith('historical_')&&d.phase!=='UNKNOWN')return null;
  const observed=Date.parse(d.lastObservationAt??''),until=Date.parse(d.statusValidUntil??''),limit=d.presentationKind.startsWith('historical_')?600000:90000;
  return Number.isFinite(observed)&&Number.isFinite(until)&&now-observed>=0&&now-observed<=limit&&until-observed<=limit&&until>=now?d.movement:null;
 }
 if(d.phase==='UNKNOWN')return d.movement;
 if(!d.phase||!['ARRIVING','PARKED','LEAVING','EN_ROUTE'].includes(d.phase))return null;
 const observed=Date.parse(d.lastObservationAt??''),until=Date.parse(d.statusValidUntil??''),limit=d.phase==='PARKED'?180000:90000;
 return Number.isFinite(observed)&&Number.isFinite(until)&&now-observed>=-60000&&now-observed<=limit&&until-observed<=limit&&until>=now?d.movement:null;
}

export function presentationTtl(d:Pick<JourneySnapshot,'movement'|'phase'|'statusValidUntil'|'lastObservationAt'|'presentationKind'>,now=Date.now()):number {
 if((!d.phase||d.phase==='UNKNOWN')&&(!d.presentationKind||d.presentationKind==='unavailable'))return 45000;
 if(presentationMessage(d,now)===null)return 0;
 return Math.max(0,Math.min(45000,Date.parse(d.statusValidUntil??'')-now));
}
