'use client';
import {useState,type ReactNode} from 'react';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import fixtureStyles from './fixture.module.css';
import {AdminShellView} from '@/app/admin/admin-shell';
import {OverviewPanel} from '@/app/admin/overview-panel';
import {NotificationContext,NotificationCenter} from '@/app/admin/notifications';
import {AdminSectionContext} from '@/app/admin/admin-workspace-context';
import {WebsiteEngagementFixture} from './website-engagement-fixture';
import {MorePanel} from '@/app/admin/more-panel';
import {ToursFixture} from './tours-fixture';
import {BookingsFixture} from './bookings-fixture';
import {WebsiteWorkspace} from '@/app/admin/website-workspace';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {adminNavigationGroups} from '@/modules/identity/admin-navigation-layout';
import {staffRoles,type StaffRole} from '@/modules/identity/roles';
import {unavailableBookings,type DailyBookings} from '@/modules/dashboard/daily-bookings';
import type {Inbox} from '@/modules/notifications/contracts';
const op='10000000-0000-4000-8000-000000000001',booking='10000000-0000-4000-8000-000000000050';
const synthetic:Inbox={items:[{id:'synthetic',notification_id:'synthetic',read_at:null,created_at:'2026-10-24T07:42:00Z',notification:{id:'synthetic',type:'booking_created',title:'Illustrative reservation',message:'SS-DEMO · 3 guests. Local fixture only.',booking_id:booking,severity:'info',event_at:'2026-10-24T07:42:00Z'}}],unread:1,next:null};
const stamp='2026-10-24T07:42:00Z';
export function AdminV2Fixture({children}:{children:ReactNode}){
 const router=useRouter(),pathname=usePathname(),search=useSearchParams(),section=pathname.split('/').at(-1)??'overview';
 const requested=search.get('role'),chosen=staffRoles.find(value=>value===requested);const [storedRole,setStoredRole]=useState<StaffRole>(chosen??'owner');const role=chosen??storedRole;if(chosen&&chosen!==storedRole)setStoredRole(chosen);
 const [inbox,setInbox]=useState(synthetic),[instance]=useState('local-persistent-shell');
 const state=search.get('state')??'ready';
 const navigation=adminNavigationGroups(op,role).map(group=>({...group,items:group.items.map(item=>{const url=new URL(item.href,'http://fixture.invalid');url.pathname=url.pathname.replace(`/admin/${op}`,'/dev/admin-v2');url.searchParams.set('role',role);return {...item,href:item.external?'#external-inert':url.pathname+url.search+url.hash};})}));
 const context={operator:op,inbox:state==='empty'?{items:[],unread:0,next:null}:inbox,error:state==='error'?'Synthetic notification failure.':'',loading:state==='loading',connection:'Local fixture',version:0,refresh:async()=>{},request:async()=>({history:[],canManageEmail:false,devices:[],preferences:[],publicKey:'',workerEnabled:false,configured:false,pushEnabled:false,paused:true}),mutate:async(action:unknown)=>{if(typeof action==='object'&&action!==null&&'kind' in action&&action.kind==='read')setInbox(old=>({...old,unread:0,items:old.items.map(i=>({...i,read_at:stamp}))}));return {};}};
 const account=<p>Local synthetic account. Sign out and external links are inert in this fixture.</p>;
 const groups=adminNavigationGroups(op,role),allowed=groups.flatMap(g=>g.items).some(i=>i.section===section);
 const snapshot:DailyBookings={...unavailableBookings(new Date(stamp)),...(state==='error'||state==='loading'?{}:{state:'ready',passengers:state==='empty'?0:3,seats:state==='empty'?0:2,bookedMinor:state==='empty'?0:9000})};
 const content=section==='overview'?<OverviewPanel operatorId={op} role={role} now={new Date(stamp)} snapshot={snapshot} loading={state==='loading'}/>
 :!allowed?<><h1>Access unavailable</h1><p>This role cannot open this fixture destination.</p></>
 :section==='bookings'?<BookingsFixture role={role} state={state}/>
 :section==='reviews'||section==='partners'?<WebsiteEngagementFixture section={section} role={role}/>
 :section==='content'?<WebsiteWorkspace operatorId={op} record={{id:'synthetic',updated_at:stamp,published_at:stamp,body:{content:initialWebsiteContent},published_body:{content:initialWebsiteContent}}} canPublish={role==='owner'||role==='admin'} canSensitive={role==='owner'||role==='admin'} destinationManager={<p>Synthetic destination context</p>}/>
 :section==='notifications'?<><h1>Notifications</h1><NotificationCenter/></>
 :section==='email'?children
 :section==='more'?<MorePanel operatorId={op} role={role}/>
 :section==='departures'?<ToursFixture role={role} state={state}/>
 :<><h1>{section}</h1><p>Existing destination represented by a local synthetic heading.</p></>;
 return <NotificationContext.Provider value={context}><AdminShellView operatorId={op} userId="synthetic-user" operatorName="Sightseeing Shkodra · local review" role={role} section={section} navigation={navigation} accountActions={account}>
  <p data-fixture-instance={instance} className={fixtureStyles.reviewMarker}>Local synthetic review · no hosted data or writes</p>
  {/* Prevent this fixture from invoking any imported real server actions or destinations. */}
  <div onSubmitCapture={event=>{const form=event.target as HTMLFormElement;if(form.closest('[data-tours-workspace]')&&form.method.toLowerCase()==='get'){event.preventDefault();event.stopPropagation();const query=new URLSearchParams();new FormData(form).forEach((v,k)=>{if(typeof v==='string'&&v)query.set(k,v);});query.set('role',role);router.push('/dev/admin-v2/departures?'+query.toString());return;}if(form.closest('[data-safe-booking-fixture]')){if(form.method.toLowerCase()==='get'){event.preventDefault();event.stopPropagation();const query=new URLSearchParams();new FormData(form).forEach((v,k)=>{if(typeof v==='string'&&v)query.set(k,v);});query.set('role',role);router.push('/dev/admin-v2/bookings?'+query.toString());}return;}event.preventDefault();event.stopPropagation();}} onClickCapture={event=>{
   const target=(event.target as Element).closest('a');if(!target)return;
   const url=new URL(target.href);if(url.pathname.startsWith('/dev/admin-v2'))return;
   event.preventDefault();event.stopPropagation();
   if(url.pathname.startsWith(`/admin/${op}/`))router.push(url.pathname.replace(`/admin/${op}`,'/dev/admin-v2')+url.search+(url.search?'&':'?')+'role='+role+url.hash);
  }}>{content}</div>{section!=='email'&&children}<AdminSectionContext identity={{operatorId:op,userId:'synthetic-user',role}}/>
 </AdminShellView></NotificationContext.Provider>;
}
