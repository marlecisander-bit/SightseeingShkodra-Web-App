import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {emptyHomepage} from '../../src/modules/content/homepage.ts';
import {websiteMetadata,editorialMetadata} from '../../src/modules/content/seo.ts';
import {whatsappLink} from '../../src/modules/content/whatsapp.ts';
import {blankDestination,destinationPlace} from '../../src/modules/content/destinations.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>String(key)})',shortCircuit:true};return next(url,context);}});
const {BookingProvider,Header}=await import('../../src/components/public/booking.tsx');
const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
const {Footer}=await import('../../src/components/public/ui.tsx');
const {ExploreView,GuideView}=await import('../../src/components/public/editorial-pages.tsx');
const {PageIntro}=await import('../../src/components/public/page-intro.tsx');
const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
const {FaqPage}=await import('../../src/components/public/faq-page.tsx');
const {LegalPage}=await import('../../src/components/public/legal-page.tsx');
const {WhatsAppContact}=await import('../../src/components/public/whatsapp-contact.tsx');
const {PartnersSection}=await import('../../src/components/public/partners-section.tsx');
const {GuestReviews}=await import('../../src/components/public/guest-reviews.tsx');
const h=React.createElement;
export const planner={date:'2030-06-01',title:'Synthetic planner',times:[],fares:[],stops:[{id:'fixture-stop',label:'Synthetic stop'}]};
export const place={id:'synthetic-guide',name:'BASE destination',text:'BASE destination text',detail:'BASE detail',image:'/images/lake.webp',alt:'BASE destination alt',link:'/explore/synthetic-guide',aliases:[],showOnPage:true,stopId:'fixture-stop',tag:'BASE destination tag'};
export const partner={id:'synthetic-partner',name:'BASE partner',logo_url:'/images/lake.webp',website_url:'https://example.invalid/partner',description:'BASE partner description',display_order:1,is_active:true,updated_at:''};
export const review={id:'synthetic-review',author:'BASE author',rating:5,body:'BASE review',source:'Other',original_url:'https://example.invalid/review',published:true,display_order:1};
const settings={display_limit:3,google_reviews_url:'https://example.invalid/reviews',leave_review_url:'https://example.invalid/write'};
export function homeData(){return {...emptyHomepage('ready'),heroFare:{amount:1000,currency:'EUR',date:'2030-06-01'},product:{id:'synthetic-product',slug:'synthetic-product',title:'BASE product',description:'BASE catalog description',inclusions:'Synthetic product inclusions',stops:[]}};}
export function render(component,props){return renderToStaticMarkup(h(BookingProvider,{preview:true},h(component,props)));}
export function renderConsumer(key,c,extra={}){
 if(key.startsWith('seo.'))return {route:'/',consumer:'websiteMetadata',metadata:websiteMetadata(c,true)};
 if(/^(bookPage|routePage|faqPage|explorePage)\.seo/.test(key)){const prefix=key.split('.')[0];return {route:{bookPage:'/book',routePage:'/route',faqPage:'/faq',explorePage:'/explore'}[prefix],consumer:'editorialMetadata',metadata:editorialMetadata('/fixture',prefix,c,true)};}
 if(key.startsWith('legal.'))return {route:key.includes('privacy')?'/privacy-policy':'/terms-and-conditions',consumer:'LegalPage',html:render(LegalPage,{content:c,kind:key.split('.')[1]})};
 if(key.startsWith('nav.'))return {route:'shared header',consumer:'Header',html:render(Header,{content:c,previewPathname:'/'})};
 if(key.startsWith('footer.'))return {route:'shared footer',consumer:'Footer',html:render(Footer,{content:c,previewPathname:'/',googleReviewsUrl:settings.google_reviews_url,homepageInvitationInContent:true})};
 if(key.startsWith('whatsapp.'))return {route:'shared public contact',consumer:'whatsappLink + WhatsAppContact',html:render(WhatsAppContact,{href:whatsappLink(c),label:c['whatsapp.label'],desktop:c['whatsapp.desktop']==='true',mobile:c['whatsapp.mobile']==='true'})};
 if(key.startsWith('partners.'))return {route:'/',consumer:'PartnersSection',html:render(PartnersSection,{content:c,partners:[partner]})};
 if(key.startsWith('routePage.'))return {route:'/route',consumer:'RouteJourney',html:render(RouteJourney,{content:c,initial:planner,places:[place]})};
 if(key.startsWith('explorePage.')||key==='labels.guide')return {route:'/explore',consumer:'ExploreView',html:render(ExploreView,{c,places:[place]})};
 if(/^(bookPage|dayPage)\./.test(key))return {route:key.startsWith('bookPage')?'/book':'/your-day',consumer:'PageIntro',html:render(PageIntro,{content:c,prefix:key.split('.')[0]})};
 if(key==='faq.items'||key==='tourPage.faqTitle')return {route:'/faq',consumer:'FaqPage',html:render(FaqPage,{content:c,inclusions:extra.inclusions??'Synthetic product inclusions'})};
 const html=render(HomepageView,{home:extra.home??homeData(),content:c,planner,places:[place],reviews:{reviews:[review],settings},partners:[partner]});
 return {route:'/',consumer:'HomepageView',html};
}
export function entityRender(kind,rows,c){
 if(kind==='partners')return render(PartnersSection,{content:c,partners:rows});
 if(kind==='reviews')return render(GuestReviews,{selection:{reviews:rows,settings},labels:c});
 const p=destinationPlace(rows[0]);return render(GuideView,{content:{title:p.name,text:p.story},place:p});
}
export function syntheticDestination(){return {...blankDestination,slug:'synthetic-guide',name:'VERIFY destination',tag:'Synthetic tag',text:'VERIFY description',detail:'VERIFY detail',story:'VERIFY story',image:'/images/castle.webp',alt:'VERIFY photo',seoTitle:'Synthetic SEO',seoDescription:'Synthetic SEO description',stopId:'fixture-stop'};}
