import assert from "node:assert/strict";
import test from "node:test";
import { getProductCardPriceDisplay } from "~/components/product/product-card-price";
import { themeSchema } from "~/weaverse/schema.server";

const equalRange = {
  minVariantPrice: { amount: "999.0", currencyCode: "USD" },
  maxVariantPrice: { amount: "999.00", currencyCode: "USD" },
} as const;
const differentRange = {
  minVariantPrice: { amount: "899.0", currencyCode: "USD" },
  maxVariantPrice: { amount: "999.0", currencyCode: "USD" },
} as const;

test("equal endpoints avoid From and ranges without losing regular variant pricing", () => {
  for (const combined of [false, true]) {
    for (const showLowestPrice of [false, true]) {
      for (const showCombinedPriceRange of [false, true]) {
        assert.equal(
          getProductCardPriceDisplay({
            priceRange: equalRange,
            combined,
            showLowestPrice,
            showCombinedPriceRange,
            hasActiveVariant: true,
          }),
          !combined && !showLowestPrice ? "variant" : "single",
        );
      }
    }
  }
});

test("lowest price off keeps variant price for regular products", () => {
  assert.equal(
    getProductCardPriceDisplay({
      priceRange: differentRange,
      combined: false,
      showLowestPrice: false,
      showCombinedPriceRange: true,
      hasActiveVariant: true,
    }),
    "variant",
  );
});

test("combined products show from-min with lowest off or child off", () => {
  for (const [showLowestPrice, showCombinedPriceRange] of [
    [false, true],
    [true, false],
  ]) {
    assert.equal(
      getProductCardPriceDisplay({
        priceRange: differentRange,
        combined: true,
        showLowestPrice,
        showCombinedPriceRange,
        hasActiveVariant: true,
      }),
      "from",
    );
  }
});

test("combined products show a range only with both settings on", () => {
  assert.equal(
    getProductCardPriceDisplay({
      priceRange: differentRange,
      combined: true,
      showLowestPrice: true,
      showCombinedPriceRange: true,
      hasActiveVariant: true,
    }),
    "range",
  );
});

test("combined range stays hidden until the group price is ready", () => {
  assert.equal(
    getProductCardPriceDisplay({
      priceRange: differentRange,
      combined: true,
      showLowestPrice: true,
      showCombinedPriceRange: true,
      hasActiveVariant: true,
      waitingForCombinedPrice: true,
    }),
    "loading",
  );
});

test("regular products with lowest on show from-min when prices differ", () => {
  assert.equal(
    getProductCardPriceDisplay({
      priceRange: differentRange,
      combined: false,
      showLowestPrice: true,
      showCombinedPriceRange: true,
      hasActiveVariant: true,
    }),
    "from",
  );
});

test("missing active variant falls back to the available range", () => {
  assert.equal(
    getProductCardPriceDisplay({
      priceRange: differentRange,
      combined: false,
      showLowestPrice: false,
      showCombinedPriceRange: false,
      hasActiveVariant: false,
    }),
    "from",
  );
});

test("Studio keeps the existing lowest-price setting and shows its child conditionally", () => {
  const inputs = themeSchema.settings.find(
    (setting) => setting.group === "Product cards",
  )?.inputs;
  const lowest = inputs?.find((input) => input.name === "pcardShowLowestPrice");
  const combinedRange = inputs?.find(
    (input) => input.name === "pcardShowCombinedPriceRange",
  );

  assert.ok(lowest);
  assert.ok(combinedRange);
  assert.equal(combinedRange.defaultValue, true);
  assert.ok("condition" in combinedRange);
  const condition = combinedRange.condition as (data: {
    pcardShowLowestPrice: boolean;
  }) => boolean;
  assert.equal(condition({ pcardShowLowestPrice: true }), true);
  assert.equal(condition({ pcardShowLowestPrice: false }), false);
});
