/** Business identity only; boarding points are not asserted to be business addresses. */
export function businessStructuredData(origin:string,content:Record<string,string>){
 return {'@context':'https://schema.org','@type':'Organization','@id':origin+'/#organization',name:content['footer.business']||'Sightseeing Shkodra',url:origin+'/',logo:origin+'/brand/logo-color.svg',sameAs:['instagram','facebook'].map(key=>content['footer.social.'+key]).filter(url=>{try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password;}catch{return false;}})};
}
