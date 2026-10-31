import {publicMapUrl} from '@/modules/tracking/public-map-binding';
import {hasPermission, type StaffRole} from './roles';
import {navigationFor} from './admin-navigation';
import type {AmenityIconName} from '@/modules/content/hero-amenities';

export type AdminArea = 'overview'|'bookings'|'tours'|'products'|'website'|'more';
export type AdminNavItem = {id:string;label:string;section?:string;context?:string;href:string;external?:boolean;note?:string};
export type AdminNavGroup = {id:AdminArea;label:string;icon:AmenityIconName;items:AdminNavItem[]};
export const adminAreaLabels:Record<AdminArea,string>={overview:'Home',bookings:'Bookings',tours:'Tours',products:'Products',website:'Website',more:'More'};
// Presentation only: every destination and action retains independent server authorization.
export function adminNavigationGroups(operatorId:string,role:StaffRole):AdminNavGroup[]{
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 const allowed=new Set(navigationFor(role).map(item=>item.slug));
 const link=(id:string,label:string,section:string,context?:string,note?:string):AdminNavItem=>({id,label,section,context,href:`${root}/${section}${context?'#admin-nav='+context:''}`,note});
 const tour=(id:string,label:string,view:string,context=id):AdminNavItem=>({...link(id,label,'departures',context),href:`${root}/departures?view=${view}#admin-nav=${context}`});
 const groups:AdminNavGroup[]=[
  {id:'overview',label:'Home',icon:'info',items:[link('overview','Home','overview')]},
  {id:'bookings',label:'Bookings',icon:'ticket',items:[link('bookings','Reservations','bookings')]},
  {id:'tours',label:'Tours',icon:'van',items:[
   tour('today','Today','today'),
   tour('availability','Calendar & departures','calendar','availability'),
   tour('route','Route & stops','route'),
   ...(hasPermission(role,'tracking.manage')?[
    {id:'live',label:'Open Live Map',href:publicMapUrl,external:true},
    {id:'map-admin',label:'Operational stops & GPS',href:'https://sightseeingshkodralivetrackingapp.netlify.app/',external:true,note:'Independent Live Map · separate sign-in.'}
   ]:[])]},
  {id:'products',label:'Products',icon:'ticket',items:[link('products','All products','products'),link('catalog','Suppliers','catalog')]},
  {id:'website',label:'Website',icon:'camera',items:[
   link('content','Page editor','content'),link('route-stops','Route & destination content','route-stops'),
   link('media','Images & media','content','media','Photos stay with their page or product.'),
   link('reviews','Guest reviews','reviews'),link('partners','Partners','partners'),
   link('faq','FAQ & policies','content','faq',hasPermission(role,'content.sensitive')?'FAQ, privacy and terms.':'FAQ editor; legal policies remain owner-only.'),
   link('seo','SEO & visibility','content','seo','Search titles and page visibility.')]},
  {id:'more',label:'More',icon:'info',items:[
   link('more','Settings & account','more'),
   ...(hasPermission(role,'content.sensitive')?[link('business','Business profile','content','business','Public contact, WhatsApp and footer controls.')]:[]),
   link('notifications','Notifications & devices','notifications'),
   link('email','Booking emails','email',undefined,'Delivery history and settings.')]
  },
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
 const contexts:Record<string,{scope:'homepage'|'destinations'|'pages'|'global';section:string|null}>={destinations:{scope:'destinations',section:null},media:{scope:'homepage',section:'hero'},faq:{scope:'pages',section:'faq'},seo:{scope:'global',section:'seo'},business:{scope:'global',section:'footer'},partners:{scope:'homepage',section:'partners'},whatsapp:{scope:'global',section:'whatsapp'}};
 return contexts[context]??{scope:'homepage',section:null};
}
