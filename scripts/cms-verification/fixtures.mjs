import {initialWebsiteContent,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
export const marker=key=>'VERIFY_'+key.replace(/[^a-zA-Z]/g,'_');
export const amenity=(title='BASE amenity')=>({id:'90000000-0000-4000-8000-000000000099',title,icon:'headphones',description:'Historical amenity description',published:true,display_order:1,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'});
export const faq=(question='BASE question')=>[{id:'90000000-0000-4000-8000-000000000098',question,answer:'Synthetic answer',answerSource:'text',active:true}];
export function preparedContent(key=''){
 const c={...initialWebsiteContent,'partners.ctaEnabled':'true','partners.ctaUrl':'/book','whatsapp.enabled':'true','whatsapp.number':'+355681234567','hero.amenities':JSON.stringify([amenity()]),'faq.items':JSON.stringify(faq()),'legal.privacy.text':'BASE privacy','legal.privacy.status':'published','legal.terms.text':'BASE terms','legal.terms.status':'published'};
 for(const k of Object.keys(c))if(k.endsWith('.showOnHomepage'))c[k]='true';
 // Explicit precondition for duplicate-target slots; default suppression has a separate check.
 if(/^nav\.[03]\.label$/.test(key))c[key.replace('.label','.link')]='/credits';
 return validateWebsiteContent(c);
}
export function fixtureValue(field){
 const key=field.key,m=marker(key);
 switch(field.kind){
  case 'text':return key==='footer.year'?'2098':key==='homeRoute.title'?m+' {count}':m;
  case 'legal':return m+'\nSynthetic legal paragraph.';
  case 'image':return field.initial==='/images/castle.webp'?'/images/lake.webp':'/images/castle.webp';
  case 'position':return 'right center';
  case 'link':return '/credits';
  case 'destination':return '/faq';
  case 'external':return 'https://example.invalid/'+m;
  case 'phone':return '+355682345678';
  case 'amenities':return JSON.stringify([amenity(m)]);
  case 'faq':return JSON.stringify(faq(m));
  case 'publication':return 'unpublished';
  case 'visibility':case 'toggle':return 'false';
  default:throw Error('No fixture for field kind '+field.kind);
 }
}
