import type { WebsiteContent } from '@/modules/content/website-schema';
export function PageIntro({content:c,prefix}:{content:WebsiteContent;prefix:'bookPage'|'dayPage'}){return <><p className="p-eyebrow">{c[`${prefix}.eyebrow`]}</p><h1>{c[`${prefix}.title`]}</h1></>;}
