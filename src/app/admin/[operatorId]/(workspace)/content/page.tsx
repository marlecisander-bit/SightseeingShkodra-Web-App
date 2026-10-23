import {AdminSectionContext} from '../../../admin-workspace-context';
import {ContentPanel} from '../../../content-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('content',props);return <><ContentPanel operatorId={context.operatorId} result={(await props.searchParams).result}/><AdminSectionContext identity={context}/></>;}
