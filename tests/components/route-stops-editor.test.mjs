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
test('the route stop review lists published stops and linked destinations once without edit controls',()=>{const html=render();assert.ok(html.includes('Editorial name'));assert.ok(html.includes('Editorial alt'));assert.ok(html.includes('Original map stop A'));assert.ok(html.indexOf('Original map stop A')<html.indexOf('Original map stop B'));assert.ok(html.includes('No linked destination'));assert.ok(!html.includes('<button'));});
test('conflicting destination links remain visible for review',()=>{const html=render({records:[record,{...record,id:'conflict'}]});assert.ok(html.includes('More than one destination'));assert.ok(!html.includes('<button'));});
test('unavailable stop source directs staff to the destination editor',()=>{const html=render({stops:[],stopsAvailable:false});assert.ok(html.includes('temporarily unavailable'));assert.ok(html.includes('All destinations'));assert.ok(!html.includes('<button'));});
test('a draft reassociation remains visible for review',()=>{const html=render({records:[{...record,body:{...body,stopId:'map-b'}}]});assert.ok(html.includes('saved change to its stop link'));assert.ok(!html.includes('<button'));});
