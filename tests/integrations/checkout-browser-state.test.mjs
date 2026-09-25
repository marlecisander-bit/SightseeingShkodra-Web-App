import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clearCheckoutSession,freshBookingSelection,checkoutStorageKey} from '../../src/modules/booking/checkout-browser-state.ts';
test('reset only removes checkout data and uses the current Tirane date',()=>{
 const values=new Map([[checkoutStorageKey,'old booking'],['language','sq']]);Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{removeItem:key=>values.delete(key)}});
 try{clearCheckoutSession();assert.equal(values.has(checkoutStorageKey),false);assert.equal(values.get('language'),'sq');assert.deepEqual(freshBookingSelection(new Date('2030-06-01T22:30:00Z')),{date:'2030-06-02',guests:1,departureId:'',passengers:{adult:1,child:0,infant:0}});}finally{delete globalThis.sessionStorage;}
});
