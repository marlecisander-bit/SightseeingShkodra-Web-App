import {AdminSectionContext} from '../../../admin-workspace-context';
import {MorePanel} from '../../../more-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('more',props);return <><MorePanel operatorId={context.operatorId} role={context.role}/><AdminSectionContext identity={context}/></>;}
