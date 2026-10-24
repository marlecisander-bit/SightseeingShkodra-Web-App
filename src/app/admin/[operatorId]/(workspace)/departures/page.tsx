import {AdminSectionContext} from '../../../admin-workspace-context';
import {CalendarPanel} from '../../../calendar-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('departures',props);return <><CalendarPanel operatorId={context.operatorId} {...await props.searchParams}/><AdminSectionContext identity={context}/></>;}
