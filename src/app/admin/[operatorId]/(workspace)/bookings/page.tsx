import {AdminSectionContext} from '../../../admin-workspace-context';
import {BookingsPanel} from '../../../bookings-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('bookings',props);return <><h1>Bookings</h1><BookingsPanel operatorId={context.operatorId} {...await props.searchParams}/><AdminSectionContext identity={context}/></>;}
