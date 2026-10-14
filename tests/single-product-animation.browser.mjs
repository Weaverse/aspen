import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Exercise the real SingleProduct, Section, animation hook, variants and Qty.
// Stub remote media/payment/cart boundaries: this test never submits commerce.
const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = {
  "@weaverse/hydrogen": `
    export const createSchema = (value) => value;
    export const IMAGES_PLACEHOLDERS = { product_2: "fixture.png" };
    export const useThemeSettings = () => ({ revealElementsOnScroll: window.reveal });
    export const useTranslation = () => ({ t: (key) => key });
  `,
  "@shopify/hydrogen": `
    import React from "react";
    export const Image = () => <img alt="Product image" />;
    export const Money = ({data}) => <span>{data.amount}</span>;
    export const ShopPayButton = () => <div>Shop Pay</div>;
    export const getProductOptions = (product) => [{
      name: "Color", optionValues: [{
        name: "Pearl Beige", selected: true, available: true,
        swatch: {color: "#e2e2d4"},
        firstSelectableVariant: product.selectedOrFirstAvailableVariant,
      }],
    }];
  `,
  "~/hooks/use-translated-text": `export const useTranslatedText = () => (value) => value;`,
  "~/components/product/product-media": `export const ProductMedia = () => null;`,
  "~/components/product/product-card-rating": `export const ProductCardRating = () => null;`,
  "~/components/product/badges": `export const ProductBadges = () => null; export const SoldOutBadge = () => null;`,
  "~/components/product/variant-prices": `import React from "react"; export const SpacedMoney = ({data}) => <span>{data.amount}</span>;`,
  "~/components/wishlist/product-card-wishlist-button": `export const ProductCardWishlistButton = () => null;`,
  "~/components/subscriptions/selling-plan-selector": `import React from "react"; export const SellingPlanSelector = () => <div>One time purchase</div>;`,
  "~/components/product/add-to-cart-button": `
    import React from "react";
    import { Button } from "${root}app/components/button";
    export const AddToCartButton = ({children, lines, containerClassName, width, ...props}) =>
      <div className={containerClassName}>
        <Button {...props} data-merchandise-id={lines[0]?.merchandiseId}
          data-quantity={lines[0]?.quantity}>{children}</Button>
      </div>;
  `,
  "~/components/image": `import React from "react"; export const Image = () => <img alt="Placeholder" />;`,
  "~/components/link": `import React from "react"; export default ({children, to}) => <a href={to}>{children}</a>;`,
};
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {MemoryRouter} from "react-router";
      import SingleProduct from "./app/sections/single-product";
      const variant = {
        id: "gid://shopify/ProductVariant/1", availableForSale: true,
        product: {handle: "philippe-accent-chair"},
        selectedOptions: [{name: "Color", value: "Pearl Beige"}],
        price: {amount: "699", currencyCode: "USD"},
        compareAtPrice: {amount: "999", currencyCode: "USD"},
      };
      const product = {
        id: "gid://shopify/Product/1", handle: "philippe-accent-chair",
        title: "Philippe Accent Chair", media: {nodes: []},
        selectedOrFirstAvailableVariant: variant,
      };
      const reactRoot = createRoot(document.getElementById("root"));
      window.start = () => reactRoot.render(
        <MemoryRouter><SingleProduct loaderData={{product, storeDomain: "fixture.example"}}
          heading="Featured Product" addToCartText="Add to bag"
          estimatedDeliveryText="Estimated delivery within 3-5 business days" />
        </MemoryRouter>
      );
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "product-fixture",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          path in fixtures ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: fixtures[path],
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(new URL("../app/styles/app.css", import.meta.url), "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

const scenarios = [390, 820, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440].map(
  (width) => ({ width, reveal: true }),
);
scenarios.push({ width: 390, reveal: false });

for (const { width, reveal } of scenarios) {
  test(`Featured Product stays visible at ${width}px with reveal ${reveal}`, async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.evaluate((enabled) => {
        window.reveal = enabled;
        window.observations = new WeakMap();
        const NativeObserver = window.IntersectionObserver;
        window.IntersectionObserver = class extends NativeObserver {
          observe(element) {
            window.observations.set(
              element,
              (window.observations.get(element) || 0) + 1,
            );
            super.observe(element);
          }
        };
      }, reveal);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.start());
      await page.waitForSelector("[data-test='add-to-cart']");
      assert.equal(
        await page
          .locator(".sp-button")
          .evaluate(
            (element) => getComputedStyle(element.parentElement).position,
          ),
        "static",
        "Product information must scroll with the section, not stick below the navbar",
      );
      if (reveal) {
        await page.waitForFunction(() =>
          window.observations.get(
            document.querySelector("[data-test='add-to-cart']"),
          ),
        );
      }
      const owners = await page
        .locator("[data-motion]")
        .evaluateAll((elements) =>
          elements.map((element) => window.observations.get(element)),
        );
      assert.ok(
        owners.length >= 3,
        "Include variant, quantity and purchase motion",
      );
      assert.ok(
        owners.every((count) => count === (reveal ? 1 : undefined)),
        `Unexpected observers: ${owners}`,
      );

      for (const target of [".product-form", ".sp-button"]) {
        await page.locator(target).scrollIntoViewIfNeeded();
        await page.waitForTimeout(1800);
        assert.equal(
          await page.locator(target).evaluate((element) => {
            for (let node = element; node; node = node.parentElement) {
              if (getComputedStyle(node).opacity === "0") {
                return false;
              }
            }
            return true;
          }),
          true,
          `${target} must not disappear after reveal`,
        );
      }
      assert.equal(
        await page
          .locator("[data-test='add-to-cart']")
          .evaluate((element) => getComputedStyle(element).opacity),
        "1",
      );
      assert.ok(
        await page
          .locator("[data-motion]")
          .evaluateAll((elements) =>
            elements.every(
              (element) => getComputedStyle(element).opacity === "1",
            ),
          ),
        "All product controls must remain visible after their animations settle",
      );
      await page
        .getByRole("button", { name: "product.increaseQuantity" })
        .click();
      assert.equal(
        await page
          .locator("[data-test='add-to-cart']")
          .getAttribute("data-quantity"),
        "2",
      );
      assert.equal(
        await page
          .locator("[data-test='add-to-cart']")
          .getAttribute("data-merchandise-id"),
        "gid://shopify/ProductVariant/1",
      );
    } finally {
      await browser.close();
    }
  });
}
