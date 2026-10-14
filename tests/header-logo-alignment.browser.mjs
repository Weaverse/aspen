import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const header = await readFile(
  `${root}app/components/layout/header.tsx`,
  "utf8",
);
const wrapperClass = header.match(/"(col-start-2 row-start-1 [^"]+)"/)?.[1];
const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Logo} from './app/components/logo'; window.logoSettings={designSystemPreset:'aspen'}; const root=createRoot(document.getElementById('root')); window.renderLogo=(settings, className)=>{window.logoSettings=settings;root.render(React.createElement('div',{id:'nav',className:'grid items-center',style:{height:80}},React.createElement('div',{className},React.createElement(Logo))));};`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "logo-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^~\/components\/link$|^~\/hooks\/use-shop-menu$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const useThemeSettings=()=>window.logoSettings; export const useTranslation=()=>({t:k=>k});`
              : path.includes("use-shop-menu")
                ? `export const useShopMenu=()=>({shopName:'Test shop'});`
                : path === "@shopify/hydrogen"
                  ? `import React from 'react'; export const Image=({data,sizes,...props})=>React.createElement('img',{...props,src:data.url});`
                  : `import React from 'react'; export const Link=({to,prefetch,...props})=>React.createElement('a',{...props,className:props.className+' leading-none text-sm',href:to});`,
          loader: "js",
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
const css = stylesheet.build([
  ...wrapperClass.split(" "),
  "grid",
  "flex",
  "items-center",
  "justify-center",
  "inline-flex",
  "h-full",
  "w-auto",
  "h-8",
  "w-36",
  "leading-none",
  "text-sm",
  "relative",
  "mx-auto",
  "max-w-full",
  "object-contain",
]);

test("Logo wrapper classes are runtime data, not executable fixture source", async () => {
  expect(bundle.outputFiles[0].text.includes(wrapperClass)).toBe(false);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const untrustedClass =
      'col-start-2 </script><script>window.logoInjected=true</script> " \\ \u2028 \u2029';
    await page.evaluate(
      ({ settings, className }) => window.renderLogo(settings, className),
      {
        settings: { designSystemPreset: "aspen" },
        className: untrustedClass,
      },
    );
    await expect(page.locator("#nav > div")).toHaveAttribute(
      "class",
      untrustedClass,
    );
    expect(await page.evaluate(() => window.logoInjected)).toBeUndefined();
    await expect(page.locator("script")).toHaveCount(1);
  } finally {
    await browser.close();
  }
});

test("Header logo stays vertically centered for wordmark, custom image and shop-name fallback", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(
      `<style>${css}:root{--body-base-size:14px;--body-base-line-height:1.6;}</style><div id="root"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const width of [390, 1032, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const settings of [
        { designSystemPreset: "aspen" },
        { designSystemPreset: "custom" },
        {
          designSystemPreset: "custom",
          logoWidth: 144,
          logoData: {
            url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="144" height="32"><rect width="144" height="32"/></svg>',
          },
        },
      ]) {
        await page.evaluate(
          ({ logoSettings, className }) =>
            window.renderLogo(logoSettings, className),
          { logoSettings: settings, className: wrapperClass },
        );
        await expect(page.locator("#nav a")).toBeVisible();
        // The logo wrapper must not create an inline baseline gap below the link.
        await expect(page.locator("#nav > div")).toHaveCSS("display", "flex");
        const offset = await page.locator("#nav").evaluate((nav) => {
          const box = nav.getBoundingClientRect();
          const link = nav.querySelector("a");
          const logo = (
            link.querySelector("svg, img") || link.firstElementChild
          ).getBoundingClientRect();
          return Math.abs(logo.y + logo.height / 2 - box.y - box.height / 2);
        });
        expect(offset).toBeLessThan(0.5);
      }
    }
  } finally {
    await browser.close();
  }
});
