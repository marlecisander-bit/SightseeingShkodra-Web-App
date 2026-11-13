import {chromium} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='http://127.0.0.1:3107/dev/seasonal-announcement';
const geometry=()=>page.evaluate(()=>({hero:document.querySelector('#home-hero').getBoundingClientRect().toJSON(),cards:[...document.querySelectorAll('#experiences article')].map(e=>e.getBoundingClientRect().toJSON())}));
await page.goto(url);await page.waitForTimeout(500);
await page.getByRole('button',{name:'Learn More'}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
const initial=await geometry();
for(let i=0;i<3;i++){
 await page.getByRole('button',{name:'Open menu',exact:true}).click();
 assert.equal(await page.locator('.p-navigation').evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');
 await page.getByRole('button',{name:'Close menu',exact:true}).click();
}
assert.deepEqual(await geometry(),initial);
const touch=await page.context().newCDPSession(page);
const rail=await page.locator('#experiences article').first().boundingBox();
const y=rail.y+30;
await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y}]});
for(const x of [260,210,160,110,60])await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await page.waitForTimeout(600);
assert.equal(await page.getByRole('button',{name:'Show Hop On Hop Off - Daily Ticket',exact:true}).getAttribute('aria-current'),'true');
await page.getByRole('button',{name:'All amenities for Hop On Hop Off - Daily Ticket'}).click();await page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'All amenities',exact:true})}).waitFor();
assert.equal(await page.locator('dialog[open] li').count(),8);
await page.getByRole('button',{name:'Close amenities'}).click();assert.equal(await page.locator('dialog[open]').count(),0);
await page.goto(url+'?off=1');await page.waitForTimeout(500);assert.deepEqual(await geometry(),initial);
// A wrapped/long announcement must remain readable through its scrollable band
// without moving hero content or changing header geometry.
await page.goto(url);await page.waitForTimeout(500);
await page.locator('[aria-label="Seasonal announcement"]>span:last-child').evaluate(e=>e.prepend(document.createTextNode('A longer translated seasonal announcement. '.repeat(5))));
assert.deepEqual(await geometry(),initial);
await page.locator('[aria-label="Seasonal announcement"]').evaluate(e=>e.scrollTop=e.scrollHeight);
assert.equal(await page.getByRole('button',{name:'Learn More'}).isVisible(),true);
// Dynamic viewport changes emulate available-height changes, not Safari toolbar chrome.
for(const height of [744,844,744,844]){
 await page.setViewportSize({width:390,height});await page.goto(url);await page.waitForTimeout(500);
 const g=await geometry();assert(Math.abs(g.hero.bottom-height)<1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const cta=page.locator('#experiences article').first().locator('button.p-button-booking');
 const box=await cta.boundingBox();assert(box.y+box.height<=height);
}
const before=JSON.parse(await readFile(new URL('./before-measurements.json',import.meta.url),'utf8'));
const after=JSON.parse(await readFile(new URL('./after-measurements.json',import.meta.url),'utf8'));
for(const width of [768,1440]){const a=after.find(x=>x.viewport[0]===width),b=before.find(x=>x.viewport[0]===width);assert.deepEqual(a.hero,b.hero);assert.deepEqual(a.cards.map(c=>c.rect),b.cards.map(c=>c.rect));}
await page.goto('https://www.sightseeingshkodra.com/');await page.waitForTimeout(500);await page.screenshot({path:new URL('./live-before-390x844.png',import.meta.url).pathname});
assert.deepEqual(errors,[]);
await writeFile(new URL('./interaction-results.json',import.meta.url),JSON.stringify({passed:['Seasonal dialog open/close','Three menu cycles with clean bottom border and stable geometry','Native touch swipe changes carousel selection','All amenities dialog contains all eight configured amenities','Ribbon on/off leaves hero and cards in identical positions','Long wrapped ribbon has no geometry shift','390px viewport height cycles 744/844 retain visible CTA','No horizontal page overflow','Tablet and desktop geometry unchanged','No browser page exceptions'],limitations:['Chromium viewport resizing does not reproduce Safari browser toolbar chrome.','Synthetic preview disables booking action; existing booking renderer/context tests cover links and dialog behavior.']},null,2));
await browser.close();
