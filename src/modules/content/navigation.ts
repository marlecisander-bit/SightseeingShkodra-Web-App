import { resolveWebsiteLink, retiredTourLink, type WebsiteContent } from './website-schema';

/** One CMS projection for both header layouts; first link owns duplicate targets. */
function navigationCandidates(content: WebsiteContent) {
 const items = [{href:'/',label:content['nav.home']}, ...[0,1,2,3,4].map(index => {
  const original = content[`nav.${index}.link`];
  const retired = retiredTourLink(original);
  const unified = ['/live','/route','/#route'].includes(original);
  const label = content[`nav.${index}.label`];
  return {href:unified?'/route':resolveWebsiteLink(original),label:(unified || retired) && ['Tour','The day tour','Route','Live map'].includes(label)?'Route & Live Map':label,retired:retired&&!original.includes('#')};
 })];
 return items;
}
export function publicNavigation(content: WebsiteContent) {
 const items=navigationCandidates(content);
 const active=items.filter(item=>!('retired' in item&&item.retired));
 return active.filter((item,index)=>active.findIndex(other=>other.href===item.href)===index);
}

export function activeNavigation(pathname:string,hash:string,links:string[]):number{
 const normalized=pathname.replace(/\/$/,'')||'/';
 const anchor=links.findIndex(link=>{const [path,h]=link.split('#');return Boolean(h)&&path===normalized&&'#'+h===hash;});
 if(anchor>=0)return anchor;
 let selected=-1,length=-1;links.forEach((link,i)=>{if(link.includes('#'))return;const path=link.replace(/\/$/,'')||'/';if((normalized===path||(path!=='/'&&normalized.startsWith(path+'/')))&&path.length>length){selected=i;length=path.length;}});return selected;
}

/** Uses the same normalization as the public header; diagnostics never change saved links. */
export function navigationDiagnostics(content: WebsiteContent) {
 const seen=new Map<string,string>();
 return navigationCandidates(content).map((item,index)=>{
  const control=index===0?'nav.home':`nav.${index-1}.label`;
  const retired='retired' in item&&item.retired;
  const duplicateOf=retired?undefined:seen.get(item.href);
  if(!retired&&!duplicateOf)seen.set(item.href,control);
  return {...item,control,visible:!retired&&!duplicateOf,warning:retired?'Retired Tour destination is omitted.':duplicateOf?`Duplicate destination; ${duplicateOf} supplies the visible link.`:null};
 });
}
