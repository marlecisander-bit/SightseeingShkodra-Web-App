import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {HomepageHero}=await import('../../src/components/public/homepage-hero.tsx');
const {preloadHomepageHero}=await import('../../src/components/public/homepage-hero-images.ts');
const {initialWebsiteContent}=await import('../../src/modules/content/website-schema.ts');
const {ReviewCard}=await import('../../src/components/public/guest-reviews.tsx');
test('server hero preload matches picture candidates with mutually exclusive mobile and desktop media',()=>{
 const content={...initialWebsiteContent,'hero.desktop':'/desktop.jpg','hero.mobile':'/mobile.jpg'};
 function Hero(){preloadHomepageHero(content);return React.createElement(HomepageHero,{content});}
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(Hero))),d=dom.window.document;
 try{const hints=[...d.querySelectorAll('link[rel="preload"][as="image"]')];assert.equal(hints.length,2);
 const image=d.querySelector('picture img'),source=d.querySelector('picture source');
 assert.equal(hints[0].media,'(max-width:599px)');assert.equal(hints[1].media,'(min-width:600px)');
 assert.equal(hints[0].getAttribute('imagesrcset'),source.srcset);assert.equal(hints[1].getAttribute('imagesrcset'),image.srcset);
 for(const hint of hints)assert.equal(hint.getAttribute('imagesizes'),'100vw');assert.equal(image.getAttribute('loading'),'eager');assert.equal(image.getAttribute('fetchPriority'),'high');
 }finally{dom.window.close();}
});
test('review rating is actual accessible text and stars stay decorative',()=>{
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(ReviewCard,{review:{id:'fixture',rating:5,body:'Review',author:'Guest',source:'Fixture'}})));
 try{const rating=dom.window.document.querySelector('article > p');assert.equal(rating.hasAttribute('aria-label'),false);assert.match(rating.textContent,/5 out of 5 stars/);assert.equal(rating.querySelector('[aria-hidden="true"]').textContent,'★★★★★');}finally{dom.window.close();}
});
test('priority experience hint matches its responsive image while later media remain lazy',async()=>{
 const {Media}=await import('../../src/components/public/ui.tsx');
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(Media,{src:'/ticket.jpg',alt:'Ticket',priority:true,sizes:'88vw'}),React.createElement(Media,{src:'/later.jpg',alt:'Later',sizes:'88vw'}))));
 try{const d=dom.window.document,images=d.querySelectorAll('img'),hint=d.querySelector('link[rel="preload"][as="image"]');assert.ok(hint);assert.equal(hint.getAttribute('imagesrcset'),images[0].srcset);assert.equal(hint.getAttribute('imagesizes'),images[0].sizes);assert.equal(hint.getAttribute('fetchpriority'),'high');assert.equal(images[1].getAttribute('loading'),'lazy');}finally{dom.window.close();}
});
