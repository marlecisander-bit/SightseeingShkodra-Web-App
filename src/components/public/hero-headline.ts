/** Split only a recognizable destination at the end; keep arbitrary CMS translations intact. */
export function heroHeadlineParts(title:string){
 const match=title.match(/^(.*?\S)\s+(Shkodra|Shkodër)([.!?]?)$/iu);
 return match?{lead:match[1],destination:match[2]+match[3]}:null;
}
