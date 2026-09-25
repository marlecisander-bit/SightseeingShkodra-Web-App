export function activeNavigation(pathname:string,hash:string,links:string[]):number{
 const normalized=pathname.replace(/\/$/,'')||'/';
 const anchor=links.findIndex(link=>{const [path,h]=link.split('#');return Boolean(h)&&path===normalized&&'#'+h===hash;});
 if(anchor>=0)return anchor;
 let selected=-1,length=-1;links.forEach((link,i)=>{if(link.includes('#'))return;const path=link.replace(/\/$/,'')||'/';if((normalized===path||(path!=='/'&&normalized.startsWith(path+'/')))&&path.length>length){selected=i;length=path.length;}});return selected;
}
