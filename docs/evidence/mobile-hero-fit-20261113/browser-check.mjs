import {chromium} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const dir=import.meta.dirname;const phase=process.argv[2]||'before';const results=[];for(const [w,h] of [[375,667],[390,844],[430,932],[360,800],[568,320],[768,1024],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.goto('http://127.0.0.1:3107/dev/seasonal-announcement');await page.waitForTimeout(700);if(phase==='after'){
 const checks=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('#experiences article')];
  return {overflow:document.documentElement.scrollWidth>innerWidth,heroBottom:document.querySelector('#home-hero').getBoundingClientRect().bottom,
   cards:cards.map(card=>{const body=card.querySelector('h3').parentElement;const parts=[...body.children].filter(e=>getComputedStyle(e).display!=='none');return {height:card.getBoundingClientRect().height,bottom:card.getBoundingClientRect().bottom,collisions:parts.slice(1).some((e,i)=>e.getBoundingClientRect().top<parts[i].getBoundingClientRect().bottom-1),clipped:[...card.querySelectorAll('h3,p')].filter(e=>e.getClientRects().length).some(e=>e.scrollHeight>e.clientHeight+1)};})};
 });
 assert.equal(checks.overflow,false);
 assert.equal(checks.cards[0].height,checks.cards[1].height);
 if(w<600){for(const c of checks.cards){assert.equal(c.collisions,false);assert.equal(c.clipped,false);if(h>600)assert(c.bottom<=h);}if(h>600)assert(Math.abs(checks.heroBottom-h)<1);}
}
await page.screenshot({path:path.join(dir,`${phase}-${w}x${h}.png`)});results.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],hero:document.querySelector('#home-hero').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('#experiences article')].map(e=>({rect:e.getBoundingClientRect().toJSON(),count:e.querySelector('[data-visible-count]')?.dataset.visibleCount,cta:e.querySelector('button.p-button-booking, a.p-button-booking, [class*=__statusPanel]')?.getBoundingClientRect().toJSON()}))})));}writeFileSync(path.join(dir,phase+'-measurements.json'),JSON.stringify(results,null,2));await browser.close();})();
