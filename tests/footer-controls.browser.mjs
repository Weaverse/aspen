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
    resolveDir: root,
    loader: "tsx",
    contents: `import React from "react";import {createRoot} from "react-dom/client";import {createMemoryRouter,RouterProvider} from "react-router";import {Footer} from "./app/components/layout/footer";window.settings={};window.payments=["VISA","MASTERCARD","AMERICAN_EXPRESS","PAYPAL","DINERS_CLUB","DISCOVER"];window.start=()=>createRoot(document.getElementById("root")).render(<RouterProvider router={createMemoryRouter([{path:"/",element:<Footer/>}])}/>);`,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "footer-data-boundaries",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^~\/hooks\/(use-shop-menu|use-global-theme-text|use-footer-rich-text)$|use-localization-selector$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const createSchema=value=>value;export const useThemeSettings=()=>window.settings;export const useTranslation=()=>({t:key=>key});`
              : path.endsWith("use-shop-menu")
                ? `export const useShopMenu=()=>({shopName:"Fixture",footerMenu:{items:[]},paymentSettings:{acceptedCardBrands:window.payments}});`
                : path.endsWith("use-global-theme-text")
                  ? `export const useGlobalThemeText=()=>value=>value;`
                  : path.endsWith("use-footer-rich-text")
                    ? `export const useFooterRichText=value=>value;`
                    : `export const useLocalizationSelector=mode=>({selectedLabel:mode==="language"?"English":"United States - USD",selectedMarketCountry:"US",selectorOptions:mode==="language"?[{key:"en",type:"language",label:"English",redirectTo:"/",isSelected:true}]:[{key:"US",type:"country",country:"US",label:"United States - USD",isSelected:true}],selectCurrency:()=>{},isChangingCurrency:false});`,
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

test("footer selector and payment radii follow tokens at all breakpoints without changing interactions", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [375, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<!doctype html><style>${css}:root{--radius-sm:8px;--radius-xs:4px;--footer-input-border:#9D9D9D}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.start());
      const currency = page
        .getByRole("button", { name: "locale.selectCurrency" })
        .filter({ visible: true });
      const language = page
        .getByRole("button", { name: "locale.selectLanguage" })
        .filter({ visible: true });
      const payments = page
        .getByRole("list", { name: "footer.acceptedPayments" })
        .filter({ visible: true });
      await expect(currency).toHaveCount(1);
      await expect(language).toHaveCount(1);
      await expect(
        payments.locator("li[title]").filter({ has: page.locator("svg") }),
      ).toHaveCount(5);
      await expect(payments).toContainText("+1");
      for (const [small, extraSmall, border] of [
        [8, 4, "#9D9D9D"],
        [12, 6, "#123456"],
      ]) {
        await page.evaluate(
          ([sm, xs, color]) => {
            document.documentElement.style.setProperty(
              "--radius-sm",
              `${sm}px`,
            );
            document.documentElement.style.setProperty(
              "--radius-xs",
              `${xs}px`,
            );
            document.documentElement.style.setProperty(
              "--footer-input-border",
              color,
            );
          },
          [small, extraSmall, border],
        );
        for (const selector of [currency, language]) {
          const style = await selector.evaluate((element) => {
            const value = getComputedStyle(element);
            return {
              radius: value.borderRadius,
              width: value.borderTopWidth,
              color: value.borderTopColor,
            };
          });
          assert.deepEqual(style, {
            radius: `${small}px`,
            width: "1px",
            color:
              border === "#9D9D9D" ? "rgb(157, 157, 157)" : "rgb(18, 52, 86)",
          });
        }
        const cards = await payments
          .locator("li")
          .filter({ has: page.locator("svg") })
          .evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return {
                radius: style.borderRadius,
                overflow: style.overflow,
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
              };
            }),
          );
        assert.deepEqual(
          cards,
          Array.from({ length: 5 }, () => ({
            radius: `${extraSmall}px`,
            overflow: "hidden",
            width: 38,
            height: 24,
          })),
        );
      }
      for (const selector of [currency, language]) {
        await selector.click();
        await expect(
          page.locator("[data-radix-popper-content-wrapper]"),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
          page.locator("[data-radix-popper-content-wrapper]"),
        ).toHaveCount(0);
        await expect(selector).toBeFocused();
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
