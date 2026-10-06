/** FAQ order is its position in the existing CMS array, not a second ordering source. */
export type FaqItem = {id:string;question:string;answer:string;active:boolean;answerSource:'text'|'product-inclusions'};
export function legacyFaq(content:Record<string,string>):FaqItem[] {
 return [
  ['book','Choose a date on the booking page to check available seats. Confirm online and pay at the meeting point.'],
  ['board','Use the live map for the current boarding points and route.'],
  ['fees',''],
  ['live','Open the live map for the latest reported location, GPS status and available arrival estimates.'],
 ].map(([id,answer])=>({id,question:content[`tourPage.faq${id[0].toUpperCase()}${id.slice(1)}`]??'',answer,active:true,answerSource:id==='fees'?'product-inclusions':'text'}));
}
export function parseFaq(raw:string):FaqItem[] {
 const items:unknown=JSON.parse(raw);
 if(!Array.isArray(items)||items.length>50)throw Error('Use at most 50 questions');
 const ids=new Set<string>();
 for(const item of items){
  if(!item||typeof item!=='object'||Object.keys(item).sort().join(',')!=='active,answer,answerSource,id,question' || typeof item.id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(item.id)||ids.has(item.id)||typeof item.active!=='boolean'||typeof item.question!=='string'||!item.question.trim()||item.question.length>300||typeof item.answer!=='string'||item.answer.length>4000||!['text','product-inclusions'].includes(item.answerSource)||item.answerSource==='text'&&!item.answer.trim())throw Error('Check FAQ questions and answers');
  ids.add(item.id);
 }
 return items;
}
export function websiteFaq(content:Record<string,string>):FaqItem[]{return content['faq.items']===undefined?legacyFaq(content):parseFaq(content['faq.items']);}
