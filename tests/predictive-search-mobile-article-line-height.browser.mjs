import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = `${root}app/components/layout/predictive-search/search-mobile/predictive-search-result.tsx`;
const linkSource = `${root}app/components/link.tsx`;
const bundle = await build({
  stdin: {
    contents: `import React from "react"; import {createRoot} from "react-dom/client"; import {PredictiveSearchResult} from "${source}"; const items=["Home decor","Interior trends","Add chair to living space"].map((title,index)=>({id:String(index),title,url:"/"})); createRoot(document.getElementById("root")).render(<PredictiveSearchResult items={items} type="pages"/>);`,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "predictive-search-article-fixture",
      setup(builder) {
        builder.onResolve(
          { filter: /^~\/|^\.\.\/suggestion-title$|^@weaverse\/hydrogen$/ },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          if (path.includes("components/link")) {
            return {
              contents:
                'import React from "react"; import {twMerge} from "tailwind-merge"; export const Link=({to,className="",children,...props})=><a href={to} className={twMerge("button inline-flex items-center justify-center gap-2 rounded-sm font-semibold text-sm leading-none",className)} {...props}>{children}</a>; export default Link;',
              loader: "tsx",
              resolveDir: root,
            };
          }
          if (path === "@weaverse/hydrogen") {
            return {
              contents: "export const useTranslation=()=>({t:key=>key});",
              loader: "js",
            };
          }
          if (path.includes("components/image")) {
            return {
              contents:
                'import React from "react"; export const Image=props=><img {...props}/>;',
              loader: "tsx",
              resolveDir: root,
            };
          }
          if (path.includes("variant-prices")) {
            return {
              contents:
                'import React from "react"; export const SpacedMoney=()=>null;',
              loader: "tsx",
              resolveDir: root,
            };
          }
          if (path.includes("product-card-rating")) {
            return {
              contents:
                'import React from "react"; export const ProductCardRating=()=>null;',
              loader: "tsx",
              resolveDir: root,
            };
          }
          if (path.includes("utils/product")) {
            return { contents: "export const isDiscounted=()=>false;" };
          }
          return {
            contents:
              'import React from "react"; export const SuggestionTitle=({title})=><>{title}</>;',
            loader: "tsx",
            resolveDir: root,
          };
        });
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const sources = await Promise.all(
  [source, linkSource].map((path) => readFile(path, "utf8")),
);
const css = stylesheet.build(
  sources.join(" ").match(/[A-Za-z0-9_!()[\]#%.:/,+<>*=&~-]+/g),
);

test("mobile and tablet article suggestions use readable line height", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [390, 768, 1032]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(
        `<style>${css}</style><div id="root"></div><script>${bundle.outputFiles[0].text}</script>`,
      );
      const titles = page.getByRole("link");
      await expect(titles.first()).toHaveCSS("line-height", "20px");

      const first = await titles.first().boundingBox();
      const second = await titles.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(second.y - (first.y + first.height)).toBe(16);
    }
  } finally {
    await browser.close();
  }
});
