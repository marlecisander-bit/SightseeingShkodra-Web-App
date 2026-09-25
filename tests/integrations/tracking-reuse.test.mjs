import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { classify, stoppedAt } from "../../src/modules/tracking/tracking-state.ts";
import { projectPublishedMap } from "../../src/modules/tracking/published-map.ts";

test("ported GPS health and stop context match the supplied app across freshness boundaries", () => {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(new URL("../../docs/source/tracking/tracking-state.js.txt", import.meta.url), "utf8"), context);
  const original = context.trackingState;
  const time = Date.parse("2030-01-01T10:00:00Z");
  for (const movement of ["MOVING", "STATIONARY", "PARKED_AT_STOP", "invalid"]) {
    for (const age of [-60001, -60000, 0, 20000, 20001, 120000, 120001]) {
      const position = { source_recorded_at: new Date(time).toISOString(), movement_state: movement, current_stop_number: 0, current_stop_name: "Stop", reported_stopped: true, reported_stop_number: 2, reported_stop_name: "Previous stop" };
      assert.equal(classify(position, time + age), original.classify(position, time + age));
      assert.equal(JSON.stringify(stoppedAt(position, time + age)), JSON.stringify(original.stoppedAt(position, time + age)));
    }
  }
  assert.equal(classify(null, time), "GPS_OFFLINE");
  assert.equal(stoppedAt(null, time), null);
  assert.equal(classify({source_recorded_at: "invalid"}, time), "GPS_OFFLINE");
});
const point = {type:"Feature", properties:{pointType:"stop", stopNumber:1, name:"<img src=x onerror=alert(1)>"}, geometry:{type:"Point",coordinates:[19.5,42]}};
const collection = features => ({type:"FeatureCollection",features});
test("published map preserves route parts, stops, POIs and active filtering without HTML rendering", () => {
  const result = projectPublishedMap(collection([point, {...point, properties:{active:false}}, {...point,properties:{pointType:"poi",name:"Museum"}}, {type:"Feature", properties:{color:"javascript:bad"}, geometry:{type:"MultiLineString",coordinates:[[[19,42],[20,43]],[[20,43],[21,44]]]}}]));
  assert.equal(result.state,"ready"); assert.equal(result.points.length,2);
  assert.deepEqual(result.points[0].coordinate,[42,19.5]);
  assert.equal(result.points[0].name,point.properties.name); // React/textContent render this as text.
  assert.equal(result.points[1].kind,"poi");
  assert.equal(result.routes[0].lines.length,2); assert.equal(result.routes[0].color,"var(--ss-route)");
});
test("invalid or oversized map data never leaves a partially rendered route", () => {
  for(const bad of [null, {}, collection([point,{...point,geometry:{type:"Point",coordinates:[181,42]}}]), collection(Array(1001).fill(point)),collection([{type:"Feature",geometry:{type:"LineString",coordinates:[[19,42]]}}])]) {
    assert.deepEqual(projectPublishedMap(bad),{state:"unavailable",routes:[],points:[]});
  }
  assert.equal(projectPublishedMap(collection([])).state,"empty");
});
