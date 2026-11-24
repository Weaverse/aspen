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
    contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ProductCardWishlistButton} from './app/components/wishlist/product-card-wishlist-button';
    const root=createRoot(document.getElementById('root'));
    window.renderCard=({appearance='aspen',saved=false,showOnMobile=false,showOnTablet=false}={})=>{
      window.settings={pcardWishlistAppearance:appearance};window.saved=saved;
      window.data={themivoAppearance:{customIcon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',cardPosition:'top-right'}};
      root.render(<ProductCardWishlistButton productId="gid://shopify/Product/123" productTitle="Chair" showOnMobile={showOnMobile} showOnTablet={showOnTablet}/>);
    };`,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "wishlist-fixture",
      setup(builder) {
        const mocks = {
          "@weaverse/hydrogen/react-router":
            "export const useThemeSettings=()=>window.settings;export const useTranslation=()=>({t:key=>key});",
          "react-router": "export const useRouteLoaderData=()=>window.data;",
          "./wishlist-provider":
            "export const useWishlist=()=>({isHidden:()=>false,isLoading:false,isUpdating:()=>false,isWishlisted:()=>window.saved,themivo:true,toggle:()=>{window.toggled=true;}});",
        };
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          path in mocks ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: mocks[path],
          loader: "js",
        }));
      },
    },
  ],
});
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);
test("Aspen card visibility is opt-in below desktop; Themivo cards and custom saved states remain usable", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<style>${css}</style><div id="root" class="relative size-64"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.renderCard());
      const button = page.getByRole("button", {
        name: "wishlist.add",
        includeHidden: true,
      });
      await expect(button).toBeVisible({ visible: width >= 1033 });
      await page.evaluate(() => window.renderCard({ showOnTablet: true }));
      await expect(button).toBeVisible({ visible: width >= 768 });
      await page.evaluate(() => window.renderCard({ showOnMobile: true }));
      await expect(button).toBeVisible();
      await page.evaluate(() => window.renderCard({ appearance: "themivo" }));
      await expect(button).toBeVisible();
      await expect(button.locator("img")).toHaveCSS("opacity", "0.4");
      await button.click();
      expect(await page.evaluate(() => window.toggled)).toBe(true);
      await page.evaluate(() =>
        window.renderCard({ appearance: "themivo", saved: true }),
      );
      const saved = page.getByRole("button", { name: "wishlist.remove" });
      await expect(saved).toHaveAttribute("aria-pressed", "true");
      await expect(saved.locator("img")).toHaveCSS("opacity", "1");
    }
  } finally {
    await browser.close();
  }
});
