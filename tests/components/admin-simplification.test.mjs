import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent,editableWebsiteSections} from '../../src/modules/content/website-schema.ts';
import {focalPositions} from '../../src/modules/content/hero-amenities.ts';
import {ownerStatus,ownerEmailStatus,imageUploadMessage} from '../../src/app/admin/presentation.ts';

// Presentation-only fixtures: no server action, authentication or database call can run.
registerHooks({resolve(specifier,context,next){
  if(/(?:^|\/)\w+-actions(?:\.ts)?$/.test(specifier))return {url:'data:text/javascript,'+encodeURIComponent('export const saveWebsiteSection=async()=>({error:"Fixture only"}), uploadWebsiteImage=async()=>({error:"Fixture only"}), saveReview=async()=>({error:"Fixture only"}), saveReviewSettings=async()=>({error:"Fixture only"});'),shortCircuit:true};
  if(specifier==='next/navigation')return {url:'data:text/javascript,'+encodeURIComponent('export const useRouter=()=>({refresh(){}});'),shortCircuit:true};
  return next(specifier,context);
},load(url,context,next){
  if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};
  if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
  if(url.includes('/next/navigation'))return {format:'module',source:'export const useRouter=()=>({refresh(){}});',shortCircuit:true};
  if(/\/app\/admin\/.*-actions\.ts$/.test(url)){
    const source=readFileSync(new URL(url),'utf8');
    const names=[...source.matchAll(/export async function (\w+)/g)].map(m=>m[1]);
    return {format:'module',source:names.map(name=>`export async function ${name}(){throw Error('No fixture mutations');}`).join('\n'),shortCircuit:true};
  }
  return next(url,context);
}});
const {WebsiteSectionEditor}=await import('../../src/app/admin/website-editor.tsx');
const {ReviewEditor}=await import('../../src/app/admin/reviews-editor.tsx');
const h=React.createElement, render=element=>renderToStaticMarkup(element);
const id='00000000-0000-4000-8000-000000000001';

test('every website section retains every submitted field and draft/publish actions',()=>{
  for(const section of editableWebsiteSections){
    const html=render(h(WebsiteSectionEditor,{operatorId:id,sectionId:section.id,content:initialWebsiteContent,values:initialWebsiteContent,stamp:'fixture',setValues(){}}));
    for(const field of section.fields)assert.ok(html.includes(`name="${field.key}"`),`${section.id}: ${field.key}`);
    assert.match(html,/<button(?=[^>]*name="operation")(?=[^>]*value="draft")[^>]*>/);assert.match(html,/<button(?=[^>]*name="operation")(?=[^>]*value="publish")[^>]*>/);
  }
});

test('hero uses readable position labels without changing stored CSS values or image references',()=>{
  const html=render(h(WebsiteSectionEditor,{operatorId:id,sectionId:'hero',content:initialWebsiteContent,values:initialWebsiteContent,stamp:'fixture',setValues(){}}));
  for(const position of focalPositions)assert.ok(html.includes(`value="${position}"`));
  assert.match(html,/value="center center"[^>]*>Center<\/option>/);
  assert.match(html,/type="hidden" name="hero.desktop" value="\/images\/lake.webp"/);
  assert.doesNotMatch(html,/Loading dimensions|Desktop crop|No original file-size|Advanced: image address/);
  assert.match(html,/<img[^>]+src="\/images\/lake.webp"/);
});

test('review image keeps its submitted address and preview while removing the storage-path label',()=>{
  const html=render(h(ReviewEditor,{operatorId:id,review:{id,author:'Fixture guest',rating:5,body:'A lovely visit.',source:'Direct',review_date:null,original_url:null,avatar_url:'/images/lake.webp',language:'en',featured:false,published:false,display_order:0,updated_at:'fixture'}}));
  assert.match(html,/type="hidden" name="avatar_url" value="\/images\/lake.webp"/);
  assert.match(html,/Replace image/);assert.match(html,/Remove image/);
  assert.match(html,/<option value="en" selected="">English<\/option>/);
  assert.doesNotMatch(html,/Media Library path/);
});

test('unknown statuses cannot expose raw internal codes and sent does not claim delivery',()=>{
  assert.equal(ownerStatus('awaiting_payment'),'Awaiting payment');
  for(const status of ['pending','awaiting_payment','paid','confirmed','cancelled','expired','partially_refunded','refunded','processing','failed','active','released','consumed'])assert.notEqual(ownerStatus(status),'Status unavailable',status);
  assert.equal(ownerStatus('internal_new_status'),'Status unavailable');
  assert.equal(ownerEmailStatus('accepted'),'Sent (arrival not confirmed)');
  assert.equal(ownerEmailStatus('internal_new_status'),'Status unavailable');
});

test('upload errors preserve actionable file advice without exposing infrastructure failures',()=>{
  assert.match(imageUploadMessage(new Error('This image is 9.0 MB. Choose a smaller image.')),/9.0 MB/);
  assert.doesNotMatch(imageUploadMessage(new Error('Storage bucket 403 at https://private.example')),/403|bucket|https/);
});
