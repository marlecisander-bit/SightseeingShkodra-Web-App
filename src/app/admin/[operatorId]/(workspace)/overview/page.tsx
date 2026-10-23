import {AdminSectionContext} from '../../../admin-workspace-context';
import {OverviewPanel} from '../../../overview-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('overview',props);return <><h1>Overview</h1><OverviewPanel operatorId={context.operatorId} role={context.role}/><AdminSectionContext identity={context}/></>;}
