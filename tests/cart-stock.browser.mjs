import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {CartLineQuantityAdjust} from "./app/components/cart/cart-line-qty-adjust";
      import {useCart, useCartStore} from "./app/components/cart/store";
      import {buildOptimisticAddCart} from "./app/components/cart/optimistic-cart";
      import {resetCartBaselineForTests} from "./app/components/cart/cart-baseline";
      const root = createRoot(document.getElementById("root"));
      function Fixture({layout}) {
        const cart = useCart();
        const errors = useCartStore(state=>state.lineUpdateErrors);
        return <section aria-label={layout}>
          {cart?.lines.nodes.map(line=><CartLineQuantityAdjust key={line.id} line={line}/>)}
          {[...errors.values()].flatMap(response=>response.userErrors || []).map((error,index)=><p key={index} role="alert">{error.message}</p>)}
        </section>;
      }
      window.resetQuantity=(quantity=2,stock=3,layout="drawer",options={})=>{
        resetCartBaselineForTests();
        const cart=buildOptimisticAddCart([{merchandiseId:"variant-1",quantity,selectedVariant:{id:"variant-1",quantityAvailable:stock,currentlyNotInStock:options.backorder || false,quantityRule:options.rule || {minimum:1,maximum:null,increment:1},price:{amount:"10.00",currencyCode:"USD"},product:{id:"product-1",title:"Chair",handle:"chair"},selectedOptions:[]}}]);
        cart.id="cart-1";
        cart.updatedAt="2026-10-28T00:00:00.000Z";
        cart.lines.nodes[0].id="line-1";
        cart.lines.nodes[0].isOptimistic=false;
        cart.isOptimistic=false;
        window.baseline=cart;
        window.sequence=0;
        useCartStore.setState({serverCart:cart,pendingAdds:new Map(),pendingLineUpdates:new Map(),lineUpdatesInFlight:new Map(),lineQuantityLimits:new Map(),lineUpdateErrors:new Map(),pendingLineRemovals:new Set()});
        root.render(<Fixture layout={layout}/>);
      };
      window.target=()=>useCartStore.getState().pendingLineUpdates.get("line-1");
      window.submitQuantity=()=>{window.submitted=useCartStore.getState().claimLineUpdate("line-1");return window.submitted;};
      window.respondQuantity=(quantity,stock,backorder=false)=>{
        const cart=structuredClone(window.baseline);
        cart.updatedAt=new Date(Date.UTC(2026,9,28,0,0,++window.sequence)).toISOString();
        cart.lines.nodes[0].quantity=quantity;
        cart.lines.nodes[0].merchandise.quantityAvailable=stock;
        cart.lines.nodes[0].merchandise.currentlyNotInStock=backorder;
        cart.totalQuantity=quantity;
        window.baseline=cart;
        useCartStore.setState({serverCart:cart});
        useCartStore.getState().settleLineUpdate("line-1",window.submitted,{cart});
      };
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
      name: "cart-stock-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter: /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^react-router$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: `
        export const CartForm={ACTIONS:{LinesAdd:"LinesAdd",LinesUpdate:"LinesUpdate",LinesRemove:"LinesRemove"},getFormInput:form=>JSON.parse(form.get("cartFormInput"))};
        export const useFetchers=()=>[];
        export const useTranslation=()=>({t:(key,vars)=>key==="product.quantityValue"?"Quantity, "+vars.quantity:key});
      `,
          loader: "tsx",
        }));
      },
    },
  ],
});

test("Cart quantity stops rapid increases at stock during loading in both layouts at all breakpoints", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      for (const layout of ["drawer", "page"]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        await page.setContent('<!doctype html><div id="root"></div>');
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(
          (cartLayout) => window.resetQuantity(2, 3, cartLayout),
          layout,
        );
        const increase = page.getByRole("button", {
          name: "product.increaseQuantity",
        });
        const decrease = page.getByRole("button", {
          name: "product.decreaseQuantity",
        });
        await expect(page.locator("output")).toHaveText("2");
        await increase.evaluate((button) => {
          for (let i = 0; i < 10; i += 1) {
            button.click();
          }
        });
        await expect(page.locator("output")).toHaveText("3");
        await expect(increase).toBeDisabled();
        await expect(decrease).toBeEnabled();
        assert.equal(await page.evaluate(() => window.target()), 3);
        assert.equal(await page.evaluate(() => window.submitQuantity()), 3);
        await page.evaluate(() => window.respondQuantity(3, 3));

        // Stock alone cannot distinguish an in-stock backorder variant.
        // Validate one increase with Shopify, without displaying quantity 4.
        await expect(increase).toBeEnabled();
        await increase.click();
        await expect(page.locator("output")).toHaveText("3");
        await expect(increase).toBeDisabled();
        assert.equal(await page.evaluate(() => window.submitQuantity()), 4);
        await page.evaluate(() => window.respondQuantity(3, 3));
        await expect(page.locator("output")).toHaveText("3");
        await expect(increase).toBeDisabled();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(increase).toHaveAttribute(
          "title",
          "cart.quantityLimitReached",
        );
        await decrease.click();
        await expect(page.locator("output")).toHaveText("2");
        await expect(page.getByRole("alert")).toHaveCount(0);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Cart quantity reconciles changed inventory without replaying queued overshoots and preserves backorders", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const increase = page.getByRole("button", {
      name: "product.increaseQuantity",
    });
    await page.evaluate(() => window.resetQuantity(2, 10));
    await increase.click();
    assert.equal(await page.evaluate(() => window.submitQuantity()), 3);
    await increase.click();
    await increase.click();
    await expect(page.locator("output")).toHaveText("5");
    await page.evaluate(() => window.respondQuantity(2, 2));
    await expect(page.locator("output")).toHaveText("2");
    await expect(increase).toBeDisabled();
    assert.equal(await page.evaluate(() => window.target()), undefined);

    await page.evaluate(() => window.resetQuantity(3, 3));
    await increase.click();
    await expect(page.locator("output")).toHaveText("3");
    await expect(increase).toBeDisabled();
    assert.equal(await page.evaluate(() => window.submitQuantity()), 4);
    await page.evaluate(() => window.respondQuantity(4, 3));
    await expect(page.locator("output")).toHaveText("4");
    await expect(increase).toBeEnabled();
    await expect(page.getByRole("alert")).toHaveCount(0);

    await page.evaluate(() => window.resetQuantity(2, null));
    await increase.press("Enter");
    await expect(page.locator("output")).toHaveText("2");
    await expect(increase).toBeDisabled();
    assert.equal(await page.evaluate(() => window.submitQuantity()), 3);
    await page.evaluate(() => window.respondQuantity(3, null, true));
    await expect(page.locator("output")).toHaveText("3");
    await expect(increase).toBeEnabled();
  } finally {
    await browser.close();
  }
});
