import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const locale = JSON.parse(
  await readFile(`${root}app/locales/en-us.json`, "utf8"),
);
const font = await readFile(
  `${root}node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2`,
);
const openSansFont = await readFile(
  `${root}node_modules/@fontsource/open-sans/files/open-sans-latin-400-normal.woff2`,
);
const sources = await Promise.all(
  [
    "app/sections/collection-filters/tools-bar.tsx",
    "app/routes/($locale).search.tsx",
  ].map((path) => readFile(`${root}${path}`, "utf8")),
);
const drawers = sources
  .map((source, index) => {
    const start = source.indexOf("function FiltersDrawer(");
    const end = source.indexOf("\nfunction ", start + 1);
    return source
      .slice(start, end < 0 ? undefined : end)
      .replace("function FiltersDrawer(", `function FiltersDrawer${index}(`);
  })
  .join("\n");
const bundle = await build({
  stdin: {
    loader: "tsx",
    resolveDir: root,
    contents: `
      import React, {useState} from "react";
      import {createRoot} from "react-dom/client";
      import * as Dialog from "@radix-ui/react-dialog";
      import {XIcon, SlidersIcon} from "@phosphor-icons/react";
      import {useTranslation} from "@weaverse/hydrogen";
      import {AnimatedDrawer} from "./app/components/animate-drawer";
      import {ScrollArea} from "./app/components/scroll-area";
      import {Filters} from "./app/sections/collection-filters/filters";
      import {cn} from "./app/utils/cn";
      type ToolsBarProps = {filtersPosition: "drawer"};
      const Button = ({animate, variant, ...props}) => <button {...props}/>;
      const option = (label) => ({id:label,label,count:10,input:JSON.stringify({variantOption:{name:"Color",value:label}})});
      const list = (id,label,values) => ({id,label,type:"LIST",values:values.map(option)});
      window.fixture = {collection:{id:"fixture",products:{filters:[
        list("stock","Availability",["In stock"]),list("vendor","Vendor",["Example"]),
        {id:"price",label:"Price",type:"PRICE_RANGE",values:[]},
        list("size","Size",["30x40cm","60x80cm","160x160cm","FREEFORM"]),
        list("color","Color",["Camel","Brown","Cream","Flax","Sand","Other 1","Other 2","Other 3"])
      ]},highestPriceProduct:{nodes:[{priceRange:{maxVariantPrice:{amount:"239",currencyCode:"USD"}}}]},
      lowestPriceProduct:{nodes:[{priceRange:{minVariantPrice:{amount:"0",currencyCode:"USD"}}}]}},appliedFilters:[]};
      window.navigations = [];
      ${drawers}
      createRoot(document.getElementById("root")).render(window.kind === "search"
        ? <FiltersDrawer1 appliedFiltersCount={0} disabled={false}/>
        : <FiltersDrawer0 filtersPosition="drawer" appliedFiltersCount={0} disabled={false}/>);
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "filter-data-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@(weaverse|shopify)\/hydrogen$|^react-router$|^~\/hooks\/(use-closest-weaverse-item|use-locale)$|^~\/components\/product\/product-option-values$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "js",
          contents:
            path === "@weaverse/hydrogen"
              ? `const locale=${JSON.stringify(locale)}; export const useTranslation=()=>({t:(key,vars={}) => key.split('.').reduce((v,k)=>v?.[k],locale)?.replace(/{{(.*?)}}/g,(_,k)=>vars[k.trim()]??"")||key});`
              : path === "@shopify/hydrogen"
                ? "export const Image=()=>null;"
                : path === "react-router"
                  ? `export const useLoaderData=()=>window.fixture; export const useRouteLoaderData=()=>({selectedLocale:{language:"EN",country:"US"},swatchesConfigs:{colors:[],images:[]}}); export const useLocation=()=>({pathname:"/collections/fixture"});export const useSearchParams=()=>[new URLSearchParams()];export const useNavigate=()=>(url)=>window.navigations.push(url);`
                  : path.includes("use-closest")
                    ? "export const useClosestWeaverseItem=()=>({data:{}});"
                    : path.includes("use-locale")
                      ? "export const useLocale=()=>({language:'EN',country:'US'});"
                      : "export const OPTIONS_AS_SWATCH=['Color'];",
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

test("desktop Filter matches Figma frame, accordion rhythm, controls and typography for Collection and Search", async () => {
  const browser = await chromium.launch();
  try {
    for (const kind of ["collection", "search"]) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1117 },
      });
      await page.setContent(`<!doctype html><style>${css}
        @font-face{font-family:'DM Sans Variable';font-style:normal;font-weight:100 1000;src:url(data:font/woff2;base64,${font.toString("base64")})}
        @font-face{font-family:'Open Sans';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${openSansFont.toString("base64")})}
        :root{--body-base-size:14px;--color-text:#343231;--color-background:#fff;--color-line:#9d9d9d;--color-line-subtle:#d8d8d8;--radius-sm:8px;--radius-md:12px}
        </style><div id="root"></div>`);
      await page.evaluate((value) => {
        window.kind = value;
      }, kind);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => {
        window.fixture.appliedFilters = [
          {
            label: "Camel",
            filter: { variantOption: { name: "Color", value: "Camel" } },
          },
        ];
      });
      await page
        .getByRole("button", { name: "Filter products", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "Filter", exact: true });
      await expect(dialog.locator(":scope > div")).toHaveCSS(
        "transform",
        "none",
      );
      await page.evaluate(() => document.fonts.ready);
      const metrics = await dialog.evaluate((element) => {
        const panel = element.firstElementChild;
        const bounds = panel.getBoundingClientRect();
        const title = element.querySelector("h2");
        const stock = [...element.querySelectorAll("button")].find(
          (button) => button.textContent === "Stock",
        );
        const accordion = stock.parentElement.parentElement;
        const items = [...accordion.children];
        const priceInput = element.querySelector('input[type="number"]');
        const size = items[3].querySelector('[role="region"] button');
        const checkbox = items[4].querySelector('[role="checkbox"]');
        const checkIcon = checkbox.querySelector("svg");
        const showMore = [...items[4].querySelectorAll("button")].find(
          (button) => button.textContent.startsWith("Show more"),
        );
        const rect = (node) => node.getBoundingClientRect();
        const itemMetrics = items.map((item) => ({
          top: rect(item).top - bounds.top,
          height: rect(item).height,
        }));
        const priceText = items[2].querySelector("p");
        return {
          width: bounds.width,
          left: rect(accordion).left - bounds.left,
          right: bounds.right - rect(accordion).right,
          titleLeft: rect(title).left - bounds.left,
          titleSize: getComputedStyle(title).fontSize,
          titleWeight: getComputedStyle(title).fontWeight,
          closeSize: rect(
            element.querySelector(
              'button[aria-label="Close filter drawer"] svg',
            ),
          ).width,
          items: itemMetrics,
          triggerHeight: rect(stock).height,
          iconSize: rect(stock.querySelector("svg")).width,
          priceGap:
            rect(priceInput.parentElement.parentElement).top -
            rect(priceText).bottom,
          inputHeight: rect(priceInput).height,
          sizeHeight: rect(size).height,
          sizeRadius: getComputedStyle(size).borderTopLeftRadius,
          checkboxSize: rect(checkbox).width,
          checkboxRadius: getComputedStyle(checkbox).borderTopLeftRadius,
          checkIconSize: rect(checkIcon).width,
          showMoreFont: getComputedStyle(showMore).fontFamily,
          openSansLoaded: [...document.fonts].some(
            (face) => face.family === "Open Sans" && face.status === "loaded",
          ),
          titleToContent:
            rect(priceText).top - rect(items[2].querySelector("button")).bottom,
          overflow: panel.scrollWidth > panel.clientWidth,
        };
      });
      expect(metrics.width).toBe(397);
      expect(metrics.left).toBe(44);
      expect(metrics.right).toBe(20);
      expect(metrics.titleLeft).toBe(44);
      expect(metrics.titleSize).toBe("14px");
      expect(metrics.titleWeight).toBe("600");
      expect(metrics.closeSize).toBe(16);
      expect(metrics.triggerHeight).toBe(16);
      expect(metrics.iconSize).toBe(16);
      expect(metrics.items[0].height).toBe(57);
      expect(metrics.items[1].top - metrics.items[0].top).toBe(69);
      expect(Math.abs(metrics.items[0].top - 70)).toBeLessThan(1);
      expect(metrics.titleToContent).toBe(32);
      expect(metrics.priceGap).toBe(16);
      expect(metrics.inputHeight).toBe(46);
      expect(metrics.sizeHeight).toBe(40);
      expect(metrics.sizeRadius).toBe("12px");
      expect(metrics.checkboxSize).toBe(20);
      expect(metrics.checkboxRadius).toBe("8px");
      expect(metrics.checkIconSize).toBe(16);
      expect(metrics.showMoreFont).toContain("Open Sans");
      expect(metrics.openSansLoaded).toBe(true);
      expect(metrics.overflow).toBe(false);
      await dialog
        .getByRole("checkbox", { name: "Brown", exact: true })
        .click();
      expect(await page.evaluate(() => window.navigations.at(-1))).toContain(
        "filter.variantOption=",
      );
      for (const width of [390, 834, 1032, 1033]) {
        await page.setViewportSize({ width, height: 1117 });
        const checkbox = dialog.getByRole("checkbox", {
          name: "Camel",
          exact: true,
        });
        const showMore = dialog.getByRole("button", {
          name: "Show more (3)",
          exact: true,
        });
        await expect(checkbox.locator("svg")).toHaveCSS(
          "width",
          width < 1033 ? "14px" : "16px",
        );
        await expect(showMore).toHaveCSS(
          "font-family",
          width < 1033 ? /DM Sans/ : /Open Sans/,
        );
      }
      await dialog
        .getByRole("button", { name: "Close filter drawer", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
