import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingMoney,lowestQuotedFare,availabilityLabel,bookingDate,bookingCutoff,safeBookingFeedback} from '../../src/components/public/booking-presentation.ts';

test('discovery preserves cents and configured currency while totals retain precision',()=>{
 assert.equal(bookingMoney(1000,'EUR',true),'€10');
 assert.equal(bookingMoney(1050,'EUR',true),'€10.50');
 assert.equal(bookingMoney(1000,'EUR'),'€10.00');
 assert.match(bookingMoney(1000,'USD',true),/10/);
 assert.doesNotMatch(bookingMoney(1000,'USD',true),/€/);
});
test('date-scoped discovery reads supplied standard, varied and discount quotes without changing them',()=>{
 const fares=[1200,800,1000];assert.equal(lowestQuotedFare(fares),800);assert.deepEqual(fares,[1200,800,1000]);
 assert.equal(lowestQuotedFare([1000,1000]),1000);assert.equal(lowestQuotedFare([1250]),1250);
});
test('missing, corrupt or zero minimum uses availability fallback, never a misleading paid minimum',()=>{
 for(const values of [[],[NaN,Infinity,-1],[0],[0,1000]])assert.equal(lowestQuotedFare(values),undefined);
});
test('scarcity uses returned capacity and availability without changing bookability',()=>{
 assert.equal(availabilityLabel({remaining:8,available:true}),'Available');
 assert.equal(availabilityLabel({remaining:2,available:true}),'Only 2 left');
 assert.equal(availabilityLabel({remaining:2,available:false}),'Not enough seats');
 assert.equal(availabilityLabel({remaining:-1,available:false}),'Sold out');
 assert.equal(availabilityLabel({remaining:NaN,available:false}),'Unavailable');
});
test('calendar date and authoritative cutoff use explicit timezones across midnight',()=>{
 assert.equal(bookingDate('2026-09-29'),'Tue, 29 September 2026');
 assert.equal(bookingDate(''),'Choose a date');
 assert.equal(bookingCutoff('2026-09-28T22:45:00Z'),'29 Sept 2026, 00:45');
});

test('management feedback preserves mapped recovery messages and hides unexpected diagnostics',()=>{
 const messages={SOLD_OUT:'Your original booking is unchanged.',UNAVAILABLE:'Unable to confirm the result. Reload your booking.'};
 assert.equal(safeBookingFeedback(new Error(messages.SOLD_OUT),messages),messages.SOLD_OUT);
 for(const error of [new Error('database constraint internal_detail'),new TypeError('Failed to fetch'),new SyntaxError('Unexpected token'),null])assert.equal(safeBookingFeedback(error,messages),messages.UNAVAILABLE);
});

test('larger and fractional monetary values keep the authoritative amount',()=>{
 assert.equal(bookingMoney(10000,'EUR',true),'\u20ac100');
 assert.equal(bookingMoney(12050,'EUR'),'\u20ac120.50');
});
