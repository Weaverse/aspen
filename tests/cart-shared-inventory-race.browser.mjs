import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
// Real router loaders/actions, CartStoreSync, per-line fetchers, controls and store.
// Only translation is stubbed; no optimistic/mutation lifecycle is replaced.
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {createMemoryRouter, RouterProvider, useLoaderData} from "react-router";
      import {CartForm} from "@shopify/hydrogen";
      import {CartStoreSync} from "./app/components/cart/cart-sync";
      import {CartLineQuantityAdjust} from "./app/components/cart/cart-line-qty-adjust";
      import {useCart, useCartStore} from "./app/components/cart/store";
      import {buildOptimisticAddCart} from "./app/components/cart/optimistic-cart";
      import {resetCartBaselineForTests} from "./app/components/cart/cart-baseline";
      const input={merchandiseId:"variant-1",quantity:2,selectedVariant:{id:"variant-1",quantityAvailable:5,currentlyNotInStock:false,quantityRule:{minimum:1,maximum:null,increment:1},price:{amount:"10.00",currencyCode:"USD"},product:{id:"product-1",title:"Chair",handle:"chair"},selectedOptions:[]}};
      const initial=buildOptimisticAddCart([input]);
      initial.id="cart-1";
      initial.updatedAt="2026-10-29T00:00:00.000Z";
      initial.isOptimistic=false;
      const line=initial.lines.nodes[0];
      line.id="line-A";line.isOptimistic=false;
      initial.lines.nodes.push({...structuredClone(line),id:"line-B",quantity:3,sellingPlanAllocation:{sellingPlan:{id:"plan-1",name:"Monthly"}}});
      initial.totalQuantity=5;
      function Fixture(){
        const data=useLoaderData();
        const cart=useCart();
        return <><CartStoreSync initialCart={data.cart}/>{cart?.lines.nodes.map(line=><section key={line.id} aria-label={line.id}><CartLineQuantityAdjust line={line}/></section>)}</>;
      }
      window.start=()=>{
        resetCartBaselineForTests();
        useCartStore.setState({serverCart:initial,isResolved:true,pendingAdds:new Map(),pendingLineUpdates:new Map(),lineUpdatesInFlight:new Map(),lineQuantityLimits:new Map(),lineUpdateErrors:new Map(),pendingLineRemovals:new Set()});
        let cart=structuredClone(initial), sequence=0, firstLoad=true;
        window.requests=[];window.loaders=[];
        const router=createMemoryRouter([
          {id:"root",path:"/",element:<Fixture/>,loader:()=>{
            const snapshot=structuredClone(cart);
            if(firstLoad){firstLoad=false;return {cart:snapshot};}
            return new Promise(resolve=>window.loaders.push(()=>resolve({cart:snapshot})));
          }},
          {path:"/cart",action:async({request})=>{
            const {inputs}=CartForm.getFormInput(await request.formData());
            const update=inputs.lines[0];
            window.requests.push(update);
            // First A increase is stock-adjusted; B's later decrease frees stock.
            const target=cart.lines.nodes.find(line=>line.id===update.id);
            target.quantity=update.id==="line-A" && sequence===0 ? 2 : update.quantity;
            cart.totalQuantity=cart.lines.nodes.reduce((total,line)=>total+line.quantity,0);
            cart.updatedAt=new Date(Date.UTC(2026,9,29,0,0,++sequence)).toISOString();
            return {cart:structuredClone(cart)};
          }}
        ]);
        window.router=router;
        window.snapshot=()=>({
          pending:Object.fromEntries(useCartStore.getState().pendingLineUpdates),
          baseline:useCartStore.getState().serverCart?.updatedAt,
          fetchers:Array.from(router.state.fetchers,([key,value])=>({key,state:value.state,updatedAt:value.data?.cart?.updatedAt})),
        });
        createRoot(document.getElementById("root")).render(<RouterProvider router={router}/>);
      };
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "translation-only",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          loader: "js",
          contents: "export const useTranslation=()=>({t:key=>key});",
        }));
      },
    },
  ],
});

test("a retained stock-adjusted fetcher cannot hide fresh intent after another line frees inventory", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => window.start());
    const lineA = page.getByRole("region", { name: "line-A" });
    const lineB = page.getByRole("region", { name: "line-B" });
    await expect(lineA.locator("output")).toHaveText("2");
    await lineA
      .getByRole("button", { name: "product.increaseQuantity" })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.snapshot().baseline))
      .toBe("2026-10-29T00:00:01.000Z");
    await expect(lineA.locator("output")).toHaveText("2");
    await expect(
      lineA.getByRole("button", { name: "product.increaseQuantity" }),
    ).toBeDisabled();
    assert.equal(await page.evaluate(() => window.requests.length), 1);
    await lineB
      .getByRole("button", { name: "product.decreaseQuantity" })
      .evaluate((button) => {
        button.click();
        button.click();
      });
    await expect
      .poll(() => page.evaluate(() => window.snapshot().baseline))
      .toBe("2026-10-29T00:00:02.000Z");
    await expect(lineB.locator("output")).toHaveText("1");
    const retained = await page.evaluate(() => window.snapshot().fetchers);
    assert.ok(
      retained.some(
        (f) =>
          f.key.endsWith("line-A") &&
          f.state === "loading" &&
          f.updatedAt === "2026-10-29T00:00:01.000Z",
      ),
      JSON.stringify(retained),
    );
    assert.ok(
      retained.some(
        (f) =>
          f.key.endsWith("line-B") &&
          f.state === "loading" &&
          f.updatedAt === "2026-10-29T00:00:02.000Z",
      ),
      JSON.stringify(retained),
    );
    await expect(
      lineA.getByRole("button", { name: "product.increaseQuantity" }),
    ).toBeEnabled();
    await lineA
      .getByRole("button", { name: "product.increaseQuantity" })
      .click();
    assert.equal(
      await page.evaluate(() => window.snapshot().pending["line-A"]),
      3,
    );
    await expect(lineA.locator("output")).toHaveText("3");
    assert.equal(await page.evaluate(() => window.requests.length), 2);
    // Release revalidation, allowing only the fresh A=3 intent to submit once.
    await page.evaluate(() => {
      for (const finish of window.loaders.splice(0)) {
        finish();
      }
    });
    await expect
      .poll(() => page.evaluate(() => window.snapshot().baseline))
      .toBe("2026-10-29T00:00:03.000Z");
    await expect(lineA.locator("output")).toHaveText("3");
    assert.deepEqual(await page.evaluate(() => window.requests), [
      { id: "line-A", quantity: 3 },
      { id: "line-B", quantity: 1 },
      { id: "line-A", quantity: 3 },
    ]);
    await page.evaluate(() => {
      for (const finish of window.loaders.splice(0)) {
        finish();
      }
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          window
            .snapshot()
            .fetchers.every((fetcher) => fetcher.state === "idle"),
        ),
      )
      .toBe(true);
    assert.deepEqual(await page.evaluate(() => window.snapshot().pending), {});
    await expect(lineA.locator("output")).toHaveText("3");
    await expect(lineB.locator("output")).toHaveText("1");
  } finally {
    await browser.close();
  }
});
