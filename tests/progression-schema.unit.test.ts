import assert from "node:assert/strict";
import test from "node:test";
import { schema as promotionSchema } from "~/sections/promotion-grid/grid-items";
import { schema as slideshowSchema } from "~/sections/slideshow";

test("legacy progression palette controls remain serialized but are hidden in Studio", () => {
  for (const schema of [slideshowSchema, promotionSchema]) {
    const inputs = schema.settings?.flatMap((group) => group.inputs) ?? [];
    const colorInput = inputs.find((input) => input.name === "dotsColor");
    assert.ok(colorInput, `${schema.type}: retain the legacy field`);
    assert.equal(colorInput.type, "select");
    assert.equal(typeof colorInput.condition, "function");
    if (typeof colorInput.condition !== "function") {
      assert.fail(`${schema.type}: palette control must be hidden`);
    }
    for (const dotsColor of ["light", "dark"]) {
      assert.equal(colorInput.condition({ showDots: true, dotsColor }), false);
      assert.equal(colorInput.condition({ showDots: false, dotsColor }), false);
    }
    assert.ok(inputs.some((input) => input.name === "showDots"));
  }
});
