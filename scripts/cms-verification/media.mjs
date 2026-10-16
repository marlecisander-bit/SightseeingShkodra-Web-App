/** Pure read-only diagnostics for supplied local snapshots. Never infer deletion safety. */
export function mediaReferences(snapshot,objects=[]){
 const uses=new Map();
 const canonical=value=>{if(value.startsWith('/images/'))return value.split(/[?#]/)[0];try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!u.pathname.includes('/storage/v1/object/public/website-media/'))return;return u.origin+u.pathname;}catch{return;}};
 function visit(value,path,depth=0){
  if(depth>40)throw Error('Snapshot nesting exceeds diagnostic limit.');
  if(typeof value==='string'){
   if(/^[\[{]/.test(value)){let parsed;try{parsed=JSON.parse(value);}catch{}if(parsed&&typeof parsed==='object'){visit(parsed,path+' (JSON)',depth+1);return;}}
   for(const candidate of [/^[\[{]/.test(value)?'':value,...(value.match(/https:\/\/[^\s"<>]+|\/images\/[^\s"<>]+/g)??[])]){const asset=canonical(candidate);if(asset){if(!uses.has(asset))uses.set(asset,new Set());uses.get(asset).add(path);}}

  }else if(Array.isArray(value))value.forEach((v,i)=>visit(v,path+'/'+i,depth+1));
  else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))visit(v,path+'/'+k.replaceAll('~','~0').replaceAll('/','~1'),depth+1);
 }
 visit(snapshot,'');
 const listed=new Set(objects.map(canonical).filter(Boolean));
 return {readOnly:true,deletionAllowed:false,coverage:'Only supplied snapshot and optional supplied object list. No hosted inventory, orphan proof or deletion safety claim.',assets:[...new Set([...uses.keys(),...listed])].sort().map(asset=>({asset,references:[...(uses.get(asset)??[])].sort(),listed:listed.has(asset),status:uses.has(asset)?'Referenced':'Not referenced in supplied snapshot; retain pending complete review'}))};
}
