import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = `${root}app/components/layout/predictive-search/search-desktop/index.tsx`;
const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {PredictiveSearchResults} from '${source}'; createRoot(document.getElementById('root')).render(React.createElement(PredictiveSearchResults));`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "search-fixture",
      setup(builder) {
        builder.onLoad({ filter: /search-desktop\/index\.tsx$/ }, async () => ({
          contents: `${await readFile(source, "utf8")}\nexport {PredictiveSearchResults};`,
          loader: "tsx",
          resolveDir: fileURLToPath(
            new URL(
              "../app/components/layout/predictive-search/search-desktop/",
              import.meta.url,
            ),
          ),
        }));
        builder.onResolve(
          {
            filter:
              /^~\/|^\.\.\/|^\.\/predictive-search-result$|^@weaverse\/hydrogen$/,
          },
          ({ path, importer }) =>
            importer === source ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: path.includes("use-predictive-search")
            ? `export const usePredictiveSearch=()=>({searchTermValue:'chair',results:['products','collections','pages'].map(type=>({type,items:Array.from({length:21},(_,i)=>({id:type+i,title:type+i,url:'/'}))}))});`
            : path.includes("use-prefix-path")
              ? `export const usePrefixPathWithLocale=p=>p;`
              : path.includes("pinned-collections")
                ? `export const withPinnedCollections=items=>items;`
                : path === "@weaverse/hydrogen"
                  ? `export const useTranslation=()=>({t:k=>k});`
                  : path.includes("predictive-search-result")
                    ? `import React from 'react'; export const PredictiveSearchResult=({items=[]})=>React.createElement('ul',{className:'space-y-4'},items.map(item=>React.createElement('li',{key:item.id,style:{height:20}},item.title)));`
                    : `import React from 'react'; export const PopularSearch=()=>null; export const SuggestionTitle=()=>null; export const PredictiveSearchForm=()=>null; export default p=>React.createElement('a',p,p.children);`,
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
  "grid",
  "pt-7",
  "pb-6",
  "h-7",
  "pt-5",
  "space-y-4",
  "min-h-[355px]",
  "min-h-[359px]",
  "min-h-[598px]",
]);

test("Pages alone reserve two spacing-6 bottom insets and retain eight results", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const frame = page.locator("#root > div");
    const main = page.locator("main");
    await expect(frame).toHaveCSS("padding-bottom", "0px");
    await expect(main).toHaveCSS("padding-bottom", "0px");
    await page.getByRole("button", { name: "search.page (21)" }).click();
    await expect(main.locator("li")).toHaveCount(8);
    await expect(frame).toHaveCSS("padding-bottom", "24px");
    await expect(main).toHaveCSS("padding-bottom", "24px");
    const last = await main.locator("li").last().boundingBox();
    const bounds = await frame.boundingBox();
    expect(bounds.y + bounds.height - last.y - last.height).toBeCloseTo(48, 1);
    await page.getByRole("button", { name: "search.collections (21)" }).click();
    await expect(frame).toHaveCSS("padding-bottom", "0px");
    await expect(main).toHaveCSS("padding-bottom", "0px");
  } finally {
    await browser.close();
  }
});
