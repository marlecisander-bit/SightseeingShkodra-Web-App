import type {MeetingPoint} from "@/modules/booking/meeting-point";
export function MeetingPointSummary({value}:{value:MeetingPoint|null|undefined}){
 if(!value)return null;
 return <p><strong>{value.name}</strong>{value.directions&&<><br/>{value.directions}</>}<br/><a href={value.url} target="_blank" rel="noopener noreferrer">{value.label}</a></p>;
}
