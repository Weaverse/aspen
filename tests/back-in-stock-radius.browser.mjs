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
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {BackInStockForm} from './app/components/product/back-in-stock-form';
      const root = createRoot(document.getElementById('root'));
      window.renderForm = (settings = {}) => {
        window.klaviyoConfigured = settings.configured ?? true;
        root.render(<BackInStockForm variantId='variant-1' availableForSale={false} {...settings}/>);
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
      name: "back-in-stock-fixture",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen":
            "const t=key=>key; export const useTranslation=()=>({t});",
          "react-router":
            "export const useFetcher=()=>({state:'idle',Form:'form'}); export const useRouteLoaderData=()=>({integrations:{klaviyo:window.klaviyoConfigured}});",
        };
        builder.onResolve({ filter: /./ }, ({ path }) =>
          path in stubs ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /./, namespace: "fixture" }, ({ path }) => ({
          contents: stubs[path],
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

test("back-in-stock frame follows radius-md on all layouts without changing visibility gates", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root {--radius-md:12px;}</style><div id='root'></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderForm());
      const frame = page.locator("#root > div");
      await expect(frame).toHaveCSS("border-radius", "12px");
      await expect(page.locator('input[name="variantId"]')).toHaveValue(
        "variant-1",
      );
      await page.addStyleTag({ content: ":root {--radius-md:18px;}" });
      await expect(frame).toHaveCSS("border-radius", "18px");
      for (const settings of [
        { availableForSale: true },
        { enabled: false },
        { configured: false },
        { variantId: null },
      ]) {
        await page.evaluate((value) => window.renderForm(value), settings);
        await expect(frame).toHaveCount(0);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
