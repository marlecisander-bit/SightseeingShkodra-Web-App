import assert from "node:assert/strict";
import { test } from "node:test";
import { editableWebsiteSections, initialWebsiteContent, validateWebsiteContent } from "../../src/modules/content/website-schema.ts";

test("inactive hero and mobile labels retain stored compatibility without offering ineffective controls", () => {
  const editable = new Set(editableWebsiteSections.flatMap(section => section.fields.map(field => field.key)));
  const saved = {...initialWebsiteContent, "nav.mobileBook":"Previously saved booking label", "nav.mobileMap":"Previously saved map label"};
  for (const key of ["hero.amenities", "nav.mobileBook", "nav.mobileMap"]) {
    assert.equal(editable.has(key), false);
    assert.equal(validateWebsiteContent(saved)[key], saved[key]);
  }
  assert.equal(editable.has("nav.book"), true);
  assert.equal(editable.has("hero.title"), true);
});
