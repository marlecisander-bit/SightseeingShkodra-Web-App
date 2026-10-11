import { resolveWebsiteLink, retiredTourLink, type WebsiteContent } from './website-schema';

/** One CMS projection for both header layouts; first link owns duplicate targets. */
export function publicNavigation(content: WebsiteContent) {
 const items = [{href:'/',label:content['nav.home']}, ...[0,1,2,3,4].map(index => {
  const original = content[`nav.${index}.link`];
  const retired = retiredTourLink(original);
  const unified = ['/live','/route','/#route'].includes(original);
  const label = content[`nav.${index}.label`];
  return {href:unified?'/route':resolveWebsiteLink(original),label:(unified || retired) && ['Tour','The day tour','Route','Live map'].includes(label)?'Route & Live Map':label,retired:retired&&!original.includes('#')};
 })];
 const active=items.filter(item=>!('retired' in item&&item.retired));
 return active.filter((item,index)=>active.findIndex(other=>other.href===item.href)===index);
}

export function activeNavigation(pathname:string,hash:string,links:string[]):number{
 const normalized=pathname.replace(/\/$/,'')||'/';
 const anchor=links.findIndex(link=>{const [path,h]=link.split('#');return Boolean(h)&&path===normalized&&'#'+h===hash;});
 if(anchor>=0)return anchor;
 let selected=-1,length=-1;links.forEach((link,i)=>{if(link.includes('#'))return;const path=link.replace(/\/$/,'')||'/';if((normalized===path||(path!=='/'&&normalized.startsWith(path+'/')))&&path.length>length){selected=i;length=path.length;}});return selected;
}
