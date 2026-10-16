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
      import TestimonialHotspotsItem from "./app/sections/testimonials/item";
      import {useCartStore} from "./app/components/cart/store";
      const variant = {id:"gid://shopify/ProductVariant/1",availableForSale:true,selectedOptions:[],price:{amount:"100",currencyCode:"USD"},image:null};
      const product = {handle:"fixture",title:"Fixture",options:[],media:{nodes:[]},selectedOrFirstAvailableVariant:variant,adjacentVariants:[],variants:{nodes:[variant]}};
      window.settings = {headerWidth:"full",designSystemPreset:"aspen",addToCartText:"Add to Cart"};
      window.cartStore = useCartStore;
      window.requests = [];
      function QuickAddFixture(){
        const [open,setOpen]=React.useState(false);
        if(window.testimonial) return <TestimonialHotspotsItem product={{handle:"fixture"}} loaderData={{product}} iconSize={34} offsetX={50} offsetY={50} showPrice showViewDetailsLink viewDetailsLinkText="Details"/>;
        // Keep coverage for direct QuickShop consumers with their own dialog.
        if(window.direct) return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger>Testimonial Quick Add</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0"/><Dialog.Content className="fixed inset-0 overflow-auto bg-white"><Dialog.Title>Testimonial product</Dialog.Title><QuickShop data={{product,storeDomain:"fixture.myshopify.com"}} onCloseAll={()=>{window.directCloses+=1;setOpen(false);}}/></Dialog.Content></Dialog.Portal></Dialog.Root>;
        return window.controlled ? <><button id="externalQuickAdd" onClick={()=>setOpen(true)}>product.selectOptions</button><QuickShopTrigger productHandle="fixture" open={open} onOpenChange={setOpen} hideTrigger onCloseFocus={()=>document.getElementById("externalQuickAdd").focus()}/></> : <QuickShopTrigger productHandle="fixture" showOnHover={false}/>;
      }
      window.start = () => {
        const router = createMemoryRouter([
          {id:"root",path:"/",loader:()=>({isLoggedIn:false}),element:<><Header/><main id="content" style={{height:2000}}><QuickAddFixture/></main></>},
          {path:"/api/product",loader:()=>window.deferProduct ? new Promise(resolve=>{window.finishProduct=(success=true)=>resolve(success ? {product,storeDomain:"fixture.myshopify.com"} : null);}) : ({product,storeDomain:"fixture.myshopify.com"})},
          {path:"/cart",action:async({request})=>{window.requests.push(await request.text());return new Promise(resolve=>{window.finishCart=resolve;});}}
        ]);
        const app = <RouterProvider router={router}/>;
        createRoot(document.getElementById("root")).render(window.strict ? <React.StrictMode>{app}</React.StrictMode> : app);
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
              /^@weaverse\/hydrogen$|use-translated-text$|^\.\/(cart-drawer|desktop-menu|mobile-menu|floating-hotspot|predictive-search\/search-mobile|predictive-search\/search-desktop)$|^~\/components\/(logo|product\/product-media|product\/back-in-stock-form|loyalty\/loyalty-points-hint)$/,
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
              "./floating-hotspot": "FloatingHotspot",
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
async function render(width, options = {}, testBrowser = browser) {
  const page = await testBrowser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
  });
  page.setDefaultTimeout(5000);
  await page.setContent(
    `<!doctype html><style>${css}:root{--height-nav:80px;--topbar-height:0px;--initial-topbar-height:0px;--page-padding:20px;--radius-md:12px;--color-background:white;--btn-primary-bg:#434343;--btn-primary-text:white;} shop-pay-button{display:none}</style><div id="root"></div>`,
  );
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page.evaluate((fixtureOptions) => {
    window.drawerVariant = fixtureOptions.drawerVariant;
    window.controlled = fixtureOptions.controlled;
    window.direct = fixtureOptions.direct;
    window.testimonial = fixtureOptions.testimonial;
    window.deferProduct = fixtureOptions.deferProduct;
    window.strict = fixtureOptions.strict;
    window.directCloses = 0;
    Object.assign(window.settings, fixtureOptions.settings);
    window.start();
  }, options);
  await expect(page.locator("header")).toBeVisible();
  return page;
}

test("Quick View closes outside its visible panel but keeps inside clicks open", async () => {
  for (const width of [390, 768, 1032, 1440]) {
    const page = await render(width, { controlled: true, deferProduct: true });
    const trigger = page.locator("#externalQuickAdd");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const panel = dialog.locator(":scope > div");
    const clickOutside = async () => {
      const bounds = await panel.boundingBox();
      assert.ok(bounds && bounds.x > 0, "The backdrop must remain exposed");
      await page.mouse.click(bounds.x / 2, bounds.y + bounds.height / 2);
    };
    await panel.click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeVisible();
    await clickOutside();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.evaluate(() => window.finishProduct());
    await trigger.click();
    await expect(
      page.getByRole("button", { name: "Add to Cart", exact: true }),
    ).toBeEnabled();
    await panel.click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeVisible();
    await clickOutside();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    assert.equal(await page.evaluate(() => window.requests.length), 0);
    await page.close();
  }
});

test("Quick View does not flash intermediate errors or rebound opacity during open and close", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width, {
      controlled: true,
      deferProduct: true,
      strict: true,
    });
    async function trace(action) {
      const [samples] = await Promise.all([
        page.evaluate(async () => {
          const frames = [];
          const start = performance.now();
          while (performance.now() - start < 600) {
            const dialog = document.querySelector('[role="dialog"]');
            const panel = dialog?.firstElementChild;
            frames.push({
              t: Math.round(performance.now() - start),
              text: dialog?.textContent?.includes("product.loadError")
                ? "error"
                : dialog?.textContent?.includes("Fixture")
                  ? "product"
                  : dialog
                    ? "loading"
                    : "closed",
              opacity: panel ? Number(getComputedStyle(panel).opacity) : 0,
              overlayOpacity: document.querySelector(".backdrop-blur-xs")
                ? Number(
                    getComputedStyle(
                      document.querySelector(".backdrop-blur-xs"),
                    ).opacity,
                  )
                : 0,
              headerY: document.querySelector("header").getBoundingClientRect()
                .y,
              scroll: scrollY,
              bodyLocked: document.body.getAttribute("data-scroll-locked"),
            });
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return frames;
        }),
        action(),
      ]);
      return samples;
    }
    const opened = await trace(() =>
      page
        .getByRole("button", { name: "product.selectOptions", exact: true })
        .click(),
    );
    assert.ok(
      opened.every((frame) => frame.text !== "error"),
      "Opening should not paint a load error before the request starts",
    );
    await page.evaluate(() => window.finishProduct(false));
    const retry = page.getByRole("button", {
      name: "system.tryAgain",
      exact: true,
    });
    await expect(retry).toBeVisible();
    const retried = await trace(() => retry.click());
    const retryLoading = retried.findIndex((frame) => frame.text === "loading");
    assert.ok(retryLoading >= 0, "Retry should enter loading");
    assert.ok(
      retried.slice(retryLoading).every((frame) => frame.text !== "error"),
      "Retry should not flash back to an error before settling",
    );
    await page.evaluate(() => window.finishProduct());
    await expect(
      page.getByRole("button", { name: "Add to Cart", exact: true }),
    ).toBeEnabled();
    const closed = await trace(() =>
      page
        .getByRole("button", { name: "product.closeQuickShop", exact: true })
        .click(),
    );
    const closingPanels = closed.filter((frame) => frame.text !== "closed");
    assert.ok(
      closingPanels.every(
        (frame, i) =>
          i === 0 || frame.opacity <= closingPanels[i - 1].opacity + 0.01,
      ),
      "Closing fade must not flash back to full opacity",
    );
    assert.ok(
      closingPanels.every(
        (frame, i) =>
          i === 0 ||
          frame.overlayOpacity <= closingPanels[i - 1].overlayOpacity + 0.01,
      ),
      "Closing overlay must not flash back to full opacity",
    );
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-quick-view-scrollbar",
    );
    await page.close();
  }
});

test("Quick View dismissal during fade-in never increases panel or overlay opacity", async () => {
  for (const testimonial of [false, true]) {
    for (const width of testimonial ? [390, 820] : [390, 820, 1440]) {
      for (const dismissal of ["Escape", "outside", "close-button"]) {
        const page = await render(width, {
          controlled: !testimonial,
          testimonial,
          deferProduct: true,
        });
        const trigger = testimonial
          ? page.getByRole("button", {
              name: "product.viewProduct",
              exact: true,
            })
          : page.locator("#externalQuickAdd");
        await trigger.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const panel = dialog.locator(":scope > div");
        // Pin both real opening animations at 20% so the interrupted fade is
        // deterministic even when the browser is busy.
        const initial = await page.evaluate(() => {
          const elements = [
            document.querySelector('[role="dialog"].quick-view-fade-in') ??
              document.querySelector('[role="dialog"]').firstElementChild,
            document.querySelector('[class~="bg-black/50"]'),
          ];
          window.exitEndOpacities = [];
          return elements.map((element) => {
            const animation = element.getAnimations()[0];
            animation.pause();
            animation.currentTime = animation.effect.getTiming().duration * 0.2;
            element.addEventListener("animationend", () => {
              if (element.classList.contains("quick-view-fade-out")) {
                window.exitEndOpacities.push(
                  Number(getComputedStyle(element).opacity),
                );
              }
            });
            return Number(getComputedStyle(element).opacity);
          });
        });
        assert.ok(initial.every((opacity) => opacity > 0 && opacity < 0.5));
        // Radix defers installing its outside-pointer listener to a macrotask.
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 0)),
        );
        const [frames] = await Promise.all([
          page.evaluate(async () => {
            const element =
              document.querySelector('[role="dialog"].quick-view-fade-in') ??
              document.querySelector('[role="dialog"]').firstElementChild;
            const overlay = document.querySelector('[class~="bg-black/50"]');
            const samples = [];
            const start = performance.now();
            while (element.isConnected && performance.now() - start < 600) {
              samples.push([
                Number(getComputedStyle(element).opacity),
                Number(getComputedStyle(overlay).opacity),
              ]);
              await new Promise((resolve) => requestAnimationFrame(resolve));
            }
            return samples;
          }),
          dismissal === "Escape"
            ? page.keyboard.press("Escape")
            : dismissal === "close-button"
              ? page
                  .getByRole("button", { name: "product.closeQuickShop" })
                  .click()
              : (async () => {
                  const bounds = await panel.boundingBox();
                  await page.mouse.click(
                    bounds.x / 2,
                    bounds.y + bounds.height / 2,
                  );
                })(),
        ]);
        for (const [index, label] of ["panel", "overlay"].entries()) {
          assert.ok(
            frames.every(
              (frame, i) =>
                frame[index] <=
                (i ? frames[i - 1][index] : initial[index]) + 0.01,
            ),
            `${testimonial ? "Testimonials" : "QuickShopTrigger"} ${width}px ${dismissal}: ${label} opacity must not rebound (${JSON.stringify(frames)})`,
          );
        }
        await expect(
          dialog,
          `${width}px ${dismissal}: must finish dismissal`,
        ).toHaveCount(0);
        assert.deepEqual(
          await page.evaluate(() => window.exitEndOpacities),
          [0, 0],
        );
        await expect(trigger).toBeFocused();
        await page.close();
      }
    }
  }
});

test("Quick View header stays stable when scrollbar CSS is released before the lock attribute", async () => {
  const classic = await chromium.launch({
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  try {
    const page = await render(
      1440,
      {
        controlled: true,
        strict: true,
        settings: {
          designSystemPreset: "custom",
          enableTransparentHeader: true,
        },
      },
      classic,
    );
    await page.addStyleTag({
      content: "::-webkit-scrollbar{width:16px}#content{padding-top:100px}",
    });
    const header = page.locator("header");
    const before = await header.boundingBox();
    await page.locator("#externalQuickAdd").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Radix's injected overflow rule can disappear before its passive cleanup
    // removes data-scroll-locked. Exercise that intermediate layout explicitly.
    const restored = await page.addStyleTag({
      content: "body[data-scroll-locked]{overflow:visible!important}",
    });
    await expect(page.locator("body")).toHaveAttribute("data-scroll-locked");
    const during = await header.boundingBox();
    assert.equal(
      during.width,
      before.width,
      "A restored scrollbar must not subtract the header gutter twice",
    );
    await restored.evaluate((element) => element.remove());
    await page.getByRole("dialog").press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.close();
  } finally {
    await classic.close();
  }
});

test("Quick View does not resize the background when a persistent scrollbar is locked or restored", async () => {
  const classic = await chromium.launch({
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  try {
    for (const transparent of [false, true]) {
      for (const width of [390, 768, 1280, 1440]) {
        const page = await render(
          width,
          {
            controlled: true,
            strict: true,
            settings: {
              designSystemPreset: "custom",
              enableTransparentHeader: transparent,
            },
          },
          classic,
        );
        await page.addStyleTag({
          content: "::-webkit-scrollbar{width:16px}#content{padding-top:100px}",
        });
        const measure = () =>
          page.locator("#content").evaluate((element) => ({
            width: element.getBoundingClientRect().width,
            x: element.getBoundingClientRect().x,
            headerWidth: document
              .querySelector("header")
              .getBoundingClientRect().width,
          }));
        const before = await measure();
        await page
          .getByRole("button", { name: "product.selectOptions", exact: true })
          .click();
        await expect(page.getByRole("dialog")).toBeVisible();
        const opened = await measure();
        const [closingFrames] = await Promise.all([
          page.evaluate(async () => {
            const frames = [];
            const started = performance.now();
            const sample = () => {
              frames.push({
                width: document.querySelector("header").getBoundingClientRect()
                  .width,
                viewport: document.documentElement.clientWidth,
                locked: document.body.hasAttribute("data-scroll-locked"),
                owner: document.documentElement.hasAttribute(
                  "data-quick-view-scrollbar",
                ),
                transition: getComputedStyle(document.querySelector("header"))
                  .transitionProperty,
              });
            };
            // Layout can be read between Radix lock cleanup and our RAF cleanup,
            // not only after the close animation has completely settled.
            const observer = new MutationObserver(sample);
            observer.observe(document.body, {
              attributes: true,
              attributeFilter: ["data-scroll-locked"],
            });
            observer.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ["data-quick-view-scrollbar"],
            });
            while (performance.now() - started < 600) {
              sample();
              await new Promise((resolve) => requestAnimationFrame(resolve));
            }
            observer.disconnect();
            return frames;
          }),
          page
            .getByRole("button", {
              name: "product.closeQuickShop",
              exact: true,
            })
            .click(),
        ]);
        await expect(page.getByRole("dialog")).toHaveCount(0);
        const closed = await measure();
        assert.deepEqual(
          opened,
          before,
          "Opening must not reflow the page behind Quick View",
        );
        assert.deepEqual(
          closed,
          before,
          "Closing must not reflow the page behind Quick View",
        );
        assert.ok(
          closingFrames.every(
            (frame) => Math.abs(frame.width - before.headerWidth) < 0.5,
          ),
          `Closing header must stay stable through every frame: ${JSON.stringify(closingFrames.filter((frame) => Math.abs(frame.width - before.headerWidth) >= 0.5))}`,
        );
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-quick-view-scrollbar",
        );
        await page.close();
      }
    }
  } finally {
    await classic.close();
  }
});
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

test("Quick View fades without sliding or scaling and keeps a mobile overlay gutter", async () => {
  for (const width of [320, 390, 767, 768, 1032, 1033, 1440]) {
    const page = await render(width);
    const trigger = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "product.quickShop",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const panel = dialog.locator(":scope > div");
    const frames = await panel.evaluate(async (element) => {
      const samples = [];
      const start = performance.now();
      while (performance.now() - start < 250) {
        const styles = getComputedStyle(element);
        samples.push({
          transform: styles.transform,
          opacity: Number(styles.opacity),
        });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return samples;
    });
    assert.ok(
      frames.every((frame) => frame.transform === "none"),
      `${width}px: Quick View should only fade`,
    );
    await expect(panel).toHaveCSS("opacity", "1");
    if (width < 768) {
      const bounds = await dialog.boundingBox();
      assert.equal(bounds.width, width - 32);
      assert.equal(bounds.height, 900 * 0.75);
      assert.equal(bounds.x, 16);
      assert.equal(bounds.y, (900 - bounds.height) / 2);
      await expect(panel).toHaveCSS("border-radius", "12px");
    }
    const [exitFrames] = await Promise.all([
      panel.evaluate(async (element) => {
        const samples = [];
        const start = performance.now();
        while (element.isConnected && performance.now() - start < 300) {
          const styles = getComputedStyle(element);
          samples.push({
            transform: styles.transform,
            opacity: Number(styles.opacity),
          });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return samples;
      }),
      page
        .getByRole("button", { name: "product.closeQuickShop", exact: true })
        .click(),
    ]);
    assert.ok(exitFrames.every((frame) => frame.transform === "none"));
    assert.ok(
      exitFrames.some((frame) => frame.opacity < 1),
      "closing should fade, not immediately disappear",
    );
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.close();
  }
});

test("Mobile Quick View follows viewport height and tokens and dismisses through its overlay", async () => {
  const page = await render(390, { controlled: true });
  await page.addStyleTag({ content: ":root{--radius-md:18px;--spacing:6px}" });
  const trigger = page.getByRole("button", {
    name: "product.selectOptions",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "product.quickShop",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(":scope > div")).toHaveCSS(
    "border-radius",
    "18px",
  );
  await page.setViewportSize({ width: 390, height: 640 });
  const bounds = await dialog.boundingBox();
  assert.equal(bounds.x, 24);
  assert.equal(bounds.width, 390 - 48);
  assert.equal(bounds.height, 640 * 0.75);
  assert.equal(bounds.y, (640 - bounds.height) / 2);
  await page.mouse.click(bounds.x / 2, bounds.y + bounds.height / 2);
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.close();
});

test("Testimonials Quick View shares the standard responsive frame, fade, and focus flow", async () => {
  for (const width of [320, 390, 767, 768, 1032]) {
    const page = await render(width, { testimonial: true });
    await page.addStyleTag({
      content: ":root{--radius-md:18px;--spacing:6px}",
    });
    const trigger = page.getByRole("button", {
      name: "product.viewProduct",
      exact: true,
    });
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "product.quickShop",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const panel = dialog.locator(":scope > div");
    await expect(panel).toHaveCSS("animation-name", "fade-in");
    const bounds = await dialog.boundingBox();
    if (width < 768) {
      assert.equal(bounds.x, 24);
      assert.equal(bounds.width, width - 48);
      assert.equal(bounds.height, 900 * 0.75);
      assert.equal(bounds.y, (900 - bounds.height) / 2);
      await expect(panel).toHaveCSS("border-radius", "18px");
    } else {
      assert.equal(bounds.width, width - 48);
      assert.equal(bounds.x, 24);
      assert.ok(bounds.height <= 900 - 48);
      assert.equal(bounds.y, (900 - bounds.height) / 2);
    }
    const add = page.getByRole("button", { name: "Add to Cart", exact: true });
    await expect(add).toBeEnabled();
    await add.focus();
    const viewport = dialog.locator("[data-radix-scroll-area-viewport]");
    if (width < 768) {
      assert.ok(
        await viewport.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
        `${width}px: long mobile content should scroll inside the panel`,
      );
    }
    const addBounds = await add.boundingBox();
    assert.ok(
      addBounds.y + addBounds.height <= bounds.y + bounds.height,
      "purchase action should remain reachable inside the mobile frame",
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.close();
  }
});

test("Quick View reduced motion and mobile content scrolling retain dismissal and focus", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width, { reducedMotion: true, controlled: true });
    const trigger = page.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "product.quickShop",
      exact: true,
    });
    const panel = dialog.locator(":scope > div");
    await expect(panel).toHaveCSS("opacity", "1");
    await expect(panel).toHaveCSS("transform", "none");
    const add = page.getByRole("button", { name: "Add to Cart", exact: true });
    await expect(add).toBeEnabled();
    await add.focus();
    if (width < 768) {
      const scrollport = dialog.locator("[data-radix-scroll-area-viewport]");
      assert.ok(
        await scrollport.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      );
      const bounds = await dialog.boundingBox();
      const button = await add.boundingBox();
      assert.ok(button.y + button.height <= bounds.y + bounds.height);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
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
test("Filter keeps its right-side overlay gutter, and cart spacing/radius follow theme tokens", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width, { drawerVariant: "filter" });
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const panel = page.getByRole("dialog").locator(":scope > div");
    await expect
      .poll(async () => Math.round((await panel.boundingBox()).x))
      .toBe(width - Math.min(430, width - 32));
    const bounds = await panel.boundingBox();
    assert.equal(bounds.width, Math.min(width - 32, 430));
    await expect(panel).toHaveCSS("border-top-left-radius", "12px");
    await expect(panel).toHaveCSS("border-top-right-radius", "0px");
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
  for (const testimonial of [false, true]) {
    for (const width of testimonial
      ? [390, 820]
      : [390, 767, 768, 1032, 1033, 1440]) {
      const page = await render(width, {
        controlled: width === 390 || width === 768,
        testimonial,
      });
      await page
        .getByRole("button", {
          name: testimonial ? "product.viewProduct" : "product.selectOptions",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      const add = page.getByRole("button", {
        name: "Add to Cart",
        exact: true,
      });
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
