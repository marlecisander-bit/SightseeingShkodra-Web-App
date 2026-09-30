import type {WebsiteContent} from '@/modules/content/website-schema';
export function LegalPage({content,kind,preview=false}:{content:WebsiteContent;kind:'privacy'|'terms';preview?:boolean}){
 const text=content['legal.'+kind+'.text']??'',published=content['legal.'+kind+'.status']==='published'&&!!text.trim();
 return <main id="main-content" className="p-container p-legal-page"><h1>{kind==='privacy'?'Privacy Policy':'Terms & Conditions'}</h1>{(published||preview)&&text.trim()?<div className="p-legal-text">{text}</div>:<p>This page has not been published yet.</p>}</main>;
}
