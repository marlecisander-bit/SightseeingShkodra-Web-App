import { safeWebsiteImage } from './website-schema';
export const reviewSources = ['Google Maps','Tripadvisor','Facebook','Direct','Other'] as const;
export type GuestReview = { id:string; author:string; rating:number; body:string; source:string; review_date:string|null; original_url:string|null; avatar_url:string|null; language:string|null; featured:boolean; display_order:number; published:boolean; updated_at:string };
export type ReviewSettings = { display_limit:number; google_reviews_url:string|null; leave_review_url:string|null };
export type ReviewSelection = { reviews:GuestReview[]; settings:ReviewSettings };
export const defaultReviewSettings:ReviewSettings = {display_limit:3,google_reviews_url:null,leave_review_url:null};
export function reviewUrl(value:string, googleOnly=false):string|null {
 if(!value.trim()) return null;
 try { const u=new URL(value); if(u.protocol!=='https:'||u.username||u.password||value.length>2000)throw Error();
 if(googleOnly && !(['google.com','www.google.com','maps.google.com','search.google.com','g.co','share.google','maps.app.goo.gl','g.page','goo.gl'].includes(u.hostname)))throw Error();
 return value; } catch {throw Error(googleOnly?'Use an HTTPS Google Maps or Google review link.':'Use a valid HTTPS original review URL.');}
}
export function parseReview(form:FormData) {
 const text=(key:string)=>String(form.get(key)??'');
 const author=text('author'),body=text('body'),source=text('source'),rating=Number(text('rating')),display_order=Number(text('display_order'));
 if(!author.trim()||author.length>160||!body.trim()||body.length>10000)throw Error('Enter a reviewer name and review text (up to 10,000 characters).');
 if(!reviewSources.includes(source as typeof reviewSources[number])||!Number.isInteger(rating)||rating<1||rating>5||!Number.isInteger(display_order)||display_order<0||display_order>100000)throw Error('Check source, rating and display order.');
 const date=text('review_date'); if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Enter a valid review date.');
 const avatar=text('avatar_url');if(avatar&&!safeWebsiteImage(avatar))throw Error('Use an uploaded image or existing Media Library image path.');
 const language=text('language');if(language&&!/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language))throw Error('Use a language code such as en or it.');
 return {author,body,source,rating,display_order,review_date:date||null,original_url:reviewUrl(text('original_url'),source==='Google Maps'),avatar_url:avatar||null,language:language||null,featured:form.get('featured')==='on',published:form.get('published')==='on'};
}
