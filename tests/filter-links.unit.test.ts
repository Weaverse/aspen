import assert from "node:assert/strict";
import test from "node:test";
import type { Location } from "react-router";
import {
  getAppliedFilterLink,
  getClearAllFiltersLink,
  getFilterLink,
} from "../app/utils/filter.ts";

const location = { pathname: "/search" } as Location;
const selectedColor = {
  variantOption: { name: "Color", value: "Beach Linen" },
};

function createPaginatedParams() {
  const params = new URLSearchParams({
    q: "chair",
    sort: "price-low-high",
    cursor: "stale-cursor",
    direction: "next",
  });
  params.append(
    "filter.variantOption",
    JSON.stringify(selectedColor.variantOption),
  );
  params.append("filter.productVendor", JSON.stringify("Aspen"));
  return params;
}

test("removing a filter preserves catalog state and resets pagination", () => {
  const link = getAppliedFilterLink(
    { label: "Beach Linen", filter: selectedColor },
    createPaginatedParams(),
    location,
  );
  const params = new URL(link, "https://example.com").searchParams;

  assert.equal(params.get("q"), "chair");
  assert.equal(params.get("sort"), "price-low-high");
  assert.equal(params.has("filter.variantOption"), false);
  assert.equal(params.get("filter.productVendor"), JSON.stringify("Aspen"));
  assert.equal(params.has("cursor"), false);
  assert.equal(params.has("direction"), false);
});

test("adding a filter preserves catalog state and resets pagination", () => {
  const params = createPaginatedParams();
  params.delete("filter.variantOption");

  const link = getFilterLink(selectedColor, params, location);
  const nextParams = new URL(link, "https://example.com").searchParams;

  assert.equal(nextParams.get("q"), "chair");
  assert.equal(nextParams.get("sort"), "price-low-high");
  assert.equal(
    nextParams.get("filter.variantOption"),
    JSON.stringify(selectedColor.variantOption),
  );
  assert.equal(nextParams.get("filter.productVendor"), JSON.stringify("Aspen"));
  assert.equal(nextParams.has("cursor"), false);
  assert.equal(nextParams.has("direction"), false);
});

test("clearing filters preserves query and sort while resetting pagination", () => {
  const link = getClearAllFiltersLink(createPaginatedParams(), location);
  const params = new URL(link, "https://example.com").searchParams;

  assert.equal(params.get("q"), "chair");
  assert.equal(params.get("sort"), "price-low-high");
  assert.equal(
    Array.from(params.keys()).some((key) => key.startsWith("filter.")),
    false,
  );
  assert.equal(params.has("cursor"), false);
  assert.equal(params.has("direction"), false);
});
