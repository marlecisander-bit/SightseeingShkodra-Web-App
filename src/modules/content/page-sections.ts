// Page presentation only. Prices, schedules, GPS and booking mechanics remain domain-owned.
const f=(key:string,label:string,initial:string)=>({key,label,initial,kind:'text' as const,max:700});
export const pageSections=[
 {id:'tourPage',title:'Tour introduction and information',fields:[
 f('tourPage.eyebrow','Eyebrow','ONE DAY. YOUR OWN WAY.'),f('tourPage.includedTitle','Inclusions heading','A simple day out.'),
 f('tourPage.faqTitle','FAQ heading','A few questions, answered.'),
 f('tourPage.faqBook','Booking question','Can I book now?'),f('tourPage.faqBoard','Boarding question','Where do I board?'),f('tourPage.faqFees','Inclusions question','Are entrance tickets included?'),f('tourPage.faqLive','Tracking question','Can I see the van live?') ]},
 {id:'explorePage',title:'Explore introduction',fields:[f('explorePage.eyebrow','Eyebrow','THE LOCAL NOTEBOOK'),f('explorePage.title','Heading','Closer to Shkodra.'),f('explorePage.text','Introduction','A city to wander. A landscape to linger in.')]},
 {id:'bookPage',title:'Booking introduction',fields:[f('bookPage.eyebrow','Eyebrow','THE SHKODRA DAY TOUR'),f('bookPage.title','Heading','A good day starts here.')]},
 {id:'dayPage',title:'Travel companion introduction',fields:[f('dayPage.eyebrow','Eyebrow','YOUR TRAVEL COMPANION'),f('dayPage.title','Heading','Your Shkodra day.')]},
];
