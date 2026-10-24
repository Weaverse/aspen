import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const headerSource = await readFile(
  `${root}app/components/layout/header.tsx`,
  "utf8",
);
const logoSource = await readFile(`${root}app/components/logo.tsx`, "utf8");
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  [...`${headerSource}\n${logoSource}`.matchAll(/"([^"\n]+)"/g)].flatMap(
    (match) => match[1].split(/\s+/),
  ),
);
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {Header} from './app/components/layout/header';import {GlobalStyle} from './app/weaverse/style';const root=createRoot(document.getElementById('root'));window.renderHeader=settings=>{window.settings=settings;root.render(<><GlobalStyle/><div id="announcement" style={{height:44}}/><Header/></>);};`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "navbar-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^@shopify\/hydrogen$|^@phosphor-icons\/react$|^react-router$|^react-use\/esm\/useWindowScroll$|^~\/components\/link$|^~\/hooks\/use-shop-menu$|^\.\/cart-drawer$|^\.\/desktop-menu$|^\.\/mobile-menu$|^\.\/predictive-search\//,
          },
          ({ path }) => ({ path, namespace: "navbar-fixture" }),
        );
        builder.onLoad(
          { filter: /.*/, namespace: "navbar-fixture" },
          ({ path }) => {
            const modules = {
              "@weaverse/hydrogen": `export const useThemeSettings=()=>window.settings;export const useTranslation=()=>({t:k=>k});`,
              "react-router": `export const useLocation=()=>({pathname:'/'});export const useRouteError=()=>null;export const useRouteLoaderData=()=>({});export const Await=({children})=>children(false);`,
              "react-use/esm/useWindowScroll": `export default ()=>({y:0});`,
              "~/hooks/use-shop-menu": `export const useShopMenu=()=>({shopName:'Aspen'});`,
              "~/components/link": `export const Link=({to,prefetch,...props})=><a href={to} {...props}/>;export default Link;`,
              "@phosphor-icons/react": `export const UserIcon=props=><svg {...props}/>;`,
              "@shopify/hydrogen": `export const Image=({data,sizes,...props})=><img src={data.url} {...props}/>;`,
              "./cart-drawer": `export const CartDrawer=()=> <button aria-label="Open cart" className="size-5"/>;`,
              "./desktop-menu": `export const DesktopMenu=()=> <nav aria-label="Desktop menu"/>;`,
              "./mobile-menu": `export const MobileMenu=()=> <button aria-label="Open menu" className="size-5"/>;`,
              "./predictive-search/search-mobile": `export const PredictiveSearchButtonMobile=()=> <button aria-label="Open search" className="size-5 xl:hidden"/>;`,
              "./predictive-search/search-desktop": `export const PredictiveSearchButtonDesktop=()=> <button aria-label="Desktop search" className="hidden size-5 xl:block"/>;`,
            };
            return {
              contents: `import React from 'react';${modules[path]}`,
              loader: "tsx",
              resolveDir: root,
            };
          },
        );
      },
    },
  ],
});

test("Real Header matches Figma navbar geometry without changing Custom or desktop layouts", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const preset of ["aspen-2026", "custom"]) {
      for (const headerWidth of ["full", "stretch", "fixed"]) {
        await page.evaluate((settings) => window.renderHeader(settings), {
          designSystemPreset: preset,
          headerWidth,
          navHeightMobile: 4,
          navHeightTablet: 5,
          navHeightDesktop: 6,
        });
        for (const [width, height] of [
          [320, 76],
          [430, 76],
          [511, 76],
          [512, 84],
          [768, 84],
          [834, 84],
          [1032, 84],
          [1033, 89],
          [1280, 82],
          [1440, 82],
        ]) {
          await page.setViewportSize({ width, height: 900 });
          const expected =
            preset === "custom"
              ? width < 512
                ? 65
                : width < 1280
                  ? 81
                  : 97
              : height;
          await expect(page.locator("header")).toHaveCSS(
            "height",
            `${expected}px`,
          );
          if (preset !== "custom") {
            const geometry = await page.locator("header").evaluate((header) => {
              const rect = header.getBoundingClientRect();
              const logo = header
                .querySelector("a svg")
                .getBoundingClientRect();
              return {
                logoWidth: logo.width,
                logoHeight: logo.height,
                logoCenter: logo.y + logo.height / 2,
                headerCenter: rect.y + rect.height / 2,
                combinedHeight:
                  rect.bottom -
                  document
                    .getElementById("announcement")
                    .getBoundingClientRect().top,
                overflow:
                  document.documentElement.scrollWidth >
                  document.documentElement.clientWidth,
              };
            });
            expect(geometry.logoWidth).toBe(144);
            expect(geometry.logoHeight).toBe(32);
            expect(
              Math.abs(geometry.logoCenter - geometry.headerCenter),
            ).toBeLessThanOrEqual(0.5);
            expect(geometry.combinedHeight).toBe(height + 44);
            expect(geometry.overflow).toBe(false);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
});
