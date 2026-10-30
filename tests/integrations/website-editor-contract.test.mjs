import assert from "node:assert/strict";
import { test } from "node:test";
import { editableWebsiteSections, initialWebsiteContent, validateWebsiteContent } from "../../src/modules/content/website-schema.ts";

test("hero amenities and obsolete mobile labels remain stored without active editors", () => {
  const editable = new Set(editableWebsiteSections.flatMap(section => section.fields.map(field => field.key)));
  const saved = {...initialWebsiteContent, "nav.mobileBook":"Previously saved booking label", "nav.mobileMap":"Previously saved map label"};
  for (const key of ["nav.mobileBook", "nav.mobileMap"]) {
    assert.equal(editable.has(key), false);
    assert.equal(validateWebsiteContent(saved)[key], saved[key]);
  }
  assert.equal(editable.has("hero.amenities"), false);
  assert.equal(validateWebsiteContent(saved)["hero.amenities"], saved["hero.amenities"]);
  assert.equal(editable.has("nav.book"), true);
  assert.equal(editable.has("hero.title"), true);
});

 test("retired Package 1 controls remain compatible stored keys", () => {
 const editable=new Set(editableWebsiteSections.flatMap(s=>s.fields.map(f=>f.key)));
 const saved={...initialWebsiteContent,"route.text":"Historical route copy","labels.ticket":"Historical ticket label","labels.faq":"Historical FAQ label"};
 for(const key of ["route.text","labels.ticket","labels.faq"]){assert.equal(editable.has(key),false);assert.equal(validateWebsiteContent(saved)[key],saved[key]);}
 assert.equal(Object.keys(validateWebsiteContent(saved)).length,210);
 });
