import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React, {useState} from 'react';
      import {createRoot} from 'react-dom/client';
      import {Quantity} from './app/components/product/quantity';
      import {Button} from './app/components/button';
      function Fixture({variant, className}) {
        const [value, onChange] = useState(1);
        return <Quantity value={value} onChange={onChange} maxQuantity={3} variant={variant} className={className}/>;
      }
      const root = createRoot(document.getElementById('root'));
      window.renderQuantity = (variant = 'stepper') => root.render(<Fixture variant={variant}/>);
      window.renderQuickQuantity = props => root.render(<Fixture {...props}/>);
      window.renderQuickRow = ({variant, quantityClass, rowClass, containerClass, buttonClass, quantity = 1}) => root.render(
        <div className={rowClass}>
          <Quantity value={quantity} onChange={()=>{}} variant={variant} className={quantityClass}/>
          <div className={containerClass}><form><Button animate={false} className={buttonClass}>ADD TO CART</Button></form></div>
        </div>
      );
      window.renderPurchaseRow = ({rowClass, quantityClass, containerClass, buttonClass, wishlistClass, wishlist, label, pending}) => root.render(
        <div className={rowClass}>
          <Quantity value={1} onChange={() => {}} variant='stepper' className={quantityClass}/>
          <div className={containerClass}><form><Button animate={false} type='button' className={buttonClass} loading={pending}>{label}</Button></form></div>
          {wishlist && <button type='button' aria-label='Wishlist' className={'size-[54px] shrink-0 ' + wishlistClass}>♡</button>}
        </div>
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
      name: "quantity-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /./, namespace: "fixture" }, () => ({
          contents: "export const useTranslation = () => ({t: key => key});",
          loader: "js",
        }));
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Quick View quantity matches inspected typography and frame while preserving limits", async () => {
  const source = await readFile(
    `${root}app/components/product/quick-shop.tsx`,
    "utf8",
  );
  const variant = source.match(/<Quantity[\s\S]*?variant="([^"]+)"/)?.[1];
  const className = source.match(/<Quantity[\s\S]*?className="([^"]+)"/)?.[1];
  expect(variant).toBe("stepper");
  for (const path of ["main-product", "single-product"]) {
    const section = await readFile(
      `${root}app/sections/${path}/index.tsx`,
      "utf8",
    );
    expect(section.match(/<Quantity[\s\S]*?variant="([^"]+)"/)?.[1]).toBe(
      variant,
    );
  }
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root{--body-base-size:14px;--color-text:#343231;--radius-sm:8px;--color-background-subtle-2:#dfdfdf}#root{width:300px}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((props) => window.renderQuickQuantity(props), {
        variant,
        className,
      });
      const group = page.getByRole("group", { name: "product.quantity" });
      const minus = page.getByRole("button", {
        name: "product.decreaseQuantity",
      });
      const plus = page.getByRole("button", {
        name: "product.increaseQuantity",
      });
      const output = page.locator("output");
      await expect(group).toHaveCSS("height", "54px");
      await expect(group).toHaveCSS("width", "175px");
      await expect(group).toHaveCSS("border-radius", "8px");
      await expect(group).toHaveCSS("background-color", "rgb(223, 223, 223)");
      await expect(minus).toHaveCSS("width", "44px");
      await expect(plus).toHaveCSS("width", "44px");
      await expect(output).toHaveCSS("width", "85px");
      await expect(output).toHaveCSS("border-left-width", "0px");
      await expect(output).toHaveCSS("border-right-width", "0px");
      const dividers = group.locator(":scope > span[aria-hidden='true']");
      await expect(dividers).toHaveCount(2);
      for (const divider of await dividers.all()) {
        await expect(divider).toHaveCSS("width", "1px");
        await expect(divider).toHaveCSS("height", "54px");
        // Normalize Tailwind's color-mix serialization before checking the paint.
        const paint = await divider.evaluate((element) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d");
          context.fillStyle = getComputedStyle(element).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data);
        });
        expect(paint).toEqual([255, 255, 255, 51]);
      }
      await expect(output).toHaveCSS("flex-direction", "column");
      await expect(minus).toBeDisabled();
      await expect(minus).toHaveCSS("opacity", "1");
      for (const button of [minus, plus]) {
        await expect(button.locator("span")).toHaveCSS("font-size", "20px");
        await expect(button.locator("span")).toHaveCSS("font-weight", "600");
        await expect(button.locator("span")).toHaveCSS(
          "font-family",
          /DM Sans/,
        );
        await expect(button.locator("span")).toHaveCSS("line-height", "normal");
        await expect(button.locator("span")).toHaveCSS(
          "color",
          "rgb(52, 50, 49)",
        );
      }
      await expect(output).toHaveCSS("font-size", "16px");
      await expect(output).toHaveCSS("font-weight", "600");
      await expect(output).toHaveCSS("font-family", /DM Sans/);
      await expect(output).toHaveCSS("line-height", "normal");
      await expect(output).toHaveCSS("color", "rgb(52, 50, 49)");
      await plus.click();
      await expect(output).toHaveText("2");
      await minus.press("Enter");
      await expect(output).toHaveText("1");
      await plus.click();
      await plus.click();
      await expect(output).toHaveText("3");
      await expect(plus).toBeDisabled();
      await expect(plus).toHaveCSS("opacity", "1");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Quick View purchase row keeps its preferred quantity width without overflowing narrow screens", async () => {
  const source = await readFile(
    `${root}app/components/product/quick-shop.tsx`,
    "utf8",
  );
  const settings = {
    variant: source.match(/<Quantity[\s\S]*?variant="([^"]+)"/)?.[1],
    quantityClass: source.match(/<Quantity[\s\S]*?className="([^"]+)"/)?.[1],
    rowClass: source.match(/<div className="([^"]+)">\s*<Quantity/)?.[1],
    containerClass: source.match(
      /<AddToCartButton\s+width="auto"\s+containerClassName="([^"]+)"/,
    )?.[1],
    buttonClass: source.match(
      /data-test="add-to-cart"[\s\S]*?className="([^"]+)"/,
    )?.[1],
  };
  for (const value of Object.values(settings)) {
    expect(value).toBeTruthy();
  }
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root{--body-base-size:14px;--radius-sm:8px;--color-background-subtle-2:#dfdfdf}#root{width:min(calc(100vw - 64px),543px)}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((props) => window.renderQuickRow(props), settings);
      const group = page.getByRole("group", { name: "product.quantity" });
      const button = page.getByRole("button", { name: "ADD TO CART" });
      await expect(button).toBeVisible();
      const bounds = await group.evaluate((el) => ({
        width: el.getBoundingClientRect().width,
        rootWidth: document.getElementById("root").clientWidth,
        rootScroll: document.getElementById("root").scrollWidth,
      }));
      expect(bounds.width).toBeLessThanOrEqual(175);
      expect(bounds.width).toBeGreaterThanOrEqual(96);
      expect(bounds.rootScroll).toBeLessThanOrEqual(bounds.rootWidth + 1);
      const buttonBounds = await button.evaluate((el) => ({
        client: el.clientWidth,
        scroll: el.scrollWidth,
      }));
      expect(buttonBounds.scroll).toBeLessThanOrEqual(buttonBounds.client + 1);
      await page.evaluate(
        (props) => window.renderQuickRow({ ...props, quantity: 10 }),
        settings,
      );
      const numberBounds = await group.locator("output").evaluate((element) => {
        const column = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        return {
          left: text.left,
          right: text.right,
          columnLeft: column.left,
          columnRight: column.right,
        };
      });
      expect(numberBounds.left).toBeGreaterThanOrEqual(numberBounds.columnLeft);
      expect(numberBounds.right).toBeLessThanOrEqual(numberBounds.columnRight);
      if (width >= 834) {
        await expect(group).toHaveCSS("width", "175px");
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("complete purchase row keeps quantity, CTA content and wishlist inside narrow layouts", async () => {
  const source = await readFile(
    `${root}app/sections/main-product/index.tsx`,
    "utf8",
  );
  const rowClass = source.match(/<div className="([^"]+)">\s*<Quantity/)?.[1];
  const quantityClass = source.match(
    /<Quantity[\s\S]*?className="([^"]+)"/,
  )?.[1];
  const containerClass = source.match(
    /<AddToCartButton\s+width="auto"\s+containerClassName="([^"]+)"/,
  )?.[1];
  const buttonClass = source.match(
    /data-test="add-to-cart"\s+className="([^"]+)"/,
  )?.[1];
  const wishlistClass = source.match(
    /<ProductWishlistButton\s+productId=\{product.id\}\s+productTitle=\{title\}\s+className="([^"]+)"/,
  )?.[1];
  expect(rowClass).toBeTruthy();
  expect(quantityClass).toBeTruthy();
  expect(buttonClass).toBeTruthy();
  const browser = await chromium.launch();
  try {
    for (const width of [
      320,
      375,
      390,
      430,
      768,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root {--radius-sm:8px;--body-base-size:14px;} #root {width:min(calc(100vw - 64px),543px);margin:auto;}</style><div id='root'></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const wishlist of [false, true]) {
        for (const label of [
          "Add to bag",
          "Ajouter ce produit à mon panier maintenant",
          "A".repeat(70),
        ]) {
          for (const pending of [false, true]) {
            await page.evaluate(
              (settings) => window.renderPurchaseRow(settings),
              {
                rowClass,
                quantityClass,
                containerClass,
                buttonClass,
                wishlistClass,
                wishlist,
                label,
                pending,
              },
            );
            const button = page.locator("form button");
            await expect(button).toBeVisible();
            const bounds = await button.evaluate((b) => {
              const rect = b.getBoundingClientRect();
              return {
                width: rect.width,
                client: b.clientWidth,
                scroll: b.scrollWidth,
                right: rect.right,
                rootRight: document
                  .getElementById("root")
                  .getBoundingClientRect().right,
              };
            });
            expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
            expect(bounds.right).toBeLessThanOrEqual(bounds.rootRight + 1);
            await expect(
              page.getByRole("group", { name: "product.quantity" }),
            ).toHaveCSS("width", "175px");
            if (wishlist) {
              await expect(
                page.getByRole("button", { name: "Wishlist" }),
              ).toBeVisible();
              const positions = await page
                .getByRole("button", { name: "Wishlist" })
                .evaluate((b) => ({
                  top: b.getBoundingClientRect().top,
                  ctaTop: b.previousElementSibling.getBoundingClientRect().top,
                }));
              // Taller translated CTA text may center the fixed-height wishlist.
              expect(positions.top).toBeGreaterThanOrEqual(positions.ctaTop);
            }
          }
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("main product quantity matches inspected Figma geometry and preserves limits", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root {--radius-sm: 8px; --body-base-size: 14px; --color-text: #343231; --color-background-subtle-2: #dfdfdf;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderQuantity());
      const group = page.getByRole("group", { name: "product.quantity" });
      const minus = page.getByRole("button", {
        name: "product.decreaseQuantity",
      });
      const plus = page.getByRole("button", {
        name: "product.increaseQuantity",
      });
      const quantity = page.locator("output");
      await expect(group).toHaveCSS("width", "175px");
      await expect(group).toHaveCSS("height", "54px");
      await expect(group).toHaveCSS("border-radius", "8px");
      await expect(group).toHaveCSS("background-color", "rgb(223, 223, 223)");
      for (const button of [minus, plus]) {
        await expect(button).toHaveCSS("width", "44px");
        await expect(button.locator("span")).toHaveCSS("font-size", "20px");
        await expect(button.locator("span")).toHaveCSS("font-weight", "600");
      }
      await expect(minus).toHaveText("-");
      await expect(quantity).toHaveCSS("font-size", "16px");
      await expect(quantity).toHaveCSS("font-weight", "600");
      await expect(quantity).toHaveCSS("width", "85px");
      await expect(quantity).toHaveCSS("border-left-width", "0px");
      await expect(
        group.locator(":scope > span[aria-hidden='true']"),
      ).toHaveCount(2);
      await expect(minus).toBeDisabled();
      await plus.click();
      await expect(quantity).toHaveText("2");
      await minus.focus();
      await page.keyboard.press("Enter");
      await expect(quantity).toHaveText("1");
      await plus.click();
      await plus.click();
      await expect(quantity).toHaveText("3");
      await expect(plus).toBeDisabled();
      await page.addStyleTag({
        content:
          ":root {--radius-sm: 10px; --color-background-subtle-2: #abcdef;}",
      });
      await expect(group).toHaveCSS("border-radius", "10px");
      await expect(group).toHaveCSS("background-color", "rgb(171, 205, 239)");
      await expect(minus.locator("svg")).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
