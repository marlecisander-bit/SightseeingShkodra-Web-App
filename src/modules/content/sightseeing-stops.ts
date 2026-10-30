import {presentationMessage,type JourneySnapshot} from '@/modules/tracking/journey-contract';
export type StopPlace={id:string;name:string;text:string;link:string;stopId?:string|null;image?:string;alt?:string;tag?:string};
export function sightseeingStops(stops:readonly {id:string;label:string}[],places:readonly StopPlace[],journey?:JourneySnapshot|null){
 // The validated iframe also carries published stop identities, independently of GPS confidence.
 // Reuse them when the server's separately configured read is unavailable; no second data store.
 const presentationAvailable=journey&&!journey.unavailable&&(!journey.phase||journey.phase!=='UNKNOWN'&&presentationMessage(journey)!==null);
 const published=stops.length?stops:(journey?.stops??[]).map(s=>({id:s.id,label:s.label}));
 return published.map((stop,index)=>{const matches=places.filter(p=>p.stopId===stop.id);const place=matches.length===1?matches[0]:undefined;const live=presentationAvailable?journey.stops.find(s=>s.id===stop.id):undefined;return {...stop,number:index+1,name:place?.name||stop.label.replace(/^Stop \d+ - /,''),place,state:live?.state??'upcoming',eta:live?.eta??''};});
}
export function sightseeingStatus(stops:ReturnType<typeof sightseeingStops>,journey?:JourneySnapshot|null,stale=false){
 if(stale)return 'Live updates are stale. Check the map for the latest information.';
 if(journey?.phase){const message=presentationMessage(journey);return message??'Location temporarily unavailable';}
 // Fresh location and route continuity are separate upstream facts.
 const age=journey?.lastObservationAt?(Date.now()-Date.parse(journey.lastObservationAt))/1000:Infinity;
 if(journey?.movement&&journey.confidence?.position==='live'&&age>=-60&&age<=90)return journey.movement;
 if(!journey||journey.unavailable)return 'Live updates temporarily unavailable.';
 const current=stops.find(s=>s.state==='current');if(current)return `Van at ${current.name}`;
 const next=stops.find(s=>s.state==='next');if(next)return `Next stop: ${next.name}${next.eta?` · ${next.eta}`:''}`;
 return 'Current van location unknown. Published stops remain available.';
}
