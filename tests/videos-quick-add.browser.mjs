import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Run with: node --test tests/videos-quick-add.browser.mjs
// Render the real VideoItem and responsive QuickShopTrigger.
// Stub only CMS settings/content at the boundary, not the visual components.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { createMemoryRouter, RouterProvider } from "react-router";
      import VideoItem from "./app/sections/videos/video";
      import { AddToCartButton } from "./app/components/product/add-to-cart-button";
      import { useCartStore } from "./app/components/cart/store";
      const money = {amount:"100",currencyCode:"USD"};
      const product = {handle:"fixture-product", title:"Fixture product",
        selectedOrFirstAvailableVariant:{id:"variant",availableForSale:true,price:money,selectedOptions:[{name:"Color",value:"Blue"}]}};
      window.fixtureSettings = {};
      window.start = ({inline = false, withImage = false, label = "Add to Cart", available = true, quickShopLabel} = {}) => {
        window.fixtureSettings = quickShopLabel ? {quickShopButtonTextOpen: quickShopLabel} : {};
        product.selectedOrFirstAvailableVariant.availableForSale = available;
        window.cartStore = useCartStore;
        window.productRequests = [];
        window.cartRequests = [];
        const router = createMemoryRouter([
          {id:"root",path:"/",element:inline
            ? React.createElement(AddToCartButton,{lines:[{merchandiseId:"variant",quantity:1,selectedVariant:product.selectedOrFirstAvailableVariant}],animate:false},"Other Add")
            : React.createElement(VideoItem,{video:{url:""},addToCartText:label,loaderData:{product: withImage ? {...product,featuredImage:{url:"https://cdn.shopify.com/s/files/1/0000/0001/files/fixture.jpg",width:100,height:100,altText:"Fixture image"}} : product}})},
          {path:"/api/product",loader:({request}) => {window.productRequests.push(request.url); return new Promise(() => {});}},
          {path:"/cart",action:async ({request}) => {
            window.cartRequests.push(await request.text());
            return new Promise(resolve => {window.finishCart = resolve;});
          }}
        ]);
        createRoot(document.getElementById("root")).render(React.createElement(RouterProvider,{router}));
      };
    `,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "cms-fixture",
      setup(builder) {
        // Optional baseline run proves these assertions catch the old behavior.
        if (process.env.TEST_BASELINE_REF) {
          builder.onLoad(
            {
              filter: /app\/sections\/videos\/video\.tsx$/,
            },
            ({ path }) => ({
              loader: "tsx",
              contents: execFileSync(
                "git",
                [
                  "show",
                  `${process.env.TEST_BASELINE_REF}:${path.slice(root.length)}`,
                ],
                { cwd: root, encoding: "utf8" },
              ),
            }),
          );
        }
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "cms",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "js",
          contents:
            path === "translation"
              ? "export const useTranslatedText = () => (value) => value;"
              : `export const createSchema = value => value;
               export const IMAGES_PLACEHOLDERS = {};
               export const useParentInstance = () => null;
               export const useThemeSettings = () => window.fixtureSettings;
               export const useTranslation = () => ({ t: (key, values = {}) => key === 'product.soldOut' ? 'Sold out' : key + (values.value ? ':' + values.value : '') });`,
        }));
      },
    },
  ],
});

const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css =
  stylesheet.build(
    new Scanner({
      sources: [
        { base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false },
      ],
    }).scan(),
  ) +
  (bundle.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "");
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, options = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.route("**/fixture.jpg*", (route) => route.abort());
  page.setDefaultTimeout(5000);
  await page.setContent(`<style>${css}
    :root { --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px;
      --color-background: #FFF; --color-text: #343231; --color-text-subtle: #524B46;
      --color-line: #9D9D9D; --color-line-subtle: #D8D8D8;
      --pcard-border-radius-default: 8px; --pcard-hover-background-default: #F1F1F1;
      --btn-primary-bg: #123456; --btn-primary-text: #FFF; }
    #root { --aspect-ratio: 9/16; margin: 40px auto; width: min(100% - 40px, 360px); }
  </style><div id="root"></div>`);
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page.evaluate((args) => window.start(args), options);
  if (options.cardWidth) {
    await page.locator("#root").evaluate((el, cardWidth) => {
      el.style.width = `${cardWidth}px`;
    }, options.cardWidth);
  }
  await page
    .getByRole("button", {
      name: options.inline
        ? "Other Add"
        : options.quickShopLabel || "product.selectOptions",
    })
    .waitFor();
  return page;
}

test("video eye opens the existing responsive Quick Add and restores focus", async () => {
  for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
    const page = await render(width);
    const button = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
      includeHidden: true,
    });
    await button.focus();
    await button.click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("link", {
        name: "Fixture product",
        exact: true,
        includeHidden: true,
      }),
    ).toHaveAttribute("href", "/products/fixture-product");
    await expect
      .poll(() => page.evaluate(() => window.productRequests.length))
      .toBe(1);
    const request = await page.evaluate(() => window.productRequests[0]);
    assert.equal(
      new URL(request).searchParams.get("handle"),
      "fixture-product",
    );
    assert.equal(new URL(request).searchParams.get("Color"), "Blue");
    if (width < 768) {
      await expect(dialog).toHaveCSS("height", "1200px");
    } else {
      const panel = await dialog.locator(":scope > div").boundingBox();
      assert.ok(panel.width <= width - 48 + 0.1);
    }
    await page.getByRole("button", { name: "product.closeQuickShop" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await page.close();
  }
});

test("Videos Quick Add respects the merchant-configured accessible label", async () => {
  const page = await render(768, { quickShopLabel: "Choose your variant" });
  const button = page.getByRole("button", {
    name: "Choose your variant",
    exact: true,
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.close();
});
// Register mutation tests after the browser fixture has initialized.
test("Videos Add to Cart spins without resizing, blocks repeats and settles on success/error", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width);
    const button = page.getByRole("button", {
      name: "Add to Cart",
      exact: true,
    });
    await button.focus();
    await expect(button).toBeEnabled();
    const panel = button.locator(
      "xpath=ancestor::div[contains(@class, 'transition-transform')]",
    );
    for (const error of [false, true]) {
      await button.focus();
      await expect(panel).toHaveCSS("translate", "0px");
      const before = await button.boundingBox();
      const previousRequests = await page.evaluate(
        () => window.cartRequests.length,
      );
      await button.click();
      await expect(button).toHaveAttribute("aria-busy", "true");
      assert.equal(
        await page.evaluate(() => window.cartStore.getState().isOpen),
        false,
      );
      await button.evaluate((el) => el.blur());
      await page.mouse.move(0, 0);
      await expect(panel).toHaveCSS("translate", "0px");
      await expect(button).toBeDisabled();
      const spinner = button.locator("svg.animate-spin");
      await expect(spinner).toBeVisible();
      await expect(spinner).toHaveCSS("animation-name", "spin");
      assert.deepEqual(await button.boundingBox(), before);
      await button.evaluate((el) => el.click());
      await expect
        .poll(() => page.evaluate(() => window.cartRequests.length))
        .toBe(previousRequests + 1);
      await page.evaluate(
        (failed) =>
          window.finishCart(
            failed
              ? { userErrors: [{ message: "Fixture cart error" }] }
              : {
                  cart: {
                    id: "fixture-cart",
                    updatedAt: new Date().toISOString(),
                    lines: { nodes: [] },
                  },
                },
          ),
        error,
      );
      await expect(button).toHaveAttribute("aria-busy", "false");
      await expect(button).toBeEnabled();
      await expect(spinner).toHaveCount(0);
      if (error) {
        await expect(page.getByRole("alert")).toHaveText("Fixture cart error");
        await expect(panel).toHaveCSS("translate", "0px");
        const alertBox = await page.getByRole("alert").boundingBox();
        const panelBox = await panel.boundingBox();
        assert.ok(alertBox.y + alertBox.height <= panelBox.y + panelBox.height);
        assert.equal(
          await page.evaluate(() => window.cartStore.getState().isOpen),
          false,
        );
      } else {
        await expect
          .poll(() => page.evaluate(() => window.cartStore.getState().isOpen))
          .toBe(true);
        await page.evaluate(() => window.cartStore.getState().close());
      }
    }
    await page.close();
  }
});
// The shared default must stay unchanged outside Videos.
test("other Add to Cart callers retain the existing inline loading", async () => {
  const page = await render(1440, { inline: true });
  const button = page.getByRole("button", { name: "Other Add", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  assert.equal(
    await page.evaluate(() => window.cartStore.getState().isOpen),
    true,
  );
  const pending = page.getByRole("button", {
    name: "cart.adding",
    exact: true,
  });
  await expect(pending).toBeDisabled();
  await expect(pending.locator("svg.animate-spin")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cartRequests.length))
    .toBe(1);
  await page.evaluate(() =>
    window.finishCart({ userErrors: [{ message: "Fixture cart error" }] }),
  );
  await expect(button).toBeEnabled();
  await page.close();
});

test("Videos purchase buttons stay compact and inside the card at responsive widths", async () => {
  for (const width of [375, 768, 834, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
    const page = await render(width, { withImage: true });
    const button = page.getByRole("button", {
      name: "Add to Cart",
      exact: true,
    });
    const eye = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    await button.focus();
    const panel = button.locator(
      "xpath=ancestor::div[contains(@class, 'transition-transform')]",
    );
    await expect(panel).toHaveCSS("translate", "0px");
    const geometry = await button.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const label = el.querySelector("span").getBoundingClientRect();
      const buttonStyle = getComputedStyle(el);
      return {
        width: rect.width,
        contentWidth: label.width,
        padding:
          parseFloat(buttonStyle.paddingLeft) +
          parseFloat(buttonStyle.paddingRight),
      };
    });
    assert.ok(
      Math.abs(geometry.width - geometry.contentWidth - geometry.padding) < 1,
      `Add to Cart stretched beyond its label/padding at ${width}px: ${JSON.stringify(geometry)}`,
    );
    const buttonBox = await button.boundingBox();
    const eyeBox = await eye.boundingBox();
    const panelBox = await panel.boundingBox();
    assert.ok(Math.abs(eyeBox.x - buttonBox.x - buttonBox.width - 8) < 1);
    assert.ok(eyeBox.x + eyeBox.width <= panelBox.x + panelBox.width);
    await page.close();
  }
});

test("Videos unavailable variants show Sold out and cannot submit at all breakpoints", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width, { available: false, withImage: true });
    const eye = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    await eye.focus();
    const button = page.getByRole("button", { name: "Sold out", exact: true });
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Sold out");
    await expect(button).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Add to Cart", exact: true }),
    ).toHaveCount(0);
    await button.evaluate((el) => el.click());
    assert.equal(await page.evaluate(() => window.cartRequests.length), 0);
    assert.equal(
      await page.evaluate(() => window.cartStore.getState().isOpen),
      false,
    );
    await page.close();
  }
});

test("Videos narrow cards and long merchant labels do not overflow or clip loading", async () => {
  const label = "Ajouter ce produit au panier maintenant";
  for (const width of [320, 768, 1440]) {
    const page = await render(width, {
      withImage: true,
      cardWidth: 260,
      label,
    });
    const button = page.getByRole("button", { name: label, exact: true });
    const eye = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    await button.focus();
    const panel = button.locator(
      "xpath=ancestor::div[contains(@class, 'transition-transform')]",
    );
    await expect(panel).toHaveCSS("translate", "0px");
    const before = await button.boundingBox();
    const eyeBox = await eye.boundingBox();
    const panelBox = await panel.boundingBox();
    assert.ok(before.x + before.width <= eyeBox.x);
    assert.ok(eyeBox.x + eyeBox.width <= panelBox.x + panelBox.width);
    assert.ok(
      before.y >= panelBox.y &&
        before.y + before.height <= panelBox.y + panelBox.height,
    );
    assert.equal(
      await button.evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
    );
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator("svg.animate-spin")).toBeVisible();
    assert.deepEqual(await button.boundingBox(), before);
    const spinnerBox = await button.locator("svg.animate-spin").boundingBox();
    assert.ok(
      spinnerBox.x >= before.x &&
        spinnerBox.x + spinnerBox.width <= before.x + before.width,
    );
    await expect
      .poll(() => page.evaluate(() => window.cartRequests.length))
      .toBe(1);
    await page.evaluate(() =>
      window.finishCart({ userErrors: [{ message: "Fixture cart error" }] }),
    );
    await expect(button).toHaveAttribute("aria-busy", "false");
    await page.close();
  }
});
