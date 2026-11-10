import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHomepageTimingSession,homepageTimingEnabled,timeHomepage} from '../../src/modules/diagnostics/homepage-server-timing.ts';

test('homepage timing is opt-in and forcibly disabled on Vercel Production',()=>{
 assert.equal(homepageTimingEnabled({}),false);
 assert.equal(homepageTimingEnabled({HOMEPAGE_SERVER_TIMING:'true',VERCEL_ENV:'production'}),false);
 assert.equal(homepageTimingEnabled({HOMEPAGE_SERVER_TIMING:'true',VERCEL_ENV:'preview'}),true);
 const value={private:'not logged'};
 assert.equal(timeHomepage('page',()=>value),value);
});
test('timing preserves results and failures while emitting fixed labels only',async()=>{
 let now=0;const events=[];
 const session=createHomepageTimingSession(e=>events.push(e),()=>now,'fixture');
 const secret={url:'https://private.invalid/token',customer:'secret'};
 now=10;assert.equal(session.run('page',()=>{now=15;return secret;}),secret);
 const error=new Error('private token');
 await assert.rejects(session.run('website.query',async()=>{now=30;throw error;}),e=>e===error);
 assert.equal(session.run('https://private.invalid/token',()=>secret),secret);
 assert.equal(events.length,4);
 assert.equal(events[1].durationMs,5);assert.equal(events[3].outcome,'rejected');
 assert(!JSON.stringify(events).includes('private'));assert(!JSON.stringify(events).includes('secret'));
 assert.equal(createHomepageTimingSession(()=>{throw Error('sink');}).run('page',()=>secret),secret);
});
test('nested concurrent operations retain distinct spans and measured waits',async()=>{
 let now=0;const events=[];const s=createHomepageTimingSession(e=>events.push(e),()=>now,'fixture');
 let resolveRead;const read=new Promise(resolve=>{resolveRead=resolve;});
 const first=s.run('website.query',()=>read);
 const second=s.run('page.publication.await',()=>first);
 now=80;resolveRead('same value');
 assert.deepEqual(await Promise.all([first,second]),['same value','same value']);
 assert.deepEqual(events.filter(e=>e.phase==='end').map(e=>e.durationMs),[80,80]);
 assert.equal(new Set(events.map(e=>e.span)).size,2);
});
