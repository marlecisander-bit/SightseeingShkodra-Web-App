// Run against actual Chrome measurements captured by the composition review.
// Usage: node scripts/check-mobile-hero-composition.mjs <after-layouts.json>
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
for(const width of [320,360,375,390,430,768,1280,1440])assert.ok(rows.some(r=>r.w===width),`Missing ${width}px evidence`);
for(const r of rows){
 assert.equal(r.overflow,false,`${r.w}×${r.h}: horizontal overflow`);
 assert.ok(r.following.y>=r.hero.bottom-.5,'Following section overlaps hero');
 if(r.w>=600)continue;
 assert.ok(r.hero.height>=r.h-.5,'Hero does not fill usable viewport');
 assert.ok(Math.abs(r.media.height-r.hero.height)<.5,'Photograph does not cover whole hero');
 assert.ok(r.pagination.bottom<=r.media.bottom,'Pagination outside photograph');
 assert.ok(r.cards[0].y>=r.subtitle.bottom+20,'Copy collides with carousel');
 assert.ok(r.cta.every(b=>b.height>=44),'Booking target too small');
 if(r.h>=800){assert.ok(r.cards[0].y>r.h*.4,'Carousel is not toward bottom');assert.ok(r.pagination.bottom<=r.h,'Ordinary tall-phone composition exceeds viewport');}
}
console.log(`PASS: ${rows.length} Chrome viewport measurements`);
