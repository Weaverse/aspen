import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
// Keep the real form, router action, cart synchronization and quantity hook.
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {createMemoryRouter,RouterProvider} from 'react-router';
      import {CartForm} from '@shopify/hydrogen';
      import {useProductQuantity} from './app/hooks/use-product-quantity';
      import {Quantity} from './app/components/product/quantity';
      import {AddToCartButton} from './app/components/product/add-to-cart-button';
      import {CartStoreSync} from './app/components/cart/cart-sync';
      import {buildOptimisticAddCart} from './app/components/cart/optimistic-cart';
      const variant={id:'gid://shopify/ProductVariant/7',availableForSale:true,quantityAvailable:7,price:{amount:'10',currencyCode:'USD'},product:{id:'product-1',handle:'chair',title:'Chair'},selectedOptions:[]};
      function Fixture() {
        const {quantity,setQuantity,maxQuantity,canPurchase}=useProductQuantity(variant);
        return <><CartStoreSync initialCart={null}/><Quantity value={quantity} onChange={setQuantity} maxQuantity={maxQuantity} disabled={!canPurchase}/><AddToCartButton data-test='purchase' cartOpenTiming='manual' disabled={!canPurchase} lines={[{merchandiseId:variant.id,selectedVariant:variant,quantity}]}>Add to cart</AddToCartButton></>;
      }
      window.start=reject=>{
        window.requests=[];
        const router=createMemoryRouter([
          {id:'root',path:'/',element:<Fixture/>,loader:()=>({cart:null})},
          {path:'/cart',action:async({request})=>{
            const {inputs}=CartForm.getFormInput(await request.formData());
            window.requests.push(inputs.lines[0].quantity);
            await new Promise(resolve=>{window.finish=resolve;});
            if(reject) return {userErrors:[{message:'Rejected'}]};
            const cart=buildOptimisticAddCart(inputs.lines);
            return {cart:{...cart,id:'cart-1',updatedAt:'2026-11-12T10:00:00Z',isOptimistic:false,lines:{...cart.lines,nodes:cart.lines.nodes.map(line=>({...line,id:'line-1',isOptimistic:false}))}}};
          }},
        ]);
        createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
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

for (const rejected of [false, true]) {
  test(`the real form submits seven before resetting the selector; rejected=${rejected}`, async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route("https://fixture.example/", (route) =>
        route.fulfill({
          body: '<div id="root"></div>',
          contentType: "text/html",
        }),
      );
      await page.route("**/api/cart-inventory-policy?*", (route) =>
        route.fulfill({
          json: { policies: { "gid://shopify/ProductVariant/7": "DENY" } },
        }),
      );
      await page.goto("https://fixture.example/");
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((reject) => window.start(reject), rejected);
      const plus = page.getByRole("button", {
        name: "product.increaseQuantity",
      });
      for (let count = 1; count < 7; count += 1) {
        await plus.click();
      }
      const add = page.locator('[data-test="purchase"]');
      await expect(page.locator("output")).toHaveText("7");
      await add.click();
      await expect
        .poll(() => page.evaluate(() => window.requests))
        .toEqual([7]);
      await expect(page.locator("output")).toHaveText("0");
      await expect(add).toBeDisabled();
      await page.evaluate(() => window.finish());
      await expect(page.locator("output")).toHaveText(rejected ? "1" : "0");
      if (rejected) {
        await expect(add).toBeEnabled();
        await add.click();
        await expect
          .poll(() => page.evaluate(() => window.requests))
          .toEqual([7, 1]);
        await page.evaluate(() => window.finish());
        await expect(add).toBeEnabled();
      } else {
        await expect(add).toBeDisabled();
      }
    } finally {
      await browser.close();
    }
  });
}
