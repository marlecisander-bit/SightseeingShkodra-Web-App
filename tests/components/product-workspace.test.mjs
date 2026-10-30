import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {productDraft,productWebsiteState} from '../../src/modules/booking/product-workspace.ts';
import {safeAdminReturn} from '../../src/modules/notifications/contracts.ts';
import {installAdminNavigationGuard} from '../../src/app/admin/admin-navigation-guard.ts';
const id='10000000-0000-4000-8000-000000000020',op='10000000-0000-4000-8000-000000000001';
const p={id,title:'Live title',inclusions:'Live inclusions',supplier_id:null,status:'published',card_published:{enabled:true,image:'/images/lake.webp',alt:'Lake',description:'Live',order:1},card_draft:{enabled:true,image:'/images/castle.webp',alt:'Castle',description:'Draft',order:1},editor_draft:{title:'Draft title'}};
test('unified workspace distinguishes private edits, paused sales and homepage readiness',()=>{
 const d=productDraft(p);assert.equal(d.title,'Draft title');assert.equal(d.card.image,'/images/castle.webp');assert.equal(p.title,'Live title');assert.equal(p.card_published.image,'/images/lake.webp');
 assert.equal(productWebsiteState(p,[]),'Published on homepage');assert.equal(productWebsiteState({...p,status:'draft'},[]),'Sales paused');assert.equal(productWebsiteState({...p,status:'draft',card_published:null},['Add photo']),'Needs setup');assert.equal(productWebsiteState({...p,card_published:null},[]),'Not on homepage');
});
test('product sign-in handoffs preserve only validated product and tab selectors',()=>{
 const url=`/admin/${op}/products?product=${id}&tab=schedule`;assert.equal(safeAdminReturn(url),url);assert.equal(safeAdminReturn(url+'&next=https://evil.invalid'),'/admin');assert.equal(safeAdminReturn(url+'&product='+id),'/admin');assert.equal(safeAdminReturn(`/admin/${op}/products?tab=unknown`),'/admin');
});
test('unsaved product guards intercept same-route tab and product changes',async()=>{
 const dom=new JSDOM(`<a id="tab" href="?product=${id}&tab=website">Website</a><a id="product" href="?product=${op}">Other product</a>`,{url:`http://localhost/admin/${op}/products?product=${id}&tab=details`});const saved=globalThis.CustomEvent;globalThis.CustomEvent=dom.window.CustomEvent;
 const stop=installAdminNavigationGuard(dom.window);const guard=e=>e.preventDefault();dom.window.addEventListener('admin:before-navigation',guard);
 try{for(const selector of ['tab','product']){const e=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0});dom.window.document.getElementById(selector).dispatchEvent(e);assert.equal(e.defaultPrevented,true);}}finally{stop();globalThis.CustomEvent=saved;dom.window.close();}
});
