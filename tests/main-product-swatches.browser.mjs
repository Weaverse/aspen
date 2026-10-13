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
      import {ProductVariants} from './app/sections/main-product/variants';
      const root = createRoot(document.getElementById('root'));
      window.renderSwatches = (productDetailSwatches) => root.render(
        React.createElement(ProductVariants, {
          productDetailSwatches,
          selectedVariant: {selectedOptions: []},
          productOptions: [{name: 'Color', optionValues: [true, false].map((selected) => ({
            name: selected ? 'Cream' : 'Moss', selected, available: true,
            firstSelectableVariant: {}, swatch: {color: '#E2E2D4'},
          }))}],
        }),
      );
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
      name: "swatch-fixture",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen":
            "export const useTranslation = () => ({t: (_, value) => value.value});",
          "react-router": "export const useNavigate = () => () => {};",
          "~/utils/product":
            "export const hasOnlyDefaultVariant = () => false;",
          "@shopify/hydrogen": "export const Image = () => null;",
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

test("main product swatches keep Figma dimensions and theme tokens at all widths", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root {--radius-xs: 4px; --color-line: #9D9D9D; --color-line-subtle: #D8D8D8; --color-background: #fff;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderSwatches(true));
      const selected = page.getByRole("button", { name: "Cream" });
      const unselected = page.getByRole("button", { name: "Moss" });
      await expect(selected).toHaveCSS("border-top-width", "1px");
      await expect(selected).toHaveCSS("border-color", "rgb(157, 157, 157)");
      await expect(unselected).toHaveClass(/border-\[0\.5px\]/);
      await expect(unselected).toHaveCSS("border-color", "rgb(216, 216, 216)");
      for (const button of [selected, unselected]) {
        await expect(button).toHaveCSS("padding", "4px");
        await expect(button).toHaveCSS("border-radius", "4px");
        await expect(button.locator("span")).toHaveCSS("width", "20px");
        await expect(button.locator("span")).toHaveCSS("height", "20px");
        await expect(button.locator("span")).toHaveCSS(
          "border-top-width",
          "0px",
        );
      }
      await page.addStyleTag({
        content: ":root {--radius-xs: 6px; --color-line: #123456;}",
      });
      await expect(selected).toHaveCSS("border-radius", "6px");
      await expect(selected).toHaveCSS("border-color", "rgb(18, 52, 86)");
      await page.evaluate(() => window.renderSwatches(false));
      await expect(selected).toHaveCSS("width", "36px");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
