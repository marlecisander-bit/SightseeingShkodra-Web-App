import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicNavigation } from '../../src/modules/content/navigation.ts';
import { initialWebsiteContent } from '../../src/modules/content/website-schema.ts';
import { matchesPublicMapProject, publicMapBinding, publicMapUrl } from '../../src/modules/tracking/public-map-binding.ts';
import { getDestinationStops } from '../../src/modules/content/destination-stops-server.ts';

test('one navigation projection preserves custom labels and collapses retired route targets', () => {
  const original = publicNavigation(initialWebsiteContent);
  assert.equal(original.filter(item=>item.href==='/route').length,1);
  assert.equal(original.find(item=>item.href==='/route').label,'Route & Live Map');
  const edited={...initialWebsiteContent,'nav.1.label':'Follow your van','nav.3.label':'Later duplicate'};
  assert.equal(publicNavigation(edited).find(item=>item.href==='/route').label,'Follow your van');
  assert.equal(publicNavigation({...edited,'nav.1.link':'/credits'}).find(item=>item.href==='/route').label,'Later duplicate');
});

test('map summary cannot join a different project from the embedded map', async () => {
  assert.equal(new URL(publicMapUrl).origin,publicMapBinding.origin);
  assert.equal(new URL(publicMapUrl).searchParams.get('project'),publicMapBinding.project);
  assert.equal(matchesPublicMapProject(undefined),true);
  assert.equal(matchesPublicMapProject(publicMapBinding.project),true);
  assert.equal(matchesPublicMapProject('different-project'),false);
  const previous=process.env.LIVE_MAP_PROJECT_SLUG;
  try {
    process.env.LIVE_MAP_PROJECT_SLUG='different-project';
    assert.deepEqual(await getDestinationStops(process.env.PUBLIC_OPERATOR_ID??'fixture-operator'),{stops:[],available:false});
  } finally {
    if(previous===undefined)delete process.env.LIVE_MAP_PROJECT_SLUG;
    else process.env.LIVE_MAP_PROJECT_SLUG=previous;
  }
});
