import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { createMemoryRouter, RouterProvider } from "react-router";
      import { CartMain } from "./app/components/cart/cart-main";
      window.settings = {enableDiscountCode:true,enableGiftCard:true,enableCartNote:true};
      window.requests = [];
      const money = {amount:"80",currencyCode:"USD"};
      window.cart = {id:"cart",totalQuantity:1,lines:{nodes:[{id:"line",discountAllocations:[{code:"Welcome",discountedAmount:{amount:"10",currencyCode:"USD"}}]}]},cost:{subtotalAmount:money,totalAmount:money},note:"",discountCodes:[{code:"Welcome",applicable:true}],appliedGiftCards:[{id:"old-gift",lastCharacters:"1234",amountUsed:money}],checkoutUrl:"#checkout"};
      function Fixture() {
        const [,setRevision] = React.useState(0);
        window.update = () => setRevision(n => n+1);
        return <CartMain layout="page" cart={window.cart}/>;
      }
      const router = createMemoryRouter([
        {path:"/",element:<Fixture/>},
        {path:"/en/cart",action:async ({request}) => {
          const data = await request.formData();
          window.requests.push(JSON.parse(data.get("cartFormInput")));
          return await new Promise(resolve => window.finish = resolve);
        }},
      ]);
      createRoot(document.getElementById("root")).render(<RouterProvider router={router}/>);
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
      name: "summary-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^react-use\/esm\/useScroll$|^~\/hooks\/|^~\/components\/(link|loyalty\/loyalty-points-hint)$|^\.\/cart-(line-item|best-sellers|sync|summary-actions)$|^\.\/store$|^\.\.\/layout\/cart-drawer$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "@weaverse/hydrogen") {
            contents = `export const useTranslation = () => ({t:key => key === "cart.code" ? "Gift card or discount code" : key === "cart.apply" ? "Apply" : key}); export const useThemeSettings = () => window.settings;`;
          } else if (path.includes("useScroll")) {
            contents = "export default () => ({y:0});";
          } else if (path === "./cart-sync") {
            contents = `import {useEffect} from "react"; export const CartResponseSync = () => null; export function useCartFetcherSync(fetcher) {useEffect(() => {if(fetcher.state === "idle" && fetcher.data?.cart) {window.cart = fetcher.data.cart;window.update();}},[fetcher.state,fetcher.data]);}`;
          } else {
            contents = `import React from "react";
            export const useTranslatedThemeSettings = () => window.settings;
            export const usePrefixPathWithLocale = path => "/en"+path;
            export const useCartStore = selector => selector({lineUpdateErrors:new Map(),lineRemovalErrors:new Map()});
            export const CartLineItem = () => null;
            export const PriceLoadingSpinner = () => <span>pending</span>;
            export const CartBestSellers = () => null;
            export const LoyaltyPointsHint = () => null;
            export const Link = ({children}) => <a>{children}</a>;
            export const toggleCartDrawer = () => {};
            export const NoteDialog = () => null;
            export const DiscountDialog = () => null;
            export const GiftCardDialog = () => null;
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
  {
    base: `${root}app/styles`,
    onDependency: () => undefined,
  },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Order Summary matches the shared design and handles code submission at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [375, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--radius-sm:8px;--color-text:#343231;--color-line:#9D9D9D;--body-base-size:14px;--body-base-line-height:1.6;--body-base-spacing:.01em;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const input = page.getByRole("textbox", {
        name: "Gift card or discount code",
      });
      const apply = page.getByRole("button", { name: "Apply", exact: true });
      await expect(input).toBeVisible();
      await expect(input).toHaveCSS("height", "54px");
      await expect(input).toHaveCSS("border-radius", "8px");
      await input.click();
      await expect(input).toBeFocused();
      await expect(input).toHaveCSS("outline-style", "none");
      await expect(input).toHaveCSS(
        "box-shadow",
        /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/,
      );
      await expect(input).toHaveCSS("border-width", "1px");
      await expect(input).toHaveCSS("border-color", "rgb(52, 50, 49)");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(input).toBeFocused();
      await expect(input).toHaveCSS("outline-style", "none");
      await expect(input).toHaveCSS(
        "box-shadow",
        /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/,
      );
      await expect(apply).toHaveCSS("height", "54px");
      await expect(apply).toBeDisabled();
      await expect(input.locator("..")).toHaveCSS("column-gap", "12px");
      await expect(
        page.getByText("cart.orderSummary", { exact: true }),
      ).toHaveCSS("border-bottom-width", "1px");
      const totals = page
        .getByText("cart.subtotal", { exact: true })
        .locator("../..");
      await expect(totals).toHaveCSS("border-top-width", "1px");
      await expect(totals).toHaveCSS("border-bottom-width", "1px");
      await expect(
        page.getByRole("button", { name: "Discount code", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Add a note", exact: true }),
      ).toHaveCount(0);
      const heading = page.getByText("cart.orderSummary", { exact: true });
      await expect(heading).toHaveCSS("padding-bottom", "24px");
      await expect(heading.locator("..")).toHaveCSS("row-gap", "24px");
      await expect(totals).toHaveCSS("padding-top", "24px");
      await expect(totals).toHaveCSS("padding-bottom", "24px");
      await expect(totals).toHaveCSS("row-gap", "24px");
      const subtotalRow = page
        .getByText("cart.subtotal", { exact: true })
        .locator("..");
      const discountRow = page
        .getByText("cart.discount", { exact: true })
        .locator("..");
      const shipping = page.getByText("cart.shippingTaxesCalculated", {
        exact: true,
      });
      const subtotalBounds = await subtotalRow.boundingBox();
      const discountBounds = await discountRow.boundingBox();
      const shippingBounds = await shipping.boundingBox();
      assert.equal(
        discountBounds.y - subtotalBounds.y - subtotalBounds.height,
        24,
      );
      assert.equal(
        shippingBounds.y - discountBounds.y - discountBounds.height,
        24,
      );
      await expect(totals.locator("..")).toHaveCSS("row-gap", "24px");
      const checkout = page.getByRole("button", {
        name: "cart.checkout",
        exact: true,
      });
      await expect(checkout).toHaveCSS("padding", "20px 24px");
      const totalRow = page
        .getByText("cart.remainingToPay", { exact: true })
        .locator("..");
      const totalBounds = await totalRow.boundingBox();
      const checkoutBounds = await checkout.boundingBox();
      assert.equal(checkoutBounds.y - totalBounds.y - totalBounds.height, 20);
      const badges = page.getByRole("list", { name: "cart.appliedCodes" });
      const codeName = badges.getByText("Welcome", { exact: true });
      await expect(codeName).toHaveCSS("text-transform", "uppercase");
      await expect(codeName).toHaveText("Welcome");
      await expect(codeName.locator("..")).toHaveCSS("text-transform", "none");
      const discountAmount = codeName.locator("..").locator("span").last();
      await expect(discountAmount).toHaveCSS("text-transform", "none");
      const badgeBounds = await badges.boundingBox();
      const totalsBounds = await totals.boundingBox();
      assert.equal(totalsBounds.y - badgeBounds.y - badgeBounds.height, 24);
      await input.fill(" vip ");
      await expect(input).toHaveValue(" VIP ");
      await apply.click();
      await expect(input).toBeDisabled();
      await expect(apply).toBeDisabled();
      await expect
        .poll(() => page.evaluate(() => window.requests.length))
        .toBe(1);
      assert.deepEqual(await page.evaluate(() => window.requests[0]), {
        action: "CartCodeApply",
        inputs: { code: "VIP", allowDiscountCode: true, allowGiftCard: true },
      });
      await page.evaluate(() =>
        window.finish({
          codeType: "discount",
          cart: {
            ...window.cart,
            discountCodes: [
              ...window.cart.discountCodes,
              { code: "VIP", applicable: true },
            ],
          },
          userErrors: [],
        }),
      );
      await expect(page.getByRole("status")).toHaveText("cart.discountApplied");
      await expect(page.getByText("VIP", { exact: true })).toBeVisible();
      await input.fill("BAD");
      await expect(page.getByRole("status")).toHaveCount(0);
      await apply.click();
      await expect
        .poll(() => page.evaluate(() => window.requests.length))
        .toBe(2);
      await page.evaluate(() =>
        window.finish({
          codeType: "discount",
          cart: {
            ...window.cart,
            discountCodes: [
              ...window.cart.discountCodes,
              { code: "BAD", applicable: false },
            ],
          },
          userErrors: [],
        }),
      );
      await expect(page.getByRole("alert")).toHaveText("cart.invalidCode");
      await expect(page.getByRole("status")).toHaveCount(0);
      await input.fill("GIFT2024");
      await apply.click();
      await expect
        .poll(() => page.evaluate(() => window.requests.length))
        .toBe(3);
      await page.evaluate(() =>
        window.finish({
          codeType: "gift-card",
          codeApplied: true,
          cart: {
            ...window.cart,
            appliedGiftCards: [
              ...window.cart.appliedGiftCards,
              {
                id: "new-gift",
                lastCharacters: "2024",
                amountUsed: { amount: "20", currencyCode: "USD" },
              },
            ],
          },
          userErrors: [],
        }),
      );
      await expect(page.getByRole("status")).toHaveText("cart.giftCardApplied");
      await page.evaluate(() => {
        window.settings.enableGiftCard = false;
        window.update();
      });
      await expect(
        page.getByRole("textbox", { name: "cart.discountCode" }),
      ).toBeVisible();
      await page.evaluate(() => {
        window.settings.enableDiscountCode = false;
        window.update();
      });
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await expect(page.getByText("VIP", { exact: true })).toBeVisible();
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
