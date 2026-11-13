import {chromium} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import bundle from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/lib/utilsBundle.js';
const SocketClient=bundle.ws,hmrSockets=[];
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,geolocation:{latitude:42.0693,longitude:19.5033},permissions:['geolocation']});const page=await context.newPage();
// Serve only this browser's Web App requests from local Next.js under an
// already-approved parent origin. The hosted companion and its security/bridge
// scripts and framing headers remain unmodified.
await page.route('https://www.sightseeingshkodra.com/**',async route=>{
 const original=new URL(route.request().url());
 const headers={...route.request().headers()};delete headers.origin;delete headers.referer;delete headers.host;
 const response=await route.fetch({url:'http://127.0.0.1:3107'+original.pathname+original.search,headers});
 await route.fulfill({response});
});
await page.routeWebSocket('wss://www.sightseeingshkodra.com/_next/hmr*',route=>{
 const url=new URL(route.url());url.protocol='ws:';url.host='127.0.0.1:3107';
 const socket=new SocketClient(url);hmrSockets.push(socket);socket.binaryType='arraybuffer';const pending=[];
 route.onMessage(data=>{if(socket.readyState===SocketClient.OPEN)socket.send(data);else pending.push(data);});
 socket.onopen=()=>{for(const data of pending)socket.send(data);};
 socket.onmessage=event=>route.send(typeof event.data==='string'?event.data:Buffer.from(event.data));
 socket.onclose=()=>route.close();route.onClose(()=>socket.close());
});
await page.goto('https://www.sightseeingshkodra.com/dev/journey-panel?map=live');await page.waitForTimeout(1500);
const iframe=page.locator('iframe[title="Sightseeing Shkodra live van map"]');const frame=await iframe.elementHandle().then(e=>e.contentFrame());await frame.locator('#btn-find-van img').waitFor();await frame.locator('.leaflet-tile-loaded').first().waitFor({timeout:30000});await page.waitForFunction(()=>!document.querySelector('[aria-label="Van journey information"]').textContent.includes('Connecting to the van'),{},{timeout:20000});
const sample=async()=>({iframe:await iframe.boundingBox(),map:await frame.evaluate(()=>({size:{x:map.getSize().x,y:map.getSize().y},canvas:{width:document.getElementById('map').clientWidth,height:document.getElementById('map').clientHeight},tiles:document.querySelectorAll('.leaflet-tile-loaded').length,timeOrigin:performance.timeOrigin}))});
const initial=await sample();await page.getByRole('button',{name:'View 5 stops'}).click();await page.waitForTimeout(300);const expanded=await sample();assert(expanded.iframe.y>initial.iframe.y);assert.equal(expanded.iframe.height,initial.iframe.height);assert.deepEqual(expanded.map.size,initial.map.size);assert.equal(expanded.map.timeOrigin,initial.map.timeOrigin);assert.equal(expanded.map.size.x,expanded.map.canvas.width);assert.equal(expanded.map.size.y,expanded.map.canvas.height);await page.getByRole('region',{name:'Van journey information'}).getByRole('button',{name:/^Stop 2:/}).click();await page.waitForTimeout(200);assert.equal(await frame.evaluate(()=>followVan),false);assert.equal(await frame.evaluate(()=>!!map._popup?.isOpen()),true);
await page.getByRole('button',{name:'View 5 stops'}).click();await page.waitForTimeout(100);const collapsed=await sample();assert.equal(collapsed.iframe.y,initial.iframe.y);
await page.getByRole('button',{name:'Interact with map',exact:true}).click();await frame.locator('#btn-route').click();assert.equal(await frame.locator('#btn-route').getAttribute('aria-pressed'),'true');await frame.locator('#btn-stops').click();await page.waitForTimeout(200);assert(await frame.locator('#stops-panel').evaluate(e=>e.classList.contains('open')));await frame.locator('#close-stops').click();await frame.locator('#btn-find-van').click();assert.equal(await frame.evaluate(()=>followVan),true);assert.equal(await frame.locator('#btn-find-van').getAttribute('aria-pressed'),'true');await frame.locator('#btn-find-me').click();await page.waitForTimeout(700);assert.equal(await frame.evaluate(()=>followVan),false);assert.equal(await frame.locator('#btn-find-me').getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'Done interacting',exact:true}).click();
const screenshots=[];
for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(500);const panel=page.getByRole('region',{name:'Van journey information'});await panel.locator('..').screenshot({path:path.join(import.meta.dirname,`result-${width}.png`)});const s=await sample();assert.equal(s.map.size.x,s.map.canvas.width);assert.equal(s.map.size.y,s.map.canvas.height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);screenshots.push({width,...s});}
await page.getByText('Map help',{exact:true}).click();
await page.getByRole('button',{name:'Reload map',exact:true}).click();await frame.waitForLoadState().catch(()=>{});await page.waitForFunction(()=>!document.querySelector('[aria-label="Van journey information"]').textContent.includes('Connecting to the van'),{},{timeout:20000});
await writeFile(path.join(import.meta.dirname,'map-integration.json'),JSON.stringify({initial,expanded,collapsed,screenshots,checks:['Original hosted companion loaded with tiles and original Find Van SVG','Route expansion/collapse moves the existing iframe without recreating it or changing its dimensions','Leaflet canvas matches its viewport before/after expansion and width changes','Expanded route stop selection reaches the existing v1 child handler and opens its popup','Interact/Done controls work','Find Van, Find Me with synthetic browser geolocation, full route and Stops controls remain usable','Map reload remains available','No horizontal page overflow'],notes:['Browser-local Web App proxy under its existing approved www.com parent origin. The hosted companion, framing headers and bridge remain unmodified.','No companion sources, GPS pipeline, database or hosted configuration changed.']},null,2));await browser.close();for(const socket of hmrSockets)socket.terminate();
