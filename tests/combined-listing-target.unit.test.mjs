import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getProductOptions } from "@shopify/hydrogen";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents:
      'export {getCombinedListingTarget} from "./app/sections/main-product/combined-listing-target";',
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  write: false,
  format: "esm",
  alias: { "~": `${root}app` },
});
const { getCombinedListingTarget } = await import(
  `data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`
);

function variant(id, handle, color) {
  return {
    id,
    product: { handle },
    availableForSale: true,
    selectedOptions: [
      { name: "Size", value: "Large" },
      { name: "Color", value: color },
    ],
  };
}

function product(firstSizeVariant = variant("variant-a", "child-a", "Blue")) {
  const selected = variant("variant-b", "child-b", "Red");
  return {
    handle: "parent",
    tags: ["combined"],
    options: [
      {
        name: "Size",
        optionValues: [
          { name: "Large", firstSelectableVariant: firstSizeVariant },
        ],
      },
      {
        name: "Color",
        optionValues: [
          {
            name: "Blue",
            firstSelectableVariant: variant("variant-a", "child-a", "Blue"),
          },
          { name: "Red", firstSelectableVariant: selected },
        ],
      },
    ],
    selectedOrFirstAvailableVariant: selected,
    adjacentVariants: [],
    encodedVariantExistence: "v1_0:0,1,",
    encodedVariantAvailability: "v1_0:0,1,",
  };
}

test("target handle and query both follow the real Hydrogen resolved variant", () => {
  const data = product();
  const options = getProductOptions(data);
  assert.equal(options[0].optionValues[0].handle, "child-b");
  assert.equal(
    options[0].optionValues[0].firstSelectableVariant.product.handle,
    "child-a",
  );
  assert.equal(
    getCombinedListingTarget(data, options),
    "/products/child-b?Size=Large&Color=Red",
  );
});

test("a mapped child is still detected when the raw first variant is the parent", () => {
  const data = product(variant("parent-variant", "parent", "Blue"));
  data.options[1].optionValues[1].firstSelectableVariant = variant(
    "parent-variant",
    "parent",
    "Red",
  );
  assert.equal(
    getCombinedListingTarget(data, getProductOptions(data)),
    "/products/child-b?Size=Large&Color=Red",
  );
});

test("tagged products with only their own variants remain directly purchasable", () => {
  const own = variant("variant-own", "parent", "Red");
  const data = product(own);
  data.options[1].optionValues = [{ name: "Red", firstSelectableVariant: own }];
  data.selectedOrFirstAvailableVariant = own;
  assert.equal(getCombinedListingTarget(data, getProductOptions(data)), null);
});

test("untagged products do not become combined parents", () => {
  const data = product();
  data.tags = [];
  assert.equal(getCombinedListingTarget(data, getProductOptions(data)), null);
});
