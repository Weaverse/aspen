import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {GlobalStyle} from './app/weaverse/style';const root=createRoot(document.getElementById('root'));window.renderPreset=preset=>{window.settings={designSystemPreset:preset,navHeightMobile:4,navHeightTablet:5,navHeightDesktop:6};root.render(<GlobalStyle/>);};`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "theme-settings-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "settings",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: `export const useThemeSettings=()=>window.settings;`,
        }));
      },
    },
  ],
});

test("Aspen navbar matches Figma mobile/tablet heights while desktop and Custom heights remain unchanged", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<style>:root{--spacing:0.25rem}#nav{height:var(--height-nav)}</style><div id="root"></div><div id="nav"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const preset of ["aspen", "aspen-2026", "custom"]) {
      await page.evaluate((p) => window.renderPreset(p), preset);
      for (const [width, aspenHeight, customHeight] of [
        [375, 76, 64],
        [430, 76, 64],
        [511, 76, 64],
        [512, 84, 80],
        [768, 84, 80],
        [834, 84, 80],
        [1032, 84, 80],
        [1033, 88, 80],
        [1279, 88, 80],
        [1280, 81, 96],
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator("#nav")).toHaveCSS(
          "height",
          `${preset === "custom" ? customHeight : aspenHeight}px`,
        );
      }
    }
  } finally {
    await browser.close();
  }
});
