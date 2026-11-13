import {chromium,webkit} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const phase=process.argv[2]||'before';
const engine=process.argv[3]||'chromium';
const browser=await (engine==='webkit'?webkit.launch({headless:true}):chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}));
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const results=[];
for(const [width,height]of [[375,667],[390,844],[430,932],[360,800],[320,568],[568,320],[768,1024],[1440,900],[844,390]]){
 await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:3107/dev/seasonal-announcement');await page.waitForTimeout(500);
 const sample=()=>page.evaluate(()=>{
  const hero=document.querySelector('#home-hero');const bg=hero.querySelector('picture img');const nav=document.querySelector('.p-header');const ribbon=document.querySelector('[aria-label="Seasonal announcement"]');
  const info=e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,transform:c.transform,position:c.objectPosition,fit:c.objectFit};};
  return {size:[innerWidth,innerHeight],scrollY,heroHeight:hero.getBoundingClientRect().height,heroTop:hero.getBoundingClientRect().top+scrollY,headingTop:hero.querySelector('h1').getBoundingClientRect().top+scrollY,header:{y:nav.getBoundingClientRect().top,height:nav.getBoundingClientRect().height},ribbon:{y:ribbon.getBoundingClientRect().top,height:ribbon.getBoundingClientRect().height},bg:info(bg),cards:[...document.querySelectorAll('#experiences article')].map(e=>({rect:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},image:info(e.querySelector('.p-media img')),count:e.querySelector('[data-visible-count]').dataset.visibleCount})),overflow:document.documentElement.scrollWidth>innerWidth};
 });
 const initial=await sample();await page.screenshot({path:path.join(import.meta.dirname,`${phase}-${engine}-${width}x${height}.png`)});
 const scroll=[];for(const y of [15,45,100,180,400,80,0]){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(y===400?40:120);scroll.push(await sample());}
 if(phase==='after'){
  assert.equal(initial.overflow,false);
  if(width<600){assert.equal(initial.bg.transform,'none');assert(initial.ribbon.y<initial.header.y);assert(Math.abs(initial.ribbon.y+initial.ribbon.height-initial.header.y)<1);assert(initial.headingTop>=initial.header.y+initial.header.height);}
  for(const s of scroll){assert.deepEqual(s.bg,initial.bg);assert.deepEqual(s.cards,initial.cards);assert.equal(s.overflow,false);}
 }
 results.push({initial,scroll});
}
await writeFile(path.join(import.meta.dirname,phase+'-'+engine+'-measurements.json'),JSON.stringify(results,null,2));await browser.close();
