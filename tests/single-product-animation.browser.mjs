import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Exercise the real SingleProduct, Section, animation hook, variants and Qty.
// Stub remote media/payment/cart boundaries: this test never submits commerce.
const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = {
  "~/components/cart/use-cart-inventory-policy": `export const useVariantInventoryPolicy = () => ({policy: window.testPolicy ?? null, pending: window.testPolicyPending ?? false});`,
  "@weaverse/hydrogen/react-router": `
    export const createSchema = (value) => value;
    export const IMAGES_PLACEHOLDERS = { product_2: "fixture.png" };
    export const useThemeSettings = () => ({ revealElementsOnScroll: window.reveal });
    export const useTranslation = () => ({ t: (key) => key });
  `,
  "@shopify/hydrogen": `
    import React from "react";
    export const Image = () => <img alt="Product image" />;
    export const Money = ({data}) => <span>{data.amount}</span>;
    export const useMoney = (data) => ({currencySymbol: "$", currencyNarrowSymbol: "$", withoutTrailingZeros: "$" + data.amount, withoutTrailingZerosAndCurrency: data.amount});
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
  "~/components/cart/store": `export const useCanAddVariant = () => true;`,
  "~/components/product/product-media": `export const ProductMedia = () => null;`,
  "~/components/product/product-card-rating": `export const ProductCardRating = () => null;`,
  "~/components/product/badges": `export const ProductBadges = () => null; export const SoldOutBadge = () => null;`,
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
      window.start = ({stock=3, available=true, policy=null, pending=false}={}) => {
        window.testPolicy = policy; window.testPolicyPending = pending;
        const selected = {...variant, quantityAvailable: stock, availableForSale: available};
        reactRoot.render(
        <MemoryRouter><SingleProduct loaderData={{product: {...product, selectedOrFirstAvailableVariant: selected}, storeDomain: "fixture.example"}}
          heading="Featured Product" addToCartText="Add to bag"
          estimatedDeliveryText="Estimated delivery within 3-5 business days" />
        </MemoryRouter>
      ); };
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  define: { "import.meta.env.DEV": "false" },
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "product-fixture",
      setup(builder) {
        for (const path of [
          "~/components/money",
          "~/components/shopify-image",
          "~/components/product/shop-pay-button",
        ])
          fixtures[path] = fixtures["@shopify/hydrogen"];
        fixtures["~/components/product/product-form"] =
          fixtures["@shopify/hydrogen"] +
          `export const ProductProvider=({children})=>children; export const useProductForm=()=>({selectOption:()=>({status:'unresolved'})});`;
        fixtures["~/utils/cache"] = "export const CACHE_DEFAULT={};";
        fixtures["~/graphql/queries"] = "export const PRODUCT_QUERY='fixture';";
        fixtures["~/utils/product"] =
          "export const isDiscounted=(price,compare)=>Number(compare?.amount)>Number(price?.amount); export const hasOnlyDefaultVariant=()=>false;";
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

test("Featured Product disables sold-out purchases and preserves zero-stock backorders on every device", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const fixture of [
        {
          stock: 0,
          available: false,
          policy: null,
          disabled: true,
          soldOut: true,
        },
        {
          stock: 0,
          available: true,
          policy: "DENY",
          disabled: true,
          soldOut: true,
        },
        {
          stock: 0,
          available: true,
          policy: "CONTINUE",
          disabled: false,
          soldOut: false,
        },
        {
          stock: 0,
          available: true,
          policy: null,
          pending: true,
          disabled: true,
          soldOut: false,
        },
        {
          stock: 0,
          available: true,
          policy: null,
          disabled: false,
          soldOut: false,
        },
        {
          stock: 3,
          available: true,
          policy: null,
          disabled: false,
          soldOut: false,
        },
      ]) {
        await page.evaluate((value) => window.start(value), fixture);
        const add = page.locator('[data-test="add-to-cart"]');
        if (fixture.disabled) {
          await expect(add).toBeDisabled();
          await expect(
            page.getByRole("button", { name: "product.increaseQuantity" }),
          ).toBeDisabled();
          await expect(page.getByText("Shop Pay", { exact: true })).toHaveCount(
            0,
          );
        } else {
          await expect(add).toBeEnabled();
          await expect(
            page.getByRole("button", { name: "product.increaseQuantity" }),
          ).toBeEnabled();
          await expect(page.getByText("Shop Pay", { exact: true })).toHaveCount(
            1,
          );
        }
        await expect(add).toHaveText(
          fixture.soldOut ? "product.soldOut" : "Add to bag",
        );
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Featured Product uses the shared product stepper without overflowing its purchase row", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--page-padding:16px;--page-width:1440px;--body-base-size:14px;--radius-sm:8px;--color-background-subtle-2:#dfdfdf;--color-text:#343231}</style><div id="root"></div>`,
      );
      await page.evaluate(() => {
        window.reveal = false;
      });
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.start());
      const group = page.getByRole("group", {
        name: "product.quantity",
        exact: true,
      });
      await expect(group).toHaveCSS("height", "54px");
      await expect(group).toHaveCSS("border-radius", "8px");
      await expect(group).toHaveCSS("background-color", "rgb(223, 223, 223)");
      const stepperWidth = await group.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      for (const button of await group.getByRole("button").all()) {
        const buttonWidth = await button.evaluate(
          (element) => element.getBoundingClientRect().width,
        );
        assert.ok(Math.abs(buttonWidth - stepperWidth / 4) < 0.1);
        await expect(button.locator("span")).toHaveCSS("font-size", "20px");
        await expect(button.locator("span")).toHaveCSS("font-weight", "600");
        await expect(button.locator("span")).toHaveCSS(
          "font-family",
          /DM Sans/,
        );
      }
      await expect(group.locator("output")).toHaveCSS("font-size", "16px");
      await expect(group.locator("output")).toHaveCSS("font-weight", "600");
      const bounds = await group.evaluate((element) => {
        const row = element.parentElement;
        const cta = row.querySelector("[data-test='add-to-cart']");
        return {
          width: element.getBoundingClientRect().width,
          rowWidth: row.getBoundingClientRect().width,
          right: cta.getBoundingClientRect().right,
          rowRight: row.getBoundingClientRect().right,
          scroll: cta.scrollWidth,
          client: cta.clientWidth,
        };
      });
      assert.ok(Math.abs(bounds.width - bounds.rowWidth / 3) < 1);
      assert.ok(bounds.right <= bounds.rowRight + 1);
      assert.ok(bounds.scroll <= bounds.client + 1);
      await group
        .getByRole("button", { name: "product.increaseQuantity" })
        .click();
      await expect(page.locator("[data-test='add-to-cart']")).toHaveAttribute(
        "data-quantity",
        "2",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Featured Product mobile titles use available width and natural wrapping", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 330, 375, 390, 767, 768, DESKTOP_MIN_PX]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<!doctype html><style>${css}:root{--page-padding:16px;--page-width:1440px}</style><div id="root"></div>`,
      );
      await page.evaluate(() => {
        window.reveal = false;
      });
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.start());
      await page.locator(".featured-product-media").waitFor();
      const typography = await page.locator("h2, h3").evaluateAll((headings) =>
        headings.map((heading) => ({
          tag: heading.tagName,
          wrap: getComputedStyle(heading).textWrap,
          width: heading.getBoundingClientRect().width,
          parentWidth: heading.parentElement.getBoundingClientRect().width,
          maxWidth: getComputedStyle(heading).maxWidth,
        })),
      );
      for (const heading of typography) {
        assert.equal(heading.wrap, width < 768 ? "wrap" : "balance");
        if (width < 768 && heading.tag === "H2") {
          assert.equal(heading.width, heading.parentWidth);
          assert.equal(heading.maxWidth, "none");
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
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
