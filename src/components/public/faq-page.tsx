import {websiteFaq} from '@/modules/content/faq';
import type {WebsiteContent} from '@/modules/content/website-schema';
export function FaqPage({content:c,inclusions}:{content:WebsiteContent;inclusions:string|null}){
 const items=websiteFaq(c).filter(item=>item.active);
 return <main id="main-content" className="p-subpage p-container p-narrow"><section id="faq" className="p-faq"><h1>{c['tourPage.faqTitle']}</h1>
  {items.map(item=><details key={item.id}><summary>{item.question}</summary><p style={{whiteSpace:'pre-line'}}>{item.answerSource==='product-inclusions'?(inclusions??'Ticket inclusions have not been published. Please confirm the details with staff.'):item.answer}</p></details>)}
  {!items.length&&<p>Questions and answers will be published here soon.</p>}
 </section></main>;
}
