import assert from 'node:assert/strict';
import {test} from 'node:test';

test('only exact retired ticket entry and bridge article have permanent relevant replacements', async () => {
 const {default:nextConfig}=await import('../../next.config.ts');
 const redirects=await nextConfig.redirects();
 assert.deepEqual(redirects,[
  {source:'/tickets',destination:'/book',permanent:true},
  {source:'/mes-bridge-shkodra',destination:'/explore/bridge',permanent:true},
 ]);
 const sources=new Set(redirects.map(r=>r.source));
 for(const r of redirects){assert.ok(!r.source.includes(':')&&!r.source.includes('*'));assert.ok(!sources.has(r.destination));}
 for(const path of ['/booking/manage','/book','/tickets/reservation/token','/api/public/checkout','/admin','/route','/wp-content/uploads/*','/*','/coming-soon','/shkodra-the-capital-of-a-thousand-punchlines','/the-eugene-pittard-exhibition-in-shkodra'])assert.ok(!sources.has(path));
});
