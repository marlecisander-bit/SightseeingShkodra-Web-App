import {AdminSectionContext} from '../../../admin-workspace-context';
import {EmailPanel} from '../../../email-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('email',props);return <><h1>Email &amp; Notifications</h1><EmailPanel operatorId={context.operatorId} {...await props.searchParams}/><AdminSectionContext identity={context}/></>;}
