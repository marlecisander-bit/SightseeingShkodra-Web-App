import assert from "node:assert/strict";
import { test } from "node:test";
import { editableWebsiteSections, initialWebsiteContent, validateWebsiteContent } from "../../src/modules/content/website-schema.ts";

test("hero amenities retain their existing editable field while obsolete mobile labels stay stored", () => {
  const editable = new Set(editableWebsiteSections.flatMap(section => section.fields.map(field => field.key)));
  const saved = {...initialWebsiteContent, "nav.mobileBook":"Previously saved booking label", "nav.mobileMap":"Previously saved map label"};
  for (const key of ["nav.mobileBook", "nav.mobileMap"]) {
    assert.equal(editable.has(key), false);
    assert.equal(validateWebsiteContent(saved)[key], saved[key]);
  }
  assert.equal(editable.has("hero.amenities"), true);
  assert.equal(validateWebsiteContent(saved)["hero.amenities"], saved["hero.amenities"]);
  assert.equal(editable.has("nav.book"), true);
  assert.equal(editable.has("hero.title"), true);
});
