import {registerHooks} from 'node:module';
import {PassThrough} from 'node:stream';
import {once} from 'node:events';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {JSDOM} from 'jsdom';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {HomepageStream}=await import('../../src/components/public/homepage-stream.tsx');
const {initialWebsiteContent}=await import('../../src/modules/content/website-schema.ts');

test('responsive hero hints flush while ancillary data is suspended, without preloading the carousel',{timeout:5000},async()=>{
 let finish;
 const pending=new Promise(resolve=>{finish=resolve;});
 function Delayed(){React.use(pending);return React.createElement('p',null,'Ancillary data resolved');}
 const output=new PassThrough();let html='';output.on('data',chunk=>{html+=chunk;});
 const first=once(output,'data'),ended=once(output,'end');
 const render=renderToPipeableStream(React.createElement('div',null,React.createElement(HomepageStream,{content:{...initialWebsiteContent,'hero.mobile':'/mobile.jpg','hero.desktop':'/desktop.jpg'}},React.createElement(Delayed))),{onShellReady(){render.pipe(output);},onError(error){output.destroy(error);}});
 try {
  await first;
  const dom=new JSDOM(html);
  try {
   const hints=[...dom.window.document.querySelectorAll('link[as="image"]')];
   assert.equal(hints.length,2);
   assert.deepEqual(hints.map(x=>x.media),['(max-width:599px)','(min-width:600px)']);
   assert.match(hints[0].getAttribute('imagesrcset'),/mobile/);
   assert.match(hints[1].getAttribute('imagesrcset'),/desktop/);
   assert.ok(dom.window.document.querySelector('main[aria-busy="true"]'));
   assert.doesNotMatch(html,/Ancillary data resolved/);
  } finally {dom.window.close();}
  finish();await ended;
  assert.match(html,/Ancillary data resolved/);
 } finally {finish();render.abort();}
});
