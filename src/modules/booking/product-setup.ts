export type ProductTab='details'|'prices'|'schedule'|'website';
/** Only groups server publication blockers; never decides whether publication is allowed. */
export function productSetupSteps(blockers:string[]){
 const definitions:[ProductTab,string][]=[['details','Details & photo'],['prices','Passenger prices'],['schedule','Schedule & seats'],['website','Homepage placement']];
 const target=(message:string):ProductTab=>/price/i.test(message)?'prices':/schedule|operating period|reservation|van tour/i.test(message)?'schedule':/homepage booking card/i.test(message)?'website':'details';
 return definitions.map(([tab,label])=>({tab,label,issues:blockers.filter(message=>target(message)===tab)}));
}
