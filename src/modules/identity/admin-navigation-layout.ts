import {hasPermission, type StaffRole} from './roles';
import {navigationFor} from './admin-navigation';
import type {AmenityIconName} from '@/modules/content/hero-amenities';

export type AdminArea = 'overview'|'bookings'|'tours'|'website'|'reports'|'settings';
export type AdminNavItem = {id:string;label:string;section?:string;context?:string;href:string;external?:boolean;note?:string};
export type AdminNavGroup = {id:AdminArea;label:string;icon:AmenityIconName;items:AdminNavItem[]};
export const adminAreaLabels:Record<AdminArea,string>={overview:'Overview',bookings:'Bookings',tours:'Tour Management',website:'Website',reports:'Reports',settings:'Settings'};
// Presentation only. Existing section permissions and all server guards remain authoritative.
export function adminNavigationGroups(operatorId:string,role:StaffRole):AdminNavGroup[]{
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 const allowed=new Set(navigationFor(role).map(item=>item.slug));
 const link=(id:string,label:string,section:string,context?:string,note?:string):AdminNavItem=>({id,label,section,context,href:`${root}/${section}${context?'#admin-nav='+context:''}`,note});
 const groups:AdminNavGroup[]=[
  {id:'overview',label:'Overview',icon:'info',items:[link('overview','Today / Overview','overview')]},
  {id:'bookings',label:'Bookings',icon:'ticket',items:[
   link('bookings','Reservations','bookings'),link('availability','Calendar & Availability','departures','availability'),
   ...(hasPermission(role,'pricing.manage')?[link('prices','Prices & Offers','departures','prices','Standard and date-specific prices in the existing calendar.')]:[]),
   link('catalog','Ticket Settings','catalog',undefined,'Products & suppliers; passenger prices stay in Calendar & Pricing.')]},
  {id:'tours',label:'Tour Management',icon:'van',items:[
   link('schedule','Schedule & Departures','departures','schedule'),link('destinations','Route & Stops: editorial destinations','content','destinations'),
   {id:'live',label:'Live Tracking: public map',href:'/live',external:true},
   ...(['owner','admin','operations'].includes(role)?[{id:'map-admin',label:'Operational stops & GPS',href:'https://sightseeingshkodralivetrackingapp.netlify.app/',external:true,note:'Independent Live Map · separate sign-in.'}]:[])]},
  {id:'website',label:'Website',icon:'camera',items:[
   link('content','Page Editor','content'),link('route-stops','Route stops: names & images','route-stops'),link('media','Images & Media','content','media','Images are edited inside their existing page sections.'),
   link('reviews','Reviews & Partners: reviews','reviews'),link('partners','Reviews & Partners: partners','partners'),
   link('faq','FAQ & Policies','content','faq',hasPermission(role,'content.sensitive')?'FAQ, Privacy and Terms in their canonical editors.':'FAQ editor; legal policies remain owner-only.'),
   link('seo','SEO & Visibility','content','seo','Existing Website metadata and section visibility; no indexing settings.')]},
  // Reports and Staff & Permissions remain conceptual only: no dead destinations.
  {id:'reports',label:'Reports',icon:'info',items:[]},
  {id:'settings',label:'Settings',icon:'info',items:[
   ...(hasPermission(role,'content.sensitive')?[link('business','Business Profile','content','business','Public contact, WhatsApp and footer controls.')]:[]),
   link('notifications','My notifications & devices','notifications'),link('email','Booking email delivery & integration status','email',undefined,'Owner-only delivery tools; personal preferences stay separate.')]},
 ];
 return groups.map(group=>({...group,items:group.items.filter(item=>!item.section||allowed.has(item.section))})).filter(group=>group.items.length);
}
export function activeAdminItem(groups:AdminNavGroup[],section:string,context:string){
 return groups.flatMap(g=>g.items).find(i=>i.section===section&&i.context===context)
  ??groups.flatMap(g=>g.items).find(i=>i.section===section&&!i.context)
  ??groups.flatMap(g=>g.items).find(i=>i.section===section);
}
export function adminContext(hash:string){return /^#admin-nav=([a-z]+)$/.exec(hash)?.[1]??'';}
export function websiteNavigationContext(context:string):{scope:'homepage'|'destinations'|'pages'|'global';section:string|null}{
 const contexts:Record<string,{scope:'homepage'|'destinations'|'pages'|'global';section:string|null}>={destinations:{scope:'destinations',section:null},media:{scope:'homepage',section:'hero'},faq:{scope:'pages',section:'faq'},seo:{scope:'global',section:'seo'},business:{scope:'global',section:'footer'}};
 return contexts[context]??{scope:'homepage',section:null};
}
