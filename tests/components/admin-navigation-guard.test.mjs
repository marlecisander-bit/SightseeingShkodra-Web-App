import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {installAdminNavigationGuard} from '../../src/app/admin/admin-navigation-guard.ts';
test('dirty CMS state blocks client links and cross-page Back, while clean and modified navigation keep native behavior',async()=>{
 const dom=new JSDOM('<a id="next" href="/admin/fixture/reviews">Reviews</a><a id="tab" href="/admin/fixture/reviews" target="_blank">Preview</a>',{url:'http://localhost/admin/fixture/content'});const prior=globalThis.CustomEvent;globalThis.CustomEvent=dom.window.CustomEvent;const view=dom.window;const dispose=installAdminNavigationGuard(view);let dirty=true,blocked=0;
 const guard=e=>{if(dirty){e.preventDefault();blocked++;}};view.addEventListener('admin:before-navigation',guard);
 try{const next=view.document.querySelector('#next');const click=new view.MouseEvent('click',{bubbles:true,cancelable:true});next.dispatchEvent(click);assert.equal(click.defaultPrevented,true);assert.equal(blocked,1);await Promise.resolve();
 const modified=new view.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true});next.addEventListener('click',e=>e.preventDefault(),{once:true});next.dispatchEvent(modified);assert.equal(blocked,1);
 view.history.replaceState({fixture:true},'', '/admin/fixture/reviews');view.dispatchEvent(new view.PopStateEvent('popstate'));assert.equal(view.location.pathname,'/admin/fixture/content');assert.equal(blocked,2);
 dirty=false;const clean=new view.MouseEvent('click',{bubbles:true,cancelable:true});let reached=false;next.addEventListener('click',e=>{reached=true;e.preventDefault();},{once:true});next.dispatchEvent(clean);assert.equal(reached,true);assert.equal(blocked,2);
 }finally{dispose();view.removeEventListener('admin:before-navigation',guard);globalThis.CustomEvent=prior;await Promise.resolve();dom.window.close();}
});
