import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {installForegroundRefresh} from '../../src/app/admin/foreground-refresh.ts';

test('foreground refresh deduplicates resume events, protects drafts and pending saves, and cleans up',()=>{
 const dom=new JSDOM('<form><input value="Saved"><select><option value="a">A</option><option value="b">B</option></select></form>',{url:'https://example.com/admin/fixture/products',pretendToBeVisual:true});
 const view=dom.window,doc=view.document;let visibility='visible',refreshes=0;
 Object.defineProperty(doc,'visibilityState',{get:()=>visibility});
 const dispose=installForegroundRefresh(view,()=>refreshes++);
 const resume=()=>{visibility='hidden';doc.dispatchEvent(new view.Event('visibilitychange'));visibility='visible';doc.dispatchEvent(new view.Event('visibilitychange'));view.dispatchEvent(new view.Event('focus'));};
 assert.equal(refreshes,0);resume();assert.equal(refreshes,1);
 assert.equal(view.location.pathname,'/admin/fixture/products');
 const input=doc.querySelector('input');input.value='Draft';resume();assert.equal(refreshes,1);assert.equal(input.value,'Draft');input.value='Saved';
 input.focus();resume();assert.equal(refreshes,1);input.blur();
 const select=doc.querySelector('select');select.value='b';resume();assert.equal(refreshes,1);select.value='a';
 const form=doc.querySelector('form');form.setAttribute('aria-busy','true');resume();assert.equal(refreshes,1);form.removeAttribute('aria-busy');
 const guard=e=>e.preventDefault();view.addEventListener('admin:before-navigation',guard);resume();assert.equal(refreshes,1);view.removeEventListener('admin:before-navigation',guard);
 resume();assert.equal(refreshes,2);
 visibility='hidden';view.dispatchEvent(new view.Event('focus'));assert.equal(refreshes,2);visibility='visible';
 view.dispatchEvent(new view.PageTransitionEvent('pageshow',{persisted:true}));assert.equal(refreshes,3);
 dispose();resume();assert.equal(refreshes,3);dom.window.close();
});
