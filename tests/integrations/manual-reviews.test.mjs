import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseReview,reviewUrl} from '../../src/modules/content/reviews.ts';
const form=()=>{const f=new FormData();for(const [k,v] of Object.entries({author:' Test author ',body:'Exact text\n  with spacing ',source:'Google Maps',rating:'5',display_order:'0'}))f.set(k,v);return f;};
test('manual review parsing preserves exact wording and validates sources and optional fields',()=>{const f=form();assert.equal(parseReview(f).body,'Exact text\n  with spacing ');assert.equal(parseReview(f).published,false);f.set('rating','6');assert.throws(()=>parseReview(f));f.set('rating','5');f.set('review_date','2026-02-30');assert.throws(()=>parseReview(f));});
test('review links reject unsafe URLs and misleading Google destinations',()=>{assert.equal(reviewUrl(''),null);assert.equal(reviewUrl('https://maps.app.goo.gl/test',true),'https://maps.app.goo.gl/test');for(const s of ['javascript:alert(1)','http://google.com','https://google.com.evil.test','https://user:pass@google.com'])assert.throws(()=>reviewUrl(s,true));});
