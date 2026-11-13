import {chromium} from '/Users/aleksandermarleci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const phase=process.argv[2]||'before';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});const results=[];
for(const width of [1440,1024,768,430,390,375,320]){
 await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:3107/dev/journey-panel');await page.getByRole('button',{name:'fresh',exact:true}).click();await page.waitForTimeout(200);
 const panel=page.getByRole('region',{name:'Van journey information'});
 results.push({width,height:(await panel.boundingBox()).height});
 if([1440,768,390,320].includes(width))await panel.screenshot({path:path.join(import.meta.dirname,`${phase}-${width}.png`)});
}
await writeFile(path.join(import.meta.dirname,phase+'-sizes.json'),JSON.stringify(results,null,2));await browser.close();
