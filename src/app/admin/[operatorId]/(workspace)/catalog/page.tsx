import {AdminSectionContext} from '../../../admin-workspace-context';
import {CatalogPanel} from '../../../catalog-panel';
import {sectionAccess,type SectionProps} from '../../../section-access';
export default async function Page(props:SectionProps){const context=await sectionAccess('catalog',props);return <><h1>Products &amp; suppliers</h1><CatalogPanel operatorId={context.operatorId} result={(await props.searchParams).result}/><AdminSectionContext identity={context}/></>;}
