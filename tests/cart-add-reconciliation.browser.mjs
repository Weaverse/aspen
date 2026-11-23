import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
// Exercise the real form, store and Router lifecycle, including a slow loader
// after the action completes. Only translations and the server are fixtures.
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React, {useLayoutEffect} from 'react';
      import {createRoot} from 'react-dom/client';
      import {createMemoryRouter,RouterProvider,useLoaderData} from 'react-router';
      import {CartForm} from './app/components/cart/cart-action-form';
      import {useProductQuantity} from './app/hooks/use-product-quantity';
      import {AddToCartButton} from './app/components/product/add-to-cart-button';
      import {CartStoreSync} from './app/components/cart/cart-sync';
      import {useCart,useCartStore} from './app/components/cart/store';
      import {buildOptimisticAddCart} from './app/components/cart/optimistic-cart';
      const variant={id:'gid://shopify/ProductVariant/7',availableForSale:true,quantityAvailable:7,price:{amount:'10',currencyCode:'USD'},product:{id:'product-1',handle:'chair',title:'Chair'},selectedOptions:[]};
      const input=quantity=>({merchandiseId:variant.id,selectedVariant:variant,quantity});
      function makeCart(quantity,sequence) {
        const cart=buildOptimisticAddCart([input(quantity)]);
        return {...cart,id:'cart-1',updatedAt:new Date(Date.UTC(2026,10,16,0,0,sequence)).toISOString(),isOptimistic:false,lines:{...cart.lines,nodes:cart.lines.nodes.map(line=>({...line,id:'line-1',isOptimistic:false}))}};
      }
      function Fixture({quantity:requested}) {
        const {quantity,setQuantity}=useProductQuantity(variant);
        const {cart:initialCart}=useLoaderData();
        const cart=useCart();
        const total=cart?.totalQuantity ?? 0;
        const lineQuantity=cart?.lines.nodes[0]?.quantity ?? 0;
        useLayoutEffect(()=>{window.quantities.push({total,lineQuantity});},[total,lineQuantity]);
        return <><CartStoreSync initialCart={initialCart}/><button onClick={()=>setQuantity(requested)}>Select quantity</button><output data-test='cart-quantity'>{lineQuantity}</output><AddToCartButton data-test='add' cartOpenTiming='manual' lines={[input(quantity)]}>Add to cart</AddToCartButton></>;
      }
      window.start=({existing,quantity,reject})=>{
        let currentCart=existing ? makeCart(existing,0) : null;
        let firstLoad=true, sequence=0;
        useCartStore.setState({serverCart:currentCart,isResolved:true});
        useCartStore.setState({inventoryPolicies:new Map([[variant.id,'DENY']])});
        window.quantities=[];window.requests=[];window.loaders=[];
        const router=createMemoryRouter([
          {id:'root',path:'/',element:<Fixture quantity={quantity}/>,loader:()=>{
            if(firstLoad){firstLoad=false;return {cart:currentCart};}
            return new Promise(resolve=>window.loaders.push(()=>resolve({cart:currentCart})));
          }},
          {path:'/cart',action:async({request})=>{
            const formData=await request.formData();
            const {inputs}=CartForm.getFormInput(formData);
            window.requests.push({quantity:inputs.lines[0].quantity,token:formData.get('cartStageToken')});
            await new Promise(resolve=>{window.finishAction=resolve;});
            if(reject) return {userErrors:[{message:'Rejected'}]};
            currentCart=makeCart((currentCart?.totalQuantity ?? 0)+inputs.lines[0].quantity,++sequence);
            return {cart:currentCart};
          }},
        ]);
        window.router=router;
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
        builder.onResolve(
          { filter: /^@weaverse\/hydrogen\/react-router$/ },
          () => ({
            path: "translation",
            namespace: "fixture",
          }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          loader: "js",
          contents: "export const useTranslation=()=>({t:key=>key});",
        }));
      },
    },
  ],
});

for (const scenario of [
  { existing: 0, quantity: 5, reject: false },
  { existing: 0, quantity: 7, reject: false },
  { existing: 1, quantity: 2, reject: false },
  { existing: 2, quantity: 3, reject: true },
]) {
  test(`add quantities never double during revalidation: ${JSON.stringify(scenario)}`, async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((options) => window.start(options), scenario);
      const quantity = page.locator('[data-test="cart-quantity"]');
      const add = page.locator('[data-test="add"]');
      await expect(quantity).toHaveText(String(scenario.existing));
      const tokens = [];
      let existing = scenario.existing;
      // A second submission on the same mounted form must get its own token.
      for (
        let attempt = 0;
        attempt < (scenario.quantity > 3 ? 1 : 2);
        attempt += 1
      ) {
        await page
          .getByRole("button", { name: "Select quantity", exact: true })
          .click();
        await expect(add).toBeEnabled();
        await add.click();
        await expect(quantity).toHaveText(String(existing + scenario.quantity));
        await expect(add).toBeDisabled();
        await expect
          .poll(() => page.evaluate(() => window.requests.length))
          .toBe(attempt + 1);
        await page.evaluate(() => window.finishAction());
        await expect
          .poll(() => page.evaluate(() => window.loaders.length))
          .toBe(1);
        const accepted = scenario.reject
          ? existing
          : existing + scenario.quantity;
        // Check while revalidation is held, not just after the eventual idle state.
        await expect(quantity).toHaveText(String(accepted));
        const trace = await page.evaluate(() => window.quantities);
        assert.ok(
          trace.every(
            (frame) =>
              frame.total === frame.lineQuantity &&
              [existing, existing + scenario.quantity].includes(frame.total),
          ),
          JSON.stringify(trace),
        );
        const request = await page.evaluate(() => window.requests.at(-1));
        assert.equal(request.quantity, scenario.quantity);
        assert.ok(
          request.token,
          "The submitted form must retain its stage token",
        );
        assert.ok(
          !tokens.includes(request.token),
          "Each add needs a fresh token",
        );
        tokens.push(request.token);
        await page.evaluate(() => {
          for (const finish of window.loaders.splice(0)) {
            finish();
          }
        });
        await expect
          .poll(() =>
            page.evaluate(() =>
              Array.from(window.router.state.fetchers.values()).every(
                (fetcher) => fetcher.state === "idle",
              ),
            ),
          )
          .toBe(true);
        await expect(quantity).toHaveText(String(accepted));
        existing = accepted;
        await page.evaluate(() => {
          window.quantities = [];
        });
      }
    } finally {
      await browser.close();
    }
  });
}
