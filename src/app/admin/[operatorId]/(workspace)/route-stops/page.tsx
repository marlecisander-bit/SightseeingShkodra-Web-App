import {AdminSectionContext} from '../../../admin-workspace-context';
import {RouteStopsPanel} from '../../../route-stops-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('route-stops',props);return <><h1>Stops &amp; destinations</h1><RouteStopsPanel operatorId={context.operatorId} view={(await props.searchParams).view}/><AdminSectionContext identity={context}/></>;}
