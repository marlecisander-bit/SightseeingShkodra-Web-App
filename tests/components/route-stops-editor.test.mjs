import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
registerHooks({resolve(specifier,context,next){
 if(/(?:destination|website)-actions(?:\.ts)?$/.test(specifier))return {url:'data:text/javascript,'+encodeURIComponent('export async function saveDestination(){throw Error("No writes in presentation tests");} export async function uploadWebsiteImage(){throw Error("No uploads in presentation tests");}'),shortCircuit:true};
 return next(specifier,context);
},load(url,context,next){
 if(url.startsWith("data:text/javascript,"))return {format:"module",source:decodeURIComponent(url.split(",")[1]),shortCircuit:true};
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 if(url.endsWith('/destination-actions.ts'))return {format:'module',source:'export async function saveDestination(){throw Error("No writes in presentation tests");}',shortCircuit:true};
 if(url.endsWith('/website-actions.ts'))return {format:'module',source:'export async function uploadWebsiteImage(){throw Error("No uploads in presentation tests");}',shortCircuit:true};
 return next(url,context);
}});
const {RouteStopsEditor}=await import('../../src/app/admin/route-stops-editor.tsx');
const {blankDestination}=await import('../../src/modules/content/destinations.ts');
const stops=[{id:'map-a',label:'Original map stop A'},{id:'map-b',label:'Original map stop B'}];
const body={...blankDestination,stopId:'map-a',name:'Editorial name',image:'/images/lake.webp',alt:'Editorial alt'};
const record={id:'destination-a',body,published_body:body,status:'published',destination_order:99,updated_at:'stamp',destination_aliases:[]};
const render=props=>renderToStaticMarkup(React.createElement(RouteStopsEditor,{operatorId:'operator',records:[record],stops,stopsAvailable:true,...props}));
test('admin lists stable map stops with canonical editorial images and names, and setup for unmapped stops',()=>{const html=render();assert.ok(html.includes('Editorial name'));assert.ok(html.includes('Editorial alt'));assert.ok(html.includes('Live Map: Original map stop A'));assert.ok(html.indexOf('Editorial name')<html.indexOf('Original map stop B'));assert.ok(html.includes('Edit name &amp; image'));assert.ok(html.includes('Set up stop content'));assert.ok(!html.includes('<iframe'));assert.ok(!html.includes('type="number"'));});
test('ambiguous links block editing rather than choosing or overwriting a destination',()=>{const html=render({records:[record,{...record,id:'conflict'}]});assert.ok(html.includes('More than one destination'));assert.ok(!html.includes('Edit name &amp; image'));});
test('unavailable stop source preserves content and offers the canonical editor without inventing stops',()=>{const html=render({stops:[],stopsAvailable:false});assert.ok(html.includes('temporarily unavailable'));assert.ok(html.includes('/admin/operator/route-stops?view=destinations'));assert.ok(!html.includes('Edit name &amp; image'));assert.ok(!html.includes('Set up stop content'));});
test('a draft reassociation requires review instead of silently restoring the old association',()=>{const html=render({records:[{...record,body:{...body,stopId:'map-b'}}]});assert.ok(html.includes('saved change to its stop link'));assert.equal((html.match(/Edit name &amp; image/g)||[]).length,1);});
