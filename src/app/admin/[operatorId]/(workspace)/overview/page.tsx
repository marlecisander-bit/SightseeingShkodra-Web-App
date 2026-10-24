import {Suspense} from 'react';
import {AdminSectionContext} from '../../../admin-workspace-context';
import {OverviewPanel} from '../../../overview-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
import {getDailyBookings} from '@/modules/dashboard/daily-bookings-server';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
async function DailyOverview({operatorId,role,now}:{operatorId:string;role:StaffRole;now:Date}){
 const snapshot=await getDailyBookings(operatorId,now);
 return <OverviewPanel operatorId={operatorId} role={role} now={now} snapshot={snapshot}/>;
}
export default async function Page(props:SectionProps){
 const context=await sectionAccess('overview',props),now=new Date();
 return <>{hasPermission(context.role,'bookings.read')?
  <Suspense fallback={<OverviewPanel operatorId={context.operatorId} role={context.role} now={now} loading/>}>
   <DailyOverview operatorId={context.operatorId} role={context.role} now={now}/>
  </Suspense>:<OverviewPanel operatorId={context.operatorId} role={context.role} now={now}/>}
  <AdminSectionContext identity={context}/></>;
}
