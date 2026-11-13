import {chromium,webkit} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('docs/evidence/stops-cards-20261113'),results=[];
for(const [engine,type] of [['chrome',chromium],['webkit',webkit]]){
const browser=await type.launch(engine==='chrome'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}:{headless:true});
for(const width of [320,390,768,1440]){
const page=await browser.newPage({viewport:{width,height:900}});
await page.goto('http://127.0.0.1:3107/dev/stops-review');await page.getByLabel('Review placement').selectOption('home');await page.waitForTimeout(1200);
const rail=page.getByRole('list',{name:'Choose a destination'});await rail.scrollIntoViewIfNeeded();
await page.locator('section[aria-labelledby=review-stops-title]').screenshot({path:path.join(dir,`home-${engine}-${width}.png`)});
results.push({engine,width,home:await rail.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,cards:el.children.length,page:document.documentElement.scrollWidth,viewport:innerWidth}))});
await rail.getByRole('button').last().focus();await page.keyboard.press('Home');await page.keyboard.press('End');await page.keyboard.press('Enter');if(await rail.getByRole('button').last().getAttribute('aria-expanded')!=='true')throw Error('keyboard selection failed');
await page.getByRole('button',{name:'Missing images'}).click();await page.getByRole('button',{name:'Long labels'}).click();await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,`fallback-${engine}-${width}.png`),fullPage:true});
await page.goto('http://127.0.0.1:3107/dev/journey-panel');await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,`panel-${engine}-${width}.png`),fullPage:true});
await page.goto('http://127.0.0.1:4199/live-map.html?project=sightseeing-shkodra');await page.waitForFunction(()=>typeof stopRecords!=='undefined'&&stopRecords.length===5,{timeout:30000});await page.locator('#btn-stops').click();await page.waitForTimeout(500);
results.push({engine,width,drawer:await page.locator('.arrival-item').evaluateAll(els=>els.map(e=>({width:e.clientWidth,photo:e.querySelector('.stop-portrait').getBoundingClientRect().toJSON(),name:e.querySelector('.arrival-name').textContent}))) });
await page.screenshot({path:path.join(dir,`drawer-${engine}-${width}.png`),fullPage:true});
await page.evaluate(()=>{stopRecords[0].feature.properties.name='A long translated destination name that needs several lines on a narrow screen';stopRecords[0].feature.properties.photoUrl='';renderArrivalList();});
await page.screenshot({path:path.join(dir,`drawer-fallback-${engine}-${width}.png`),fullPage:true});
await page.locator('.arrival-item').last().scrollIntoViewIfNeeded();
if(await page.locator('#stop-arrivals-list').evaluate(e=>e.scrollWidth>e.clientWidth))throw Error('drawer overflow');
await page.locator('.arrival-item').first().click();if(await page.locator('#stops-panel').evaluate(e=>e.classList.contains('open')))throw Error('drawer did not close');
await page.locator('#btn-stops').click();await page.locator('#close-stops').click();await page.close();
}
await browser.close();}
await writeFile(path.join(dir,'results.json'),JSON.stringify(results,null,2));
