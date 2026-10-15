import { safeSocialUrl, safeWebsiteImage } from './website-schema';

export type Partner = { id:string; name:string; logo_url:string; website_url:string; description:string; display_order:number; is_active:boolean; updated_at:string };
export function parsePartner(form:FormData, operatorId:string) {
 const name=String(form.get('name')??'').trim(),logo_url=String(form.get('logo_url')??'').trim(),website_url=String(form.get('website_url')??'').trim(),description=String(form.get('description')??'').trim();
 const order=String(form.get('display_order')??''),display_order=Number(order),is_active=form.get('is_active')==='on';
 if(!name||name.length>160)throw Error('Enter a partner name (up to 160 characters).');
 if(logo_url && (!safeWebsiteImage(logo_url) || (!logo_url.startsWith('/images/') && !new URL(logo_url).pathname.includes(`/website-media/${operatorId}/`))))throw Error('Choose a logo from this operator’s website media.');
 if(is_active&&!logo_url)throw Error('Add a logo before activating this partner.');
 if(website_url && (!safeSocialUrl(website_url)||website_url.length>2000))throw Error('Enter a valid HTTPS website URL.');
 if(description.length>300)throw Error('Keep the description within 300 characters.');
 if(!order.trim()||!Number.isInteger(display_order)||display_order<0||display_order>100000)throw Error('Enter a display order from 0 to 100000.');
 return {name,logo_url,website_url,description,display_order,is_active};
}
export function visiblePartners(partners:Partner[]) {
 return partners.filter(p=>p.is_active&&p.name.trim()&&safeWebsiteImage(p.logo_url)&&(!p.website_url||safeSocialUrl(p.website_url))).sort((a,b)=>a.display_order-b.display_order||a.id.localeCompare(b.id));
}
