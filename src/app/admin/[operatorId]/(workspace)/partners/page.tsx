import {AdminSectionContext} from '../../../admin-workspace-context';
import {PartnersPanel} from '../../../partners-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('partners',props);return <><h1>Partners</h1><PartnersPanel operatorId={context.operatorId}/><AdminSectionContext identity={context}/></>;}
