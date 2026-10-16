import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {retainedCatalogPresentationKeys} from '../../src/modules/content/catalog-fields.ts';
// Read-only composition only; server loaders/actions cannot run in this synthetic renderer.
registerHooks({resolve(specifier,c,next){
 const exports=specifier.endsWith('/supabase-server')?'createSessionClient':specifier.endsWith('/require-permission')?'requirePermission':specifier==='./catalog-actions'?'saveCatalog':null;
 if(exports)return {url:'data:text/javascript,'+encodeURIComponent(`export const ${exports}=()=>{throw Error('No fixture server calls');};`),shortCircuit:true};
 return next(specifier,c);
},load(url,c,next){
 if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 return next(url,c);
}});
const {CatalogRecordEditor}=await import('../../src/app/admin/catalog-panel.tsx');
test('actual new and existing product forms omit all four retired controls and values, retaining active controls',()=>{
 const historical={title:'Existing ticket',slug:'existing-ticket',type:'van_tour',status:'published',inclusions:'Approved inclusions',...Object.fromEntries(retainedCatalogPresentationKeys.map(key=>[key,'HISTORICAL_'+key]))};
 for(const row of [{...historical,id:'synthetic-product'},{...historical,id:''}]){
  const html=renderToStaticMarkup(React.createElement(CatalogRecordEditor,{entity:'product',row,operatorId:'synthetic',suppliers:[]}));const dom=new JSDOM(html);
  try{const controls=[...dom.window.document.querySelectorAll('input,select,textarea')].map(e=>e.name);for(const key of retainedCatalogPresentationKeys){assert.ok(!controls.includes(key),key);assert.ok(!html.includes('HISTORICAL_'+key),key);}
   for(const key of ['title','status','inclusions','supplier_id'])assert.ok(controls.includes(key),key);
   assert.ok(html.includes('Public page search titles and social images are managed in Website'));assert.ok(!html.includes('required by current validator'));
  }finally{dom.window.close();}
 }
});
