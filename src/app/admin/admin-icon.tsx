import {createElement} from 'react';
import icons from './admin-icons.json';

/** Lucide outline subset, copied without an npm dependency.
 * Upstream: lucide-icons/lucide, commit 7b0196e249ca09ca27c584c497aca9a8cab8a7f5, icons/*.svg.
 * Copyright Lucide/Feather contributors. Full notices: ./LUCIDE-LICENSE.txt.
 * Public amenity artwork is intentionally not replaced by this admin UI component.
 */
export type AdminIconName=keyof typeof icons;
export const adminPrimaryIcons={overview:'layout-dashboard',bookings:'ticket',tours:'bus-front',products:'ticket',website:'panels-top-left',more:'settings-2'} as const;
export function AdminIcon({name,size=20}:{name:AdminIconName;size?:16|18|20}){
 return <svg data-admin-icon={name} aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{(icons[name] as [string,Record<string,string>][]).map(([tag,attributes],index)=>createElement(tag,{...attributes,key:index}))}</svg>;
}
