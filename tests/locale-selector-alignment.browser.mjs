import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = `${root}app/components/layout/country-selector.tsx`;
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {CountrySelector} from './app/components/layout/country-selector';createRoot(document.getElementById('root')).render(<CountrySelector enableFlag={false}/>);`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "locale-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^~\/utils\/cn$|use-localization-selector$/,
          },
          ({ path, importer }) =>
            importer === source ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const useTranslation=()=>({t:key=>key});`
              : path.includes("use-localization-selector")
                ? `export const useLocalizationSelector=()=>({selectedLabel:'United States - USD',selectedMarketCountry:'US',selectorOptions:[{key:'US',type:'country',country:'US',label:'United States - USD',isSelected:true},{key:'EUR',type:'country',country:'ES',label:'Euro - EUR'}],selectCurrency:()=>{},isChangingCurrency:false});`
                : `export const cn=(...parts)=>parts.filter(Boolean).join(' ');`,
          loader: "js",
        }));
      },
    },
  ],
});

test("Locale dropdown centers on trigger and retains viewport collision protection", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [375, 768, 1032, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(
        `<style>#root{display:flex;justify-content:center;padding-top:40px}button{width:160px}[data-radix-popper-content-wrapper]>div{width:240px;background:white}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const trigger = page.getByRole("button", {
        name: "locale.selectCurrency",
      });
      await trigger.click();
      const content = page.locator("[data-radix-popper-content-wrapper] > div");
      await expect(content).toBeVisible();
      await expect(async () => {
        const a = await trigger.boundingBox();
        const b = await content.boundingBox();
        expect(Math.abs(a.x + a.width / 2 - b.x - b.width / 2)).toBeLessThan(1);
        expect(b.x).toBeGreaterThanOrEqual(12);
        expect(b.x + b.width).toBeLessThanOrEqual(width - 12);
      }).toPass();
      await page.keyboard.press("Escape");
      await expect(content).toBeHidden();
    }
  } finally {
    await browser.close();
  }
});
