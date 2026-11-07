import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAvailability,availabilityPresentation} from '../../src/modules/booking/product-availability.ts';
test('status defaults, old copy, structured month/day dates and action validation',()=>{
 const month=validateAvailability({state:'seasonal_break',reopening:{precision:'month',value:'2031-04'},actionUrl:'/route'});
 const result=availabilityPresentation({active:false,availability:month});
 assert.equal(result.label,'Seasonal break');assert.equal(result.reopening,'Expected to reopen in April 2031');assert.equal(result.actionLabel,'Explore the route');
 assert.equal(availabilityPresentation({active:false,unavailableMessage:'Saved old copy'}).message,'Saved old copy');
 assert.equal(availabilityPresentation({active:true,availability:month}).state,'available');
 assert.equal(availabilityPresentation({active:false,availability:{state:'sold_out'}}).label,'Sold out');
 assert.equal(availabilityPresentation({active:false,availability:{state:'temporarily_unavailable'}}).actionUrl,null);
 for(const value of ['2031-02-29','2031-04-31','0000-01-01'])assert.throws(()=>validateAvailability({state:'seasonal_break',reopening:{precision:'day',value}}));
 for(const actionUrl of ['javascript:alert(1)','//evil.com','https://user:pass@example.com','/route/../admin','https://example.com\\evil','https://example.com:bad'])assert.throws(()=>validateAvailability({state:'sold_out',actionUrl}));
 for(const actionUrl of ['/route','/explore/lake','https://example.com/route?x=1'])assert.equal(validateAvailability({state:'sold_out',actionUrl}).actionUrl,actionUrl);
 assert.equal(availabilityPresentation({active:false,availability:{...month,reopening:{precision:'month',value:'2001-04'}}}).state,'seasonal_break');
});
