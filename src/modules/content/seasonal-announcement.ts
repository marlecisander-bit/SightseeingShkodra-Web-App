import {plannerClock} from './day-planner';

// Editorial communication only: these values never control inventory or pricing.
export const seasonalDefaults:Record<string,string> = {
 'seasonal.enabled':'false',
 'seasonal.start':'2026-11-01','seasonal.end':'2027-04-30',
 'seasonal.title':'WINTER SEASON','seasonal.message':'Panoramic Tours Only',
 'seasonal.shortSeason':'Nov 2026 – Apr 2027','seasonal.season':'November 2026 – April 2027',
 'seasonal.learnMore':'Learn More','seasonal.popupTitle':'Winter Panoramic Sightseeing Tours',
 'seasonal.description':'Discover Shkodra on our relaxing 2-hour Panoramic Sightseeing Tour, featuring three scenic photo stops with 15 minutes at each location to explore, enjoy the views and take memorable pictures.',
 'seasonal.departuresLabel':'Daily Departures','seasonal.departures':'09:00 · 11:00 · 13:00',
 'seasonal.stopsLabel':'Photo Stops','seasonal.stops':'Shiroka & Lake Shkodra\nCathedral & Historic Center\nMesi Bridge',
 'seasonal.noticeLabel':'Important Information',
 'seasonal.notice':'During the winter season, only Panoramic Sightseeing Tours are available. Our regular Hop-On Hop-Off service returns in May 2027.',
 'seasonal.action':'Explore Tours','seasonal.close':'Close announcement',
};
export const seasonalLabels:Record<string,string>={enabled:'Enable seasonal announcement',start:'Start date (Europe/Tirane)',end:'End date, inclusive (Europe/Tirane)',title:'Ribbon title',message:'Ribbon message',shortSeason:'Desktop season label',season:'Popup season label',learnMore:'Learn more label',popupTitle:'Popup title',description:'Popup description',departuresLabel:'Departures heading',departures:'Departure times (separate with ·)',stopsLabel:'Photo stops heading',stops:'Photo stops (one per line)',noticeLabel:'Service notice heading',notice:'Service notice',action:'Explore tours label',close:'Close button accessible label'};
function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function validateSeasonalAnnouncement(content:Record<string,string>){
 if(!['true','false'].includes(content['seasonal.enabled']))throw Error('Choose On or Off for the seasonal announcement.');
 const start=content['seasonal.start'],end=content['seasonal.end'];
 if(!validDate(start)||!validDate(end)||start>end)throw Error('Choose valid announcement dates with the end on or after the start.');
 if(content['seasonal.stops'].split('\n').filter(s=>s.trim()).length>12)throw Error('Use at most 12 photo stops.');
}
export function seasonalActive(content:Record<string,string>,now=new Date()){
 const date=plannerClock(now).date;
 return content['seasonal.enabled']==='true'&&validDate(content['seasonal.start']??'')&&validDate(content['seasonal.end']??'')&&content['seasonal.start']<=date&&date<=content['seasonal.end'];
}
