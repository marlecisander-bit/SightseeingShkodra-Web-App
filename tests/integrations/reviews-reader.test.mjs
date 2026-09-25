import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {readPublishedReviews} from '../../src/modules/content/reviews-server.ts';
test('public review reader scopes, filters, orders and limits at the database, without admin rows',async()=>{
 let requested=false;const client=createClient('https://review-test.invalid','test-only',{global:{fetch:async input=>{const u=new URL(String(input));assert.equal(u.searchParams.get('operator_id'),'eq.operator-test');if(u.pathname.endsWith('/review_settings'))return Response.json({display_limit:4,google_reviews_url:null,leave_review_url:null});requested=true;assert.equal(u.searchParams.get('published'),'eq.true');assert.equal(u.searchParams.get('deleted_at'),'is.null');assert.equal(u.searchParams.get('limit'),'4');assert.equal(u.searchParams.get('order'),'featured.desc,display_order.asc,created_at.desc,id.asc');assert(!u.searchParams.get('select').includes('external_id'));return Response.json([]);}}});
 const r=await readPublishedReviews(client,'operator-test');assert(requested);assert.deepEqual(r.reviews,[]);assert.equal(r.settings.display_limit,4);
});
