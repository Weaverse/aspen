import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

// Real Header, Radix, QuickShop, cart form/router/store and drawer animations.
// Stub navigation/product presentation, not the mutation or modal handoff.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {createMemoryRouter, RouterProvider} from "react-router";
      import * as Dialog from "@radix-ui/react-dialog";
      import {Header} from "./app/components/layout/header";
      import {QuickShop, QuickShopTrigger} from "./app/components/product/quick-shop";
      import {useCartStore} from "./app/components/cart/store";
      const variant = {id:"gid://shopify/ProductVariant/1",availableForSale:true,selectedOptions:[],price:{amount:"100",currencyCode:"USD"},image:null};
      const product = {handle:"fixture",title:"Fixture",options:[],media:{nodes:[]},selectedOrFirstAvailableVariant:variant,adjacentVariants:[],variants:{nodes:[variant]}};
      window.settings = {headerWidth:"full",designSystemPreset:"aspen",addToCartText:"Add to Cart"};
      window.cartStore = useCartStore;
      window.requests = [];
      function QuickAddFixture(){
        const [open,setOpen]=React.useState(false);
        // Testimonials' portalPopup caller only closes its own dialog on success.
        if(window.direct) return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger>Testimonial Quick Add</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0"/><Dialog.Content className="fixed inset-0 overflow-auto bg-white"><Dialog.Title>Testimonial product</Dialog.Title><QuickShop data={{product,storeDomain:"fixture.myshopify.com"}} onCloseAll={()=>{window.directCloses+=1;setOpen(false);}}/></Dialog.Content></Dialog.Portal></Dialog.Root>;
        return window.controlled ? <><button id="externalQuickAdd" onClick={()=>setOpen(true)}>product.selectOptions</button><QuickShopTrigger productHandle="fixture" open={open} onOpenChange={setOpen} hideTrigger onCloseFocus={()=>document.getElementById("externalQuickAdd").focus()}/></> : <QuickShopTrigger productHandle="fixture" showOnHover={false}/>;
      }
      window.start = () => {
        const router = createMemoryRouter([
          {id:"root",path:"/",loader:()=>({isLoggedIn:false}),element:<><Header/><main id="content" style={{height:2000}}><QuickAddFixture/></main></>},
          {path:"/api/product",loader:()=>({product,storeDomain:"fixture.myshopify.com"})},
          {path:"/cart",action:async({request})=>{window.requests.push(await request.text());return new Promise(resolve=>{window.finishCart=resolve;});}}
        ]);
        createRoot(document.getElementById("root")).render(<RouterProvider router={router}/>);
      };
    `,
  },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "presentation-boundaries",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|use-translated-text$|^\.\/(cart-drawer|desktop-menu|mobile-menu|predictive-search\/search-mobile|predictive-search\/search-desktop)$|^~\/components\/(logo|product\/product-media|product\/back-in-stock-form|loyalty\/loyalty-points-hint)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "@weaverse/hydrogen") {
            contents = `export const createSchema=value=>value; export const useThemeSettings=()=>window.settings; export const useTranslation=()=>({t:key=>key});`;
          } else if (path.endsWith("use-translated-text")) {
            contents = `export const useTranslatedText=()=>value=>value;`;
          } else if (path === "./cart-drawer") {
            contents = `
        import * as Dialog from "@radix-ui/react-dialog";
        import {AnimatedDrawer} from "${root}app/components/animate-drawer";
        import {useCartStore} from "${root}app/components/cart/store";
        export function CartDrawer(){const open=useCartStore(s=>s.isOpen);return <Dialog.Root open={open} onOpenChange={value=>value?useCartStore.getState().open():useCartStore.getState().close()}><Dialog.Trigger>Open cart</Dialog.Trigger><AnimatedDrawer open={open} flush={window.drawerVariant !== "filter"} filter={window.drawerVariant === "filter"}><Dialog.Title>Cart</Dialog.Title><Dialog.Close>Close cart</Dialog.Close></AnimatedDrawer></Dialog.Root>;}`;
          } else if (path.includes("predictive-search")) {
            const name = path.endsWith("search-mobile")
              ? "PredictiveSearchButtonMobile"
              : "PredictiveSearchButtonDesktop";
            contents = `import * as Dialog from "@radix-ui/react-dialog"; import {useState} from "react"; export function ${name}({setIsSearchOpen}){const [open,setOpen]=useState(false);return <Dialog.Root open={open} onOpenChange={value=>{setOpen(value);setIsSearchOpen(value);}}><Dialog.Trigger>${name}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0"/><Dialog.Content className="fixed inset-0"><Dialog.Title>Search</Dialog.Title><Dialog.Close>Close search</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;}`;
          } else {
            const names = {
              "./desktop-menu": "DesktopMenu",
              "./mobile-menu": "MobileMenu",
              "~/components/logo": "Logo",
              "~/components/product/product-media": "ProductMedia",
              "~/components/product/back-in-stock-form": "BackInStockForm",
              "~/components/loyalty/loyalty-points-hint": "LoyaltyPointsHint",
            };
            contents = `export const ${names[path]}=()=>null;`;
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
const browser = await chromium.launch();
test.after(() => browser.close());
async function render(width, options = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.setDefaultTimeout(5000);
  await page.setContent(
    `<style>${css}:root{--height-nav:80px;--topbar-height:0px;--initial-topbar-height:0px;--page-padding:20px;--radius-md:12px;--color-background:white;--btn-primary-bg:#434343;--btn-primary-text:white;} shop-pay-button{display:none}</style><div id="root"></div>`,
  );
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page.evaluate((fixtureOptions) => {
    window.drawerVariant = fixtureOptions.drawerVariant;
    window.controlled = fixtureOptions.controlled;
    window.direct = fixtureOptions.direct;
    window.directCloses = 0;
    Object.assign(window.settings, fixtureOptions.settings);
    window.start();
  }, options);
  await expect(page.locator("header")).toBeVisible();
  return page;
}
test("Search does not remove the non-transparent header from document flow", async () => {
  for (const width of [768, 1032, 1440]) {
    const page = await render(width);
    const before = await page.locator("#content").boundingBox();
    await page
      .getByRole("button", {
        name:
          width < 1280
            ? "PredictiveSearchButtonMobile"
            : "PredictiveSearchButtonDesktop",
        exact: true,
      })
      .click();
    const after = await page.locator("#content").boundingBox();
    assert.equal(
      after.y,
      before.y,
      `${width}px: content must not jump on Search open`,
    );
    await page.getByRole("button", { name: "Close search" }).click();
    await page.close();
  }
});

test("Testimonials' direct QuickShop caller retains automatic Cart opening", async () => {
  for (const width of [390, 768, 1032, 1440]) {
    const page = await render(width, { direct: true });
    await page
      .getByRole("button", { name: "Testimonial Quick Add", exact: true })
      .click();
    const add = page.getByRole("button", { name: "Add to Cart", exact: true });
    await expect(add).toBeEnabled();
    await add.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => window.requests.length))
      .toBe(1);
    assert.equal(
      await page.evaluate(() => window.cartStore.getState().isOpen),
      true,
      "A plain close callback must not disable automatic Cart opening",
    );
    assert.equal(
      await page.evaluate(() => window.directCloses),
      0,
      "The form must stay mounted until the add settles",
    );
    await page.evaluate(() =>
      window.finishCart({
        cart: { id: "cart", lines: { nodes: [] } },
        userErrors: [],
      }),
    );
    await expect(
      page.getByRole("dialog", { name: "Testimonial product" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "Cart", exact: true }),
    ).toBeVisible();
    assert.equal(await page.evaluate(() => window.directCloses), 1);
    await page.close();
  }
});
test("Search preserves transparent header framing and scrolled sticky navigation", async () => {
  for (const transparent of [false, true]) {
    const page = await render(1032, {
      settings: {
        designSystemPreset: "custom",
        enableTransparentHeader: transparent,
      },
    });
    await page.evaluate(() => window.scrollTo(0, 250));
    const before = await page.locator("header").boundingBox();
    await page
      .getByRole("button", {
        name: "PredictiveSearchButtonMobile",
        exact: true,
      })
      .click();
    const after = await page.locator("header").boundingBox();
    assert.equal(after.y, before.y);
    assert.equal(after.height, before.height);
    await page.close();
  }
});
test("Cart leaves a mobile overlay strip and has square right corners", async () => {
  for (const width of [320, 390, 768, 1032, 1440]) {
    const page = await render(width);
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const panel = page.getByRole("dialog").locator(":scope > div");
    await expect(panel).toHaveCSS("border-top-right-radius", "0px");
    await expect(panel).toHaveCSS("border-bottom-right-radius", "0px");
    await expect
      .poll(async () => Math.round((await panel.boundingBox()).x))
      .toBe(Math.max(20, width - 430));
    await expect(panel).toHaveCSS("border-top-left-radius", "12px");
    await page.close();
  }
});
test("Filter framing is unchanged, and cart spacing/radius follow theme tokens", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width, { drawerVariant: "filter" });
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const panel = page.getByRole("dialog").locator(":scope > div");
    await expect
      .poll(async () => Math.round((await panel.boundingBox()).x))
      .toBe(width < 768 ? 0 : width - 430);
    const bounds = await panel.boundingBox();
    assert.equal(bounds.width, Math.min(width, 430));
    await expect(panel).toHaveCSS(
      width < 768 ? "border-top-left-radius" : "border-top-right-radius",
      "0px",
    );
    await page.close();
  }
  const page = await render(390);
  await page.addStyleTag({
    content: ":root{--page-padding:24px;--radius-md:18px}",
  });
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  const panel = page.getByRole("dialog").locator(":scope > div");
  await expect(panel).toHaveCSS("width", "366px");
  await expect(panel).toHaveCSS("border-top-left-radius", "18px");
  await expect(panel).toHaveCSS("border-top-right-radius", "0px");
  await page.close();
});
test("Quick Add stays mounted while pending, then exits before opening Cart", async () => {
  for (const width of [390, 767, 768, 1032, 1033, 1440]) {
    const page = await render(width, {
      controlled: width === 390 || width === 768,
    });
    await page
      .getByRole("button", { name: "product.selectOptions", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    const add = page.getByRole("button", { name: "Add to Cart", exact: true });
    await expect(add).toBeEnabled();
    await page.evaluate(() => {
      window.overlap = false;
      window.capture = true;
      function sample() {
        if (!window.capture) {
          return;
        }
        const dialogs = [...document.querySelectorAll('[role="dialog"]')];
        if (dialogs.length > 1) {
          window.overlap = true;
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await add.click();
    await expect
      .poll(() => page.evaluate(() => window.requests.length))
      .toBe(1);
    assert.equal(
      await page.evaluate(() => window.cartStore.getState().isOpen),
      false,
      "Cart must wait while Quick Add is pending",
    );
    await page.evaluate(() =>
      window.finishCart({
        cart: { id: "cart", lines: { nodes: [] } },
        userErrors: [],
      }),
    );
    await expect
      .poll(() => page.evaluate(() => window.cartStore.getState().isOpen))
      .toBe(true);
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Close cart" }),
    ).toBeFocused();
    assert.equal(
      await page.evaluate(() => {
        window.capture = false;
        return window.overlap;
      }),
      false,
      "Quick Add must exit before Cart mounts",
    );
    await page.close();
  }
});

test("A rejected Quick Add stays open, can retry, and normal dismissal restores focus", async () => {
  const page = await render(768, { controlled: true });
  const trigger = page.getByRole("button", {
    name: "product.selectOptions",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const add = page.getByRole("button", { name: "Add to Cart", exact: true });
  await expect(add).toBeEnabled();
  await add.click();
  await expect.poll(() => page.evaluate(() => window.requests.length)).toBe(1);
  await page.evaluate(() =>
    window.finishCart({
      cart: null,
      userErrors: [{ message: "Out of stock" }],
    }),
  );
  await expect(add).toBeEnabled();
  assert.equal(
    await page.evaluate(() => window.cartStore.getState().isOpen),
    false,
  );
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await add.click();
  await expect.poll(() => page.evaluate(() => window.requests.length)).toBe(2);
  await page.evaluate(() =>
    window.finishCart({
      cart: { id: "cart", lines: { nodes: [] } },
      userErrors: [],
    }),
  );
  await expect(page.getByRole("button", { name: "Close cart" })).toBeFocused();
  await page.getByRole("button", { name: "Close cart" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(add).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.close();
});
