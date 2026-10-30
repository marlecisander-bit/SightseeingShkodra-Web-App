import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
import {productFeatureOptions,productFeatureBadges} from '../../src/modules/booking/product-features.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {ProductAmenitiesInput}=await import('../../src/app/admin/product-amenities-input.tsx');
test('requested amenities have one air-conditioning option and explicitly selectable ticket labels',()=>{
 const labels=productFeatureOptions.map(f=>f.label);for(const text of ['Multilingual audioguide','2-hour ticket','Full-day ticket','Air conditioned','Live tracking','Hop on hop off'])assert(labels.includes(text));assert.equal(labels.filter(l=>/Air condition/i.test(l)).length,1);
 assert.deepEqual(productFeatureBadges({features:[]}),[]);assert.equal(productFeatureBadges({features:['live_tracking'],feature_icons:{live_tracking:'pin'}})[0].icon,'pin');
 const html=renderToStaticMarkup(React.createElement(ProductAmenitiesInput,{}));const dom=new JSDOM(html);assert.equal(dom.window.document.querySelectorAll('input[type="checkbox"]').length,productFeatureOptions.length);assert.equal(dom.window.document.querySelectorAll('input[type="checkbox"]:checked').length,0);assert(!dom.window.document.body.textContent.includes('Seat occupancy is controlled separately'));assert.equal(dom.window.document.querySelector('input[type=checkbox]').getAttribute('aria-label'),productFeatureOptions[0].label);dom.window.close();
});
test('amenity selection, mutually exclusive ticket labels and icon choice produce the product form payload',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();for(const name of ['window','document','navigator','HTMLElement','Node','Event','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 const checkbox=label=>[...document.querySelectorAll('input[type="checkbox"]')].find(i=>i.closest('label').textContent===label);
 try{
  await act(()=>root.render(React.createElement('form',null,React.createElement(ProductAmenitiesInput,{}))));
  await act(()=>checkbox('2-hour ticket').click());await act(()=>checkbox('Full-day ticket').click());assert.equal(checkbox('2-hour ticket').checked,false);assert.equal(checkbox('Full-day ticket').checked,true);
  await act(()=>checkbox('Multilingual audioguide').click());const picker=document.querySelector('[aria-label="Icon for Multilingual audioguide"]');assert.equal(picker.value,'languages');
  await act(()=>{picker.value='headphones';picker.dispatchEvent(new window.Event('change',{bubbles:true}));});
  const form=new dom.window.FormData(document.querySelector('form'));assert.deepEqual(form.getAll('features'),['full_day_ticket','multilingual_audio_guide']);assert.equal(JSON.parse(form.get('feature_icons')).multilingual_audio_guide,'headphones');
  await act(()=>checkbox('Multilingual audioguide').click());const next=new dom.window.FormData(document.querySelector('form'));assert.deepEqual(next.getAll('features'),['full_day_ticket']);assert.deepEqual(JSON.parse(next.get('feature_icons')),{full_day_ticket:'ticket'});
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
