import {redirect} from 'next/navigation';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('products',props);redirect(`/admin/${context.operatorId}/products`);}
