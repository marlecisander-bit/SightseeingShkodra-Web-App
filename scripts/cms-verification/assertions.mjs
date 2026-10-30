import {marker} from './fixtures.mjs';
export const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
export function cleanHtml(html){return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<input\b[^>]*>/gi,'');}
export function attribute(html,tag,name,value){return [...html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','g'))].some(m=>m[0].includes(name+'="'+escapeHtml(value)+'"'));}
function text(html,value){return cleanHtml(html).replace(/<[^>]*>/g,'').includes(escapeHtml(value));}
export function checkField(field,value,projection){
 const {key,kind}=field,html=projection.html??'';
 let ok;
 if(projection.metadata){const m=projection.metadata;ok=key.endsWith('.image')||key.endsWith('.seoImage')?m.openGraph.images[0].url===value:key.endsWith('.alt')||key.endsWith('.seoAlt')?m.openGraph.images[0].alt===value:key.endsWith('.title')||key.endsWith('.seoTitle')?m.title===value:m.description===value;}
 else if(key.endsWith('.showOnHomepage')){
  const match={hero:'id="home-hero"',route:'id="route"',live:'without the guesswork',departures:'id="journey-departures"',reviews:'aria-label="Guest reviews"',partners:'id="partners"'}[key.split('.')[0]];
  // Live flags are tested against a stable eyebrow supplied by the case runner.
  ok=key==='live.showOnHomepage'?!text(html,projection.visibilityMarker):!html.includes(match);
 }
 else if(kind==='publication')ok=html.includes('This page has not been published yet.')&&!text(html,projection.legalMarker);
 else if(key==='partners.ctaEnabled')ok=!attribute(html,'a','href','/book');
 else if(key==='whatsapp.enabled')ok=!html.includes('href="https://wa.me/');
 else if(key==='whatsapp.desktop'||key==='whatsapp.mobile')ok=attribute(html,'a','data-'+key.split('.')[1],'false')&&html.includes('href="https://wa.me/');
 else if(key==='whatsapp.number')ok=attribute(html,'a','href',`https://wa.me/${value.replace('+','')}?text=${encodeURIComponent(projection.message.trim())}`);
 else if(key==='whatsapp.message')ok=attribute(html,'a','href',`https://wa.me/${projection.phone.replace('+','')}?text=${encodeURIComponent(value)}`);
 else if(kind==='position')ok=html.includes((key.includes('mobile')?'--hero-mobile-position:':'--hero-desktop-position:')+value)&&(!key.includes('desktop')||html.includes('--hero-wide-position:right bottom'));
 else if(kind==='image')ok=[...html.matchAll(/<(?:img|source)\b[^>]*>/g)].some(m=>m[0].includes(value)||m[0].includes(encodeURIComponent(value)));
 else if(kind==='link'||kind==='external'||kind==='destination')ok=attribute(html,'a','href',value);
 else if(kind==='amenities')ok=text(html,JSON.parse(value)[0].title)&&!text(html,JSON.parse(value)[0].description);
 else if(kind==='faq')ok=text(html,JSON.parse(value)[0].question)&&text(html,JSON.parse(value)[0].answer);
 else if(key==='homeRoute.title')ok=text(html,value.replace('{count}','1'));
 else if(key.endsWith('.alt'))ok=attribute(html,'img','alt',value);
 else ok=text(html,value);
 return {status:ok?'PASS':'FAIL',limitation:kind==='position'?'CSS projection only; >=1600px center-to-bottom transformation is preserved, not certified as faithful crop.':null};
}
export function publicMarkerPresent(html,key){return text(html,marker(key));}
