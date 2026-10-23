import {AdminSectionContext} from '../../../admin-workspace-context';
import {NotificationCenter} from '../../../notifications';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('notifications',props);return <><h1>Notifications</h1><NotificationCenter/><AdminSectionContext identity={context}/></>;}
