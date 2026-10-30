import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {hasPermission} from '../../src/modules/identity/roles.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {BookingDeletionForm}=await import('../../src/app/admin/booking-deletion-form.tsx');
test('only owner receives permanent deletion permission',()=>{assert(hasPermission('owner','bookings.delete'));for(const role of ['admin','operations','content_editor',null,'unknown'])assert.equal(hasPermission(role,'bookings.delete'),false);});
test('permanent deletion requires typed reference, reason and explicit acknowledgement; financial history is explained',()=>{
 const html=renderToStaticMarkup(React.createElement(BookingDeletionForm,{reference:'SS-TEST',action:async()=>{}}));const d=new JSDOM(html).window.document;
 for(const name of ['reference','reason','confirm'])assert(d.querySelector(`[name=${name}][required]`));
 assert.equal(d.querySelector('[name=reference]').getAttribute('autocomplete'),'off');assert.match(d.body.textContent,/SS-TEST/);assert.match(d.body.textContent,/Payment, refund and audit history remain/);assert.match(d.body.textContent,/cannot be undone/);assert(!d.querySelector('form').getAttribute('action'));
});
