import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
export type StopPlace={id:string;name:string;text:string;link:string;stopId?:string|null;image?:string;alt?:string;tag?:string};
export function sightseeingStops(stops:readonly {id:string;label:string}[],places:readonly StopPlace[],journey?:JourneySnapshot|null){
 return stops.map((stop,index)=>{const matches=places.filter(p=>p.stopId===stop.id);const place=matches.length===1?matches[0]:undefined;const live=journey&&!journey.unavailable?journey.stops.find(s=>s.id===stop.id):undefined;return {...stop,number:index+1,name:place?.name||stop.label.replace(/^Stop \d+ - /,''),place,state:live?.state??'upcoming',eta:live?.eta??''};});
}
export function sightseeingStatus(stops:ReturnType<typeof sightseeingStops>,journey?:JourneySnapshot|null,stale=false){
 if(stale)return 'Live updates are stale. Check the map for the latest information.';
 if(!journey||journey.unavailable)return 'Live updates temporarily unavailable.';
 const current=stops.find(s=>s.state==='current');if(current)return `Van at ${current.name}`;
 const next=stops.find(s=>s.state==='next');if(next)return `Next stop: ${next.name}${next.eta?` · ${next.eta}`:''}`;
 return 'Current van location unknown. Published stops remain available.';
}
