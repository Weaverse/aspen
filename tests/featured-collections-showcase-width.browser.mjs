import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

// Use the actual showcase heading classes and compiled storefront CSS.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(
  `${root}app/sections/collection-list-dynamic/collection-items.tsx`,
  "utf8",
);
const editorial = source.slice(source.indexOf("const renderEditorialCard"));
const headingClass = editorial.match(/<h3 className="([^"]+)"/)[1];
const backgroundSource = await readFile(
  `${root}app/sections/collection-list-dynamic/collection-card-overlay.tsx`,
  "utf8",
);
const backgroundClass = backgroundSource
  .slice(backgroundSource.indexOf("export function CollectionNameBackground"))
  .match(/className="([^"]+)"/)[1];
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  {
    base: `${root}app/styles`,
    onDependency: () => undefined,
  },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Style 3 name background spans the card at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, 900, 1024, 1025, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(`<style>${css}</style>
        <a class="relative block" style="width: ${width * 0.6}px; height: 400px">
          <h3 class="${headingClass}"><span class="absolute inset-0" style="background: red; opacity: .7"></span><span class="relative">Collection</span></h3>
        </a>`);
      const edges = await page.locator("h3").evaluate((heading) => {
        const card = heading.parentElement.getBoundingClientRect();
        const background = heading.firstElementChild.getBoundingClientRect();
        return {
          left: background.left - card.left,
          right: card.right - background.right,
        };
      });
      assert.ok(
        Math.abs(edges.left) < 1 && Math.abs(edges.right) < 1,
        `${width}px background must reach both edges: ${JSON.stringify(edges)}`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Style 3 separates desktop effects from shared tablet/mobile effects", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, 1024, 1025, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(`<style>${css}</style><div class="relative" style="height: 100px">
        <span class="${backgroundClass}" style="--collection-mobile-effect-color:#CABDB7;--collection-mobile-effect-opacity:.9;--collection-desktop-effect-color:#000000;--collection-desktop-effect-opacity:.5"></span></div>`);
      const background = page.locator("span");
      let effect = await background.evaluate((element) => ({
        color: getComputedStyle(element).backgroundColor,
        opacity: getComputedStyle(element).opacity,
      }));
      assert.deepEqual(
        effect,
        width < 1025
          ? { color: "rgb(202, 189, 183)", opacity: "0.9" }
          : { color: "rgb(0, 0, 0)", opacity: "0.5" },
      );
      await background.evaluate((element) => {
        element.style.setProperty(
          "--collection-mobile-effect-color",
          "#FF0000",
        );
        element.style.setProperty("--collection-mobile-effect-opacity", "0.7");
      });
      effect = await background.evaluate((element) => ({
        color: getComputedStyle(element).backgroundColor,
        opacity: getComputedStyle(element).opacity,
      }));
      assert.deepEqual(
        effect,
        width < 1025
          ? { color: "rgb(255, 0, 0)", opacity: "0.7" }
          : { color: "rgb(0, 0, 0)", opacity: "0.5" },
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
