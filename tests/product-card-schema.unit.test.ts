import assert from "node:assert/strict";
import test from "node:test";
import { themeSchema } from "~/weaverse/schema.server";

const inputs = themeSchema.settings.find(
  (group) => group.group === "Product cards",
)?.inputs;

test("product card zoom defaults to 105% and keeps the existing on/off control", () => {
  const zoom = inputs?.find((input) => input.name === "pcardHoverZoom");
  assert.equal(zoom?.type, "range");
  assert.equal(zoom?.defaultValue, 105);
  assert.deepEqual(zoom?.configs, { min: 100, max: 150, step: 1, unit: "%" });
  const condition = zoom?.condition;
  assert.equal(typeof condition, "function");
  if (typeof condition !== "function") {
    throw new Error("Zoom visibility must follow the existing zoom switch");
  }
  assert.equal(condition({ pcardImageZoom: true }), true);
  assert.equal(condition({}), true);
  assert.equal(condition({ pcardImageZoom: false }), false);
  assert.equal(
    inputs?.find((input) => input.name === "pcardImageZoom")?.defaultValue,
    true,
  );
});

test("product cards no longer offer the removed second-image hover effect", () => {
  assert.equal(
    inputs?.some((input) => input.name === "pcardShowImageOnHover"),
    false,
  );
});

test("Featured Products nav color settings match the design token defaults", () => {
  const colors = themeSchema.settings
    .flatMap((group) => group.inputs)
    .filter(
      (input) =>
        typeof input.name === "string" &&
        input.name.startsWith("buttonFeaturedProductsNav"),
    );

  assert.deepEqual(
    Object.fromEntries(colors.map((input) => [input.name, input.defaultValue])),
    {
      buttonFeaturedProductsNavBg: "#EDEAE6",
      buttonFeaturedProductsNavColor: "#524B46",
      buttonFeaturedProductsNavBgHover: "#D8D2CB",
      buttonFeaturedProductsNavColorHover: "#524B46",
    },
  );
});
