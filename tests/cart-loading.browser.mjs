import assert from "node:assert/strict";
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
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { CartMain, CartNoteDialogWrapper, DiscountCodeDialogWrapper, GiftCardDialogWrapper } from "./app/components/cart/cart-main";
      import { PriceLoadingSpinner } from "./app/components/cart/cart-line-item";
      const root = createRoot(document.getElementById("root"));
      window.settings = {enableFreeShipping: true, freeShippingThreshold: "100", cartTitleEmpty:"Empty cart"};
      window.renderCart = (pending = false, subtotal = "25", error = false, quantity = 1) => {
        window.mutationError = error;
        const money = {amount: subtotal, currencyCode: "USD"};
        root.render(<CartMain layout="drawer" cart={{id:"cart", totalQuantity:quantity, lines:{nodes:[]}, cost:{subtotalAmount:money,totalAmount:money}, note:null, discountCodes:[], appliedGiftCards:[], isOptimistic:pending}} />);
      };
      window.renderSpinner = () => root.render(<PriceLoadingSpinner />);
      window.renderActions = (layout="drawer") => root.render(<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><CartNoteDialogWrapper cartNote="" cartNoteButtonText="Add a note" layout={layout}/><DiscountCodeDialogWrapper discountCodes={[]} discountCodeButtonText="Discount code" layout={layout}/><GiftCardDialogWrapper giftCardButtonText="Gift card" layout={layout}/></div>);
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
      name: "cart-loading-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^react-router$|^react-use\/esm\/useScroll$|^~\/(hooks|utils|components\/(button|link|image|loyalty|subscriptions))|^\.\/cart-(best-sellers|line-qty-adjust|sync|summary-actions)$|^\.\/store$|^\.\.\/layout\/cart-drawer$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "@shopify/hydrogen") {
            contents = `import React from "react"; export const Money = ({data,as:Tag="span",className}) => <Tag className={className}>{data.currencyCode} {data.amount}</Tag>; export const CartForm = () => null; CartForm.ACTIONS = {};`;
          } else if (path === "@weaverse/hydrogen") {
            contents = `export const useTranslation = () => ({t:(key,vars) => key === "cart.freeShippingRemaining" ? "Spend " + vars.amount + " for free shipping" : key === "cart.loading" ? "Loading…" : key});`;
          } else if (path.includes("useScroll")) {
            contents = "export default () => ({y:0});";
          } else {
            contents = `import React from "react";
            export const useTranslatedThemeSettings = () => window.settings;
            export const usePrefixPathWithLocale = (path) => path;
            export const useCartStore = (selector) => selector({lineUpdateErrors: window.mutationError ? new Map([["line",{}]]) : new Map(), lineRemovalErrors:new Map()});
            export const getCartMutationError = (response) => response ? "Request failed" : null;
            export const useFetcher = () => ({state:"idle"});
            export const useCartFetcherSync = () => {};
            export const calculateAspectRatio = () => "1/1";
            export const toggleCartDrawer = () => {};
            export const Button = ({children,disabled}) => <button disabled={disabled}>{children}</button>;
            export const Link = ({children}) => <a>{children}</a>;
            export const Image = () => null;
            export const LoyaltyPointsHint = () => null;
            export const SubscriptionLineItem = () => null;
            export const CartBestSellers = () => null;
            export const CartLineQuantityAdjust = () => null;
            export const CartResponseSync = () => null;
            export const DiscountDialog = () => null;
            export const GiftCardDialog = () => null;
            export const NoteDialog = () => null;
          `;
          }
          return { contents, loader: "tsx", resolveDir: root };
        });
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

test("Cart auxiliary buttons keep their geometry and use the secondary hover token", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--body-base-size:14px;--btn-secondary-bg-hover:#e9e7e4;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderActions());
      for (const name of ["Add a note", "Discount code", "Gift card"]) {
        const button = page.getByRole("button", { name, exact: true });
        await expect(button).toHaveCSS(
          "padding",
          width < 1280 ? "6px 12px" : "8px 12px",
        );
        await expect(button).toHaveCSS(
          "background-color",
          "rgb(240, 239, 237)",
        );
        await expect(button).toHaveCSS("border-radius", "8px");
        const bounds = await button.boundingBox();
        const color = await button.evaluate((el) => getComputedStyle(el).color);
        await button.hover();
        await expect(button).toHaveCSS(
          "background-color",
          width >= DESKTOP_MIN_PX ? "rgb(233, 231, 228)" : "rgb(240, 239, 237)",
        );
        await expect(button).toHaveCSS("opacity", "1");
        await expect(button).toHaveCSS("color", color);
        assert.deepEqual(await button.boundingBox(), bounds);
        await page.mouse.move(width - 1, 899);
        await expect(button).toHaveCSS(
          "background-color",
          "rgb(240, 239, 237)",
        );
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        page.getByRole("button", { name: "Add a note", exact: true }),
      ).toHaveCSS("transition-property", "none");
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--btn-secondary-bg-hover",
          "#d0c0b0",
        ),
      );
      await page
        .getByRole("button", { name: "Add a note", exact: true })
        .hover();
      await expect(
        page.getByRole("button", { name: "Add a note", exact: true }),
      ).toHaveCSS(
        "background-color",
        width >= DESKTOP_MIN_PX ? "rgb(208, 192, 176)" : "rgb(240, 239, 237)",
      );
      await page.evaluate(() => window.renderActions("page"));
      await expect(
        page.getByRole("button", { name: "Add a note", exact: true }),
      ).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Cart pending keeps free shipping and prices show only loading icons", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderSpinner());
      const loading = page.getByText("Loading…", { exact: true });
      await expect(loading).toHaveClass(/sr-only/);
      await expect(page.locator("svg.animate-spin")).toBeVisible();
      await page.evaluate(() => window.renderCart());
      const shipping = page.getByText("Spend USD 75 for free shipping", {
        exact: true,
      });
      await expect(shipping).toBeVisible();
      for (let update = 0; update < 3; update += 1) {
        await page.evaluate(() => window.renderCart(true));
        await expect(shipping).toBeVisible();
        await expect(
          page.getByText("Loading…", { exact: true }).first(),
        ).toHaveClass(/sr-only/);
        await page.evaluate(() => window.renderCart(false, "25", true));
        await expect(page.getByRole("alert")).toHaveText("Request failed");
        await expect(shipping).toBeVisible();
      }
      await page.evaluate(() => window.renderCart(false, "125"));
      await expect(
        page.getByText("cart.freeShippingUnlocked", { exact: true }),
      ).toBeVisible();
      await page.evaluate(() => window.renderCart(true, "125"));
      await expect(
        page.getByText("cart.freeShippingUnlocked", { exact: true }),
      ).toBeVisible();
      await page.evaluate(() => {
        window.settings.enableFreeShipping = false;
        window.renderCart(true);
      });
      await expect(shipping).toHaveCount(0);
      await page.evaluate(() => {
        window.settings.enableFreeShipping = true;
        window.renderCart(true, "25", false, 0);
      });
      await expect(page.getByText("Empty cart", { exact: true })).toBeVisible();
      await expect(shipping).toHaveCount(0);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
