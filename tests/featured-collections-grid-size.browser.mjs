import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Measure the real Style 1 wrapper/card classes with storefront CSS, without CMS.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(
  `${root}app/sections/collection-list-dynamic/collection-items.tsx`,
  "utf8",
);
const gridClass = source.match(/"(grid w-full [^"]+)"/)[1];
const cardClass = source
  .slice(source.indexOf("const renderGridCard"))
  .match(/className="([^"]+)"/)[1];
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

const sectionBundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import FeaturedCollections from "./app/sections/collection-list-dynamic";
      import CollectionItems from "./app/sections/collection-list-dynamic/collection-items";
      const collections = [0,1,2].map(index=>({id:String(index),title:"Collection "+index,handle:"collection-"+index}));
      window.start = ({layout="grid", gap=64, verticalPadding="medium", actualItems=false}) =>
        createRoot(document.getElementById("root")).render(
          <FeaturedCollections layout={layout} gap={gap} width="fixed" verticalPadding={verticalPadding}>
            <div id="content" style={{height:160}}>Heading, description and link</div>
            {actualItems
              ? <CollectionItems loaderData={collections} gap={16} desktopGap={20}/>
              : <div id="items" data-collection-layout={layout} style={{height:400}}>Collections</div>}
          </FeaturedCollections>
        );
    `,
  },
  bundle: true,
  write: false,
  outfile: "section-fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "section-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^\.\/overlay-and-background$|^~\/components\/(image|link)$|^~\/hooks\/use-prefix-path-with-locale$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const IMAGES_PLACEHOLDERS={};export const useThemeSettings=()=>({revealElementsOnScroll:false});export const createSchema=value=>value;export const useTranslation=()=>({t:key=>key});`
              : path === "~/components/link"
                ? `import React from "react";export default React.forwardRef(({to,children,...props},ref)=><a ref={ref} href={to} {...props}>{children}</a>);`
                : path === "~/components/image"
                  ? `export const Image=()=>null;`
                  : path === "~/hooks/use-prefix-path-with-locale"
                    ? `export const usePrefixPathWithLocale=path=>path;`
                    : `export const OverlayAndBackground=()=>null;`,
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});

function expectedSectionGap(width, { layout, gap }) {
  if (layout === "showcase" && width < DESKTOP_MIN_PX) {
    return width < 768 ? 40 : 72;
  }
  if (gap === 32) {
    return width < DESKTOP_MIN_PX ? 16 : 32;
  }
  if (gap === 40) {
    return width < DESKTOP_MIN_PX ? 20 : 40;
  }
  if (width < 768) {
    return layout === "slider" ? 48 : 40;
  }
  return layout === "showcase" && width <= TABLET_MAX_PX ? 72 : 64;
}

test("Featured Collections spacing stays style-scoped and preserves custom settings", async () => {
  assert.match(source, /data-collection-layout="grid"/);
  const browser = await chromium.launch();
  try {
    for (const width of [430, 600, 834, TABLET_MAX_PX, DESKTOP_MIN_PX]) {
      for (const options of [
        { layout: "grid", gap: 64 },
        { layout: "grid", gap: 40 },
        { layout: "slider", gap: 64 },
        { layout: "showcase", gap: 64 },
        { layout: "showcase", gap: 32 },
        { layout: "showcase", gap: 40 },
        { layout: "grid", gap: 32 },
        { layout: "slider", gap: 32 },
        { layout: "grid", gap: 64, verticalPadding: "none" },
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 1400 },
        });
        // Reproduce the theme's current page-padding tokens (including 512px).
        await page.setContent(
          `<!doctype html><style>${css}:root{--page-width:1440px;--page-padding:${width >= DESKTOP_MIN_PX ? 40 : width >= 512 ? 32 : 20}px}</style><div id="root"></div>`,
        );
        await page.addScriptTag({ content: sectionBundle.outputFiles[0].text });
        await page.evaluate((value) => window.start(value), options);
        await page.waitForSelector("#items");
        const layout = await page.locator("section").evaluate((el) => {
          const section = el.getBoundingClientRect();
          const content = el.querySelector("#content").getBoundingClientRect();
          const items = el.querySelector("#items").getBoundingClientRect();
          return {
            top: content.top - section.top,
            bottom: section.bottom - items.bottom,
            left: content.left - section.left,
            right: section.right - content.right,
            gap: items.top - content.bottom,
          };
        });
        const expectedPadding =
          options.layout !== "slider" && width < DESKTOP_MIN_PX
            ? width < 768
              ? 20
              : 32
            : width >= DESKTOP_MIN_PX
              ? 40
              : width >= 512
                ? 32
                : 20;
        assert.equal(layout.left, expectedPadding);
        assert.equal(layout.right, expectedPadding);
        assert.equal(layout.top, options.verticalPadding === "none" ? 0 : 80);
        assert.equal(
          layout.bottom,
          options.verticalPadding === "none" ? 0 : 80,
        );
        assert.equal(
          layout.gap,
          expectedSectionGap(width, options),
          `${width}px ${JSON.stringify(options)}`,
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Style 3 mobile/tablet stacks collections 0/2 beside tall collection 1 while preserving desktop", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      320,
      375,
      430,
      600,
      768,
      834,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 1600 } });
      const tablet = width >= 768 && width <= TABLET_MAX_PX;
      const padding = width >= DESKTOP_MIN_PX ? 40 : width >= 768 ? 32 : 20;
      await page.setContent(
        `<!doctype html><style>${css}:root{--page-width:1440px;--page-padding:${padding}px}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: sectionBundle.outputFiles[0].text });
      await page.evaluate(() =>
        window.start({ layout: "showcase", actualItems: true }),
      );
      const cards = page.locator('[data-collection-layout="showcase"] a');
      await cards.first().waitFor();
      const bounds = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const r = element.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            bottom: r.bottom,
          };
        }),
      );
      assert.equal(bounds.length, 3);
      const [first, second, third] = bounds;
      const stacked = width <= TABLET_MAX_PX ? third : second;
      const tall = width <= TABLET_MAX_PX ? second : third;
      const gap = width >= DESKTOP_MIN_PX ? 20 : 16;
      const expectedWidth = (width - padding * 2 - gap) / 2;
      const ratio = tablet
        ? 4 / 3
        : width >= DESKTOP_MIN_PX
          ? 670 / 504
          : 159.5 / 140.25;
      assert.ok(Math.abs(first.width - expectedWidth) < 0.1);
      assert.ok(
        Math.abs(first.height - expectedWidth / ratio) < 0.1,
        `${width}px left card ratio: ${JSON.stringify(bounds)}`,
      );
      assert.ok(Math.abs(first.height - stacked.height) < 0.1);
      assert.ok(Math.abs(first.x - stacked.x) < 0.1);
      assert.ok(Math.abs(tall.y - first.y) < 0.1);
      assert.ok(Math.abs(tall.bottom - stacked.bottom) < 0.1);
      assert.ok(Math.abs(stacked.y - first.bottom - gap) < 0.1);
      assert.ok(Math.abs(tall.x - first.x - first.width - gap) < 0.1);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Style 1 respects mobile/tablet card sizes, narrow containers and merchant gaps", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      320,
      390,
      430,
      767,
      768,
      820,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      for (const gap of [16, 32]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const containerWidth = width - 40;
        const desktopGap = gap + 4;
        const appliedGap = width >= DESKTOP_MIN_PX ? desktopGap : gap;
        await page.setContent(`<style>${css}</style>
          <div style="width:${containerWidth}px;margin:auto">
            <div class="${gridClass}" style="--gap-mobile:${gap}px;--gap-desktop:${desktopGap}px">
              ${Array.from({ length: 6 }, () => `<a class="${cardClass}">Collection</a>`).join("")}
            </div>
          </div>`);
        const cards = await page.locator("a").evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          }),
        );
        const columns = width < 768 ? 2 : 3;
        const fluidWidth =
          (containerWidth - appliedGap * (columns - 1)) / columns;
        const expectedWidth =
          width >= DESKTOP_MIN_PX
            ? fluidWidth
            : Math.min(fluidWidth, width < 768 ? 187 : 246);
        const expectedHeight =
          width >= DESKTOP_MIN_PX
            ? (expectedWidth * 590.2) / 440
            : width < 768
              ? 249.333
              : 391.107;
        assert.equal(cards.length, 6);
        for (const card of cards) {
          assert.ok(
            Math.abs(card.width - expectedWidth) < 0.1,
            `${width}px gap ${gap}: expected width ${expectedWidth}, got ${card.width}`,
          );
          assert.ok(Math.abs(card.height - expectedHeight) < 0.1);
          assert.ok(card.x >= 0 && card.x + card.width <= width);
        }
        assert.ok(
          Math.abs(cards[1].x - cards[0].x - cards[0].width - appliedGap) < 0.1,
        );
        assert.ok(cards[columns].y > cards[0].y);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
