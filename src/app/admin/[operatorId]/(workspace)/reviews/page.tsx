import {AdminSectionContext} from '../../../admin-workspace-context';
import {ReviewsPanel} from '../../../reviews-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('reviews',props);return <><h1>Guest Reviews</h1><ReviewsPanel operatorId={context.operatorId}/><AdminSectionContext identity={context}/></>;}
