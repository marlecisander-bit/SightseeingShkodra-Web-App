import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {productFeatureBadges} from '../../src/modules/booking/product-features.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {MobileAmenityIcons}=await import('../../src/components/public/mobile-amenity-icons.tsx');
test('mobile amenity disclosures use published features, a single portal, accessible toggles and keyboard dismissal',async()=>{
 const dom=new JSDOM('<div id="root"></div><button id="outside">Outside</button>',{url:'http://localhost/'}),saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','Node','Event','CustomEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 const features=productFeatureBadges({features:['multilingual_audio_guide','two_hours_ticket','air_conditioning','live_tracking','audio_guide','wifi','van_tour']});
 try{
  await act(()=>root.render(React.createElement(React.Fragment,null,React.createElement(MobileAmenityIcons,{features}),React.createElement(MobileAmenityIcons,{features:features.slice(0,1)}))));
  const groups=document.querySelectorAll('[data-mobile-amenities]'),buttons=groups[0].querySelectorAll('button');assert.equal(buttons.length,6);assert.equal(groups[1].querySelectorAll('button').length,1);
  assert.equal(document.querySelector('[role=tooltip]'),null);assert.equal(buttons[0].getAttribute('aria-label'),features[0].label);
  await act(()=>buttons[0].click());assert.equal(document.querySelectorAll('[role=tooltip]').length,1);assert.equal(document.querySelector('[role=tooltip]').textContent,features[0].label);assert.equal(buttons[0].getAttribute('aria-expanded'),'true');assert.equal(buttons[0].getAttribute('aria-describedby'),document.querySelector('[role=tooltip]').id);
  await act(()=>buttons[0].click());assert.equal(document.querySelector('[role=tooltip]'),null);
  await act(()=>buttons[1].click());await act(()=>groups[1].querySelector('button').click());assert.equal(document.querySelectorAll('[role=tooltip]').length,1);assert.equal(buttons[1].getAttribute('aria-expanded'),'false');
  await act(()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(document.querySelector('[role=tooltip]'),null);assert.equal(document.activeElement,groups[1].querySelector('button'));
  await act(()=>buttons[0].click());await act(()=>document.getElementById('outside').dispatchEvent(new window.Event('pointerdown',{bubbles:true})));assert.equal(document.querySelector('[role=tooltip]'),null);
  await act(()=>root.render(React.createElement(MobileAmenityIcons,{features:[]})));assert.equal(document.querySelector('[data-mobile-amenities]'),null);
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
