import {chromium,webkit} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const engine=process.argv[2]||'chromium';const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,1024,768,430,390,375,320]){
 await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3107/dev/journey-panel');
 for(const state of ['fresh','arriving','stale','unavailable','loading','closed','long']){
  await page.getByRole('button',{name:state,exact:true}).click();const panel=page.getByRole('region',{name:'Van journey information'});
  const values=await panel.evaluate(e=>({height:e.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,text:e.innerText,clipped:[...e.querySelectorAll('h2,strong,p')].filter(n=>n.getClientRects().length).some(n=>n.scrollWidth>n.clientWidth+1)}));
  assert.equal(values.overflow,false);assert.equal(values.clipped,false);
  if(['stale','unavailable','loading','closed'].includes(state)){assert(!values.text.includes('● LIVE'));assert(values.text.includes('ETA unavailable'));assert.equal(await panel.locator('[aria-current=step]').count(),0);}
  if(state==='stale')assert(values.text.toLowerCase().includes('last known stop'));
  if(state==='fresh'){assert(values.text.toLowerCase().includes('next on route'));assert(values.text.includes('ETA unavailable'));}
  if(state==='arriving'){assert(values.text.toLowerCase().includes('next destination'));assert(values.text.includes('Arrival in 8 min'));}
  results.push({width,state,...values});
  if(width<1024){const toggle=panel.getByRole('button',{name:'View 5 stops'});await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await panel.getByRole('button',{name:/^Stop /}).count(),5);await panel.getByRole('button',{name:/^Stop 2:/}).click();assert(await page.getByText(/Selected stop: 2/).isVisible());await toggle.focus();await page.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'false');}
  if(width===320&&state==='long'){await panel.getByRole('button',{name:'View 5 stops'}).click();await panel.screenshot({path:path.join(import.meta.dirname,`${engine}-long-expanded-320.png`)});await panel.getByRole('button',{name:'View 5 stops'}).click();}
 }
}
assert.deepEqual(errors,[]);await writeFile(path.join(import.meta.dirname,engine+'-layout-results.json'),JSON.stringify(results,null,2));await browser.close();
