import {chromium,webkit} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const engine=process.argv[2]||'chromium',phase=process.argv[3]||'after';
const browser=await (engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}));
const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(phase==='before'?'https://www.sightseeingshkodra.com/':'http://127.0.0.1:3107/dev/seasonal-announcement');await page.waitForTimeout(600);
const geometry=()=>page.evaluate(()=>{
 const hero=document.querySelector('#home-hero');const bg=hero.querySelector('picture img');const r=bg.getBoundingClientRect();
 return {hero:hero.getBoundingClientRect().height,bg:{width:r.width,height:r.height,transform:getComputedStyle(bg).transform},cards:[...hero.querySelectorAll('article')].map(e=>{const image=e.querySelector('.p-media'),box=image.getBoundingClientRect();return {width:box.width,height:box.height,cardHeight:e.getBoundingClientRect().height,count:e.querySelector('[data-visible-count]').dataset.visibleCount};})};
});
const initial=await geometry(),events=[];
// Controlled regression for JS resize handling. CSS viewport remains unchanged:
// this does not reproduce the iPhone browser chrome or rubber-band rendering.
for(const height of [800,844,600,667]){
 await page.evaluate(height=>{Object.defineProperty(window,'innerHeight',{configurable:true,value:height});Object.defineProperty(window.visualViewport,'height',{configurable:true,value:height});window.dispatchEvent(new Event('resize'));window.visualViewport.dispatchEvent(new Event('resize'));},height);
 await page.waitForTimeout(250);events.push({height,geometry:await geometry()});
}
if(phase==='after'){
 for(const event of events)assert.deepEqual(event.geometry,initial);
 await page.getByRole('button',{name:'Learn More',exact:true}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.waitForTimeout(300);assert.equal(await page.locator('.p-navigation').evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');await page.getByRole('button',{name:'Close menu',exact:true}).click();}
 if(engine==='chromium'){
  const cdp=await page.context().newCDPSession(page),card=await page.locator('#experiences article').first().boundingBox(),y=card.y+30;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y}]});
  for(const x of [260,210,160,110,60])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else await page.locator('[aria-label="Choose experience"] button').nth(1).click();
 await page.waitForTimeout(500);assert.equal(await page.locator('[aria-label="Choose experience"] button').nth(1).getAttribute('aria-current'),'true');assert.deepEqual(await geometry(),initial);
 await page.locator('#experiences article').nth(1).locator('[data-all-amenities]').click();assert.equal(await page.locator('dialog[open] li').count(),8);await page.getByRole('button',{name:'Close amenities'}).click();assert.deepEqual(await geometry(),initial);
 await page.screenshot({path:path.join(import.meta.dirname,`after-${engine}-second-card.png`)});
 const before=JSON.parse(await readFile(path.join(import.meta.dirname,'before-measurements.json'),'utf8'));
 const after=JSON.parse(await readFile(path.join(import.meta.dirname,'after-chromium-measurements.json'),'utf8'));
 for(let i=0;i<before.length;i++)assert.deepEqual(after[i].initial.cards,before[i].initial.cards);
}
assert.deepEqual(errors,[]);
await writeFile(path.join(import.meta.dirname,`${phase}-${engine}-toolbar.json`),JSON.stringify({engine,phase,initial,events,checks:phase==='after'?['Resize-event geometry stable','Ribbon dialog works','Menu cycles keep clean edge','Carousel selection works','All eight amenities remain available','Initial card/photo dimensions and counts equal baseline','No browser page exceptions']:[],limitation:'Resize events are simulated. Physical Safari toolbar/rubber-band behavior is not verified.'},null,2));await browser.close();
