import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const root = fileURLToPath(new URL("../", import.meta.url));
const tracks = [
  ["app/components/product/quick-shop.tsx", "h-1 w-full"],
  ["app/components/cart/cart-summary.tsx", "relative h-1 w-full"],
  ["app/sections/main-product/index.tsx", "flex h-1 overflow-hidden"],
  ["app/sections/ali-reviews/review-bar.tsx", "h-1.5 w-72"],
  ["app/sections/judgeme-reviews/review-form.tsx", "h-2 overflow-hidden"],
  ["app/components/product/product-media.tsx", "absolute left-1/2 z-[5]"],
  ["app/sections/promotion-grid/dots.tsx", "flex min-w-0 overflow-hidden"],
  ["app/sections/slideshow/dots.tsx", "pointer-events-auto flex h-1"],
  ["app/components/root/global-loading.tsx", "fixed inset-x-0 top-0"],
];

test("all progression tracks use the shared small radius without responsive overrides", async () => {
  const classes = await Promise.all(
    tracks.map(async ([file, marker]) => {
      const source = await readFile(`${root}${file}`, "utf8");
      const line = source.split("\n").find((entry) => entry.includes(marker));
      assert.ok(line, `${file}: track exists`);
      const className = line.match(/"([^"]+)"/)?.[1];
      assert.ok(className?.includes("rounded-(--radius-sm)"), file);
      assert.ok(className.includes("overflow-hidden"), file);
      return className;
    }),
  );
  const stylesheet = await compile(
    await readFile(`${root}app/styles/app.css`, "utf8"),
    { base: `${root}app/styles`, onDependency: () => undefined },
  );
  const css = stylesheet.build(
    new Scanner({
      sources: [
        { base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false },
      ],
    }).scan(),
  );
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--radius-sm:8px}</style>${classes.map((value, index) => `<div data-track="${index}" class="${value}"></div>`).join("")}`,
      );
      for (const radius of [8, 12]) {
        await page.evaluate((value) => {
          document.documentElement.style.setProperty(
            "--radius-sm",
            `${value}px`,
          );
        }, radius);
        const actual = await page
          .locator("[data-track]")
          .evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return [style.borderRadius, style.overflow];
            }),
          );
        assert.deepEqual(
          actual,
          tracks.map(() => [`${radius}px`, "hidden"]),
        );
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
