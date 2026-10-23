import {test} from 'node:test';
import assert from 'node:assert/strict';
import {heroHeadlineParts} from '../../src/components/public/hero-headline.ts';
test('default and localized place labels split without changing punctuation or wording',()=>{assert.deepEqual(heroHeadlineParts('Discover Shkodra.'),{lead:'Discover',destination:'Shkodra.'});assert.deepEqual(heroHeadlineParts('Zbuloni Shkodër'),{lead:'Zbuloni',destination:'Shkodër'});assert.deepEqual(heroHeadlineParts('Découvrez la ville de Shkodra!'),{lead:'Découvrez la ville de',destination:'Shkodra!'});});
test('custom/long/localized headlines remain intact rather than highlighting an arbitrary word',()=>{for(const title of ['', 'A longer saved destination headline', '探索城市', 'Shkodra is beautiful', 'Discover Shkodrën'])assert.equal(heroHeadlineParts(title),null);});
