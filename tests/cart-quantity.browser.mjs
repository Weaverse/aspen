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
      import {createRoot} from "react-dom/client";
      import {CartLineItem} from "./app/components/cart/cart-line-item";
      import {CartLineQuantityAdjust} from "./app/components/cart/cart-line-qty-adjust";
      const root = createRoot(document.getElementById("root"));
      window.updates=[];
      window.renderQuantity=(quantity=2,layout="drawer",id="line-1",pending=false,amount="49.00")=>{
        window.currentQuantity=quantity;
        const line={id,quantity,isOptimistic:pending,discountAllocations:[],cost:{amountPerQuantity:{amount,currencyCode:"USD"},totalAmount:{amount,currencyCode:"USD"}},merchandise:{title:"Color",selectedOptions:[{name:"Color",value:"Cream"}],product:{handle:"chair",title:"Product title"}}};
        line.merchandise.image={url:"fixture",width:140,height:140};
        line.sellingPlanAllocation={sellingPlan:{name:"Deliver every 4 weeks",options:[]}};
        root.render(layout==="drawer" ? <ul className="grid gap-6" style={{width:"min(calc(100vw - var(--page-padding)),430px)",padding:20}}><CartLineItem line={line} layout={layout} discountCodes={[]}/></ul> : <CartLineQuantityAdjust line={line} layout={layout}/>);
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
      name: "cart-quantity-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^~\/components\/(image|link)$|^~\/utils\/image$|^\.\/store$|^\.\.\/layout\/cart-drawer$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const useTranslation=()=>({t:(key,vars)=>key==="product.quantityValue"?"Quantity, "+vars.quantity:key==="subscription.week_other"?"Deliver every "+vars.count+" weeks":key});`
              : `import React from "react";
          export const Money=({data,as:Tag="span",className})=><Tag className={className}>{data.amount}</Tag>;
          export const Image=({className})=><div className={className}><img alt="Product fixture" style={{width:"100%",height:"100%",objectFit:"cover"}} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Crect width='140' height='140' fill='gray'/%3E%3C/svg%3E"/></div>;
          export const Link=({children,...props})=><a {...props}>{children}</a>;
          export const SubscriptionLineItem=()=>null;
          export const calculateAspectRatio=()=>"1/1";
          export const toggleCartDrawer=()=>{};
          export const useCartStore=(selector)=>selector({pendingLineRemovals:new Set()});
          useCartStore.getState=()=>({stageLineUpdate:(id,quantity)=>{window.updates.push({id,quantity});window.renderQuantity(quantity,"drawer",id,true);}});
        `,
          loader: "tsx",
          resolveDir: root,
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

test("Cart mobile keeps its 140px flexible image, compact spacing and one-row quantity/price without changing tablet controls", async () => {
  const browser = await chromium.launch();
  try {
    let desktopStyle;
    for (const width of [
      1440,
      320,
      375,
      393,
      430,
      767,
      768,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on("pageerror", (error) => {
        throw error;
      });
      await page.setContent(
        `<style>${css}:root{--page-padding:20px;--body-base-size:14px;--radius-sm:8px;--color-background-subtle:#ededed;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderQuantity());
      const increase = page.getByRole("button", {
        name: "product.increaseQuantity",
        exact: true,
      });
      const decrease = page.getByRole("button", {
        name: "product.decreaseQuantity",
        exact: true,
      });
      await expect(increase).toBeVisible();
      await expect(decrease).toBeVisible();
      await expect(page.getByRole("combobox")).toHaveCount(0);
      const stepper = page.getByRole("group", {
        name: "Quantity, 2",
        exact: true,
      });
      const style = await stepper.evaluate((el) => {
        const computedStyle = getComputedStyle(el);
        const bounds = el.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          radius: computedStyle.borderRadius,
          background: computedStyle.backgroundColor,
        };
      });
      if (width === 1440) {
        desktopStyle = style;
      }
      if (width >= 768) {
        assert.deepEqual(style, desktopStyle);
        assert.equal(style.width, 132);
      } else {
        assert.ok(style.width > 0 && style.width <= 132);
      }
      assert.ok(Math.abs(style.height - (width < 768 ? 30 : 38.4)) < 0.1);
      assert.equal(style.radius, "8px");
      for (const button of [increase, decrease]) {
        const buttonWidth = (await button.boundingBox()).width;
        assert.ok(
          Math.abs(buttonWidth - (width < 768 ? style.width / 3 : 44)) < 0.1,
        );
        assert.equal(
          await button.evaluate((el) => getComputedStyle(el).paddingTop),
          width < 768 ? "0px" : "8px",
        );
      }
      const remove = page.getByRole("button", { name: "cart.removeItem" });
      const stepperBounds = await stepper.boundingBox();
      const rowBounds = await stepper.evaluate((el) => {
        const bounds = el.parentElement.getBoundingClientRect();
        return { y: bounds.y, height: bounds.height };
      });
      const removeBounds = await remove.boundingBox();
      assert.ok(
        Math.abs(
          removeBounds.y -
            rowBounds.y -
            rowBounds.height -
            (width < 768 ? 8 : 16),
        ) < 0.1,
        JSON.stringify({ width, rowBounds, removeBounds }),
      );
      const priceBounds = await page
        .getByText("49.00", { exact: true })
        .boundingBox();
      const sameRow =
        Math.abs(
          priceBounds.y +
            priceBounds.height / 2 -
            stepperBounds.y -
            stepperBounds.height / 2,
        ) < 0.1;
      assert.ok(sameRow);
      await expect(
        page.getByText("Deliver every 4 weeks", { exact: true }),
      ).toBeVisible();
      if (width < 768) {
        const imageBounds = await page
          .getByAltText("Product fixture")
          .boundingBox();
        assert.equal(imageBounds.height, 140);
        assert.equal(
          await page
            .locator("li > div")
            .first()
            .evaluate((el) => getComputedStyle(el).flex),
          "1 0 0px",
        );
        const gaps = await page
          .locator("li > div")
          .nth(1)
          .evaluate((el) => {
            const top = el.children[0];
            const text = top.children[0];
            const title = text.children[0].getBoundingClientRect();
            const variant = text.children[1].getBoundingClientRect();
            const subscription = top.children[1].getBoundingClientRect();
            const row = el.children[1].children[0].getBoundingClientRect();
            return [
              variant.top - title.bottom,
              subscription.top - variant.bottom,
              row.top - subscription.bottom,
            ];
          });
        assert.equal(gaps[0], 4);
        assert.equal(gaps[1], 8);
        assert.ok(gaps[2] >= 8);
        const removeBottom = removeBounds.y + removeBounds.height;
        assert.ok(
          Math.abs(removeBottom - imageBounds.y - imageBounds.height) < 0.1,
        );
      } else if (width <= TABLET_MAX_PX) {
        const thumbnail = await page.locator("li > div").first().boundingBox();
        const expectedWidth = Math.max(100, Math.min(width * 0.3256, 140));
        assert.ok(Math.abs(thumbnail.width - expectedWidth) < 0.1);
      }
      await increase.click();
      await expect(
        page.getByRole("group", { name: "Quantity, 3", exact: true }),
      ).toBeVisible();
      await decrease.click();
      await expect(stepper).toBeVisible();
      assert.deepEqual(await page.evaluate(() => window.updates), [
        { id: "line-1", quantity: 3 },
        { id: "line-1", quantity: 2 },
      ]);
      await page.evaluate(() => window.renderQuantity(1));
      await expect(decrease).toBeDisabled();
      await expect(increase).toBeEnabled();
      await page.evaluate(() => window.renderQuantity(12));
      await expect(
        page.getByRole("group", { name: "Quantity, 12", exact: true }),
      ).toBeVisible();
      // Rejected mutations restore the server-confirmed quantity without local drift.
      await page.evaluate(() => window.renderQuantity(2));
      await expect(stepper).toBeVisible();
      await page.evaluate(() =>
        window.renderQuantity(2, "drawer", "optimistic-new", true),
      );
      await expect(increase).toBeDisabled();
      await expect(decrease).toBeDisabled();
      await page.evaluate(() =>
        window.renderQuantity(2, "drawer", "line-1", false, "123456.78"),
      );
      await expect(increase).toBeVisible();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.evaluate(() => window.renderQuantity(2, "page"));
      await expect(page.getByRole("combobox")).toBeVisible();
      await expect(increase).toHaveCount(0);
      await expect(decrease).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
