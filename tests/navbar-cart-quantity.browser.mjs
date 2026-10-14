import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(
  `${root}app/components/layout/cart-drawer.tsx`,
  "utf8",
);
const triggerClass = source.match(/className="([^"]+)"\s*>\s*<span/)?.[1];
const quantityClass = source.match(
  /<span\s+className="([^"]+)"\s*>\s*\{cart.totalQuantity\}/,
)?.[1];
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build([
  ...triggerClass.split(" "),
  ...quantityClass.split(" "),
  "size-5",
]);

test("Navbar cart count uses Figma typography and icon-relative offsets at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [375, 768, 1032, 1033, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const quantity of [1, 6, 10, 89, 100]) {
        await page.setContent(
          `<style>${css}:root{--body-base-size:14px;--color-text:#343231;}body{color:var(--color-text)}</style><button style="margin:40px" class="${triggerClass}"><span class="size-5"></span><span id="quantity" class="${quantityClass}">${quantity}</span></button>`,
        );
        const count = page.locator("#quantity");
        await expect(count).toHaveCSS("position", "relative");
        await expect(count).toHaveCSS("font-size", "12px");
        await expect(count).toHaveCSS("font-weight", "400");
        await expect(count).toHaveCSS("line-height", "12px");
        await expect(count).toHaveCSS("letter-spacing", "0.24px");
        await expect(count).toHaveCSS("color", "rgb(52, 50, 49)");
        const geometry = await count.evaluate((element) => {
          const countBox = element.getBoundingClientRect();
          const trigger = element.parentElement.getBoundingClientRect();
          return {
            aboveIcon:
              element.parentElement.firstElementChild.getBoundingClientRect()
                .top - countBox.top,
            top: countBox.top - trigger.top,
            gap:
              countBox.left -
              element.parentElement.firstElementChild.getBoundingClientRect()
                .right,
            triggerWidth: trigger.width,
            countWidth: countBox.width,
          };
        });
        expect(geometry.top).toBeCloseTo(-4);
        expect(geometry.aboveIcon).toBeCloseTo(4);
        expect(geometry.gap).toBeCloseTo(0);
        expect(geometry.triggerWidth).toBeCloseTo(20 + geometry.countWidth);
      }
    }
  } finally {
    await browser.close();
  }
});

test("Cart count stays inside full-width headers and inherits custom/transparent header colors", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1032, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const color of ["rgb(255, 255, 255)", "rgb(255, 215, 0)"]) {
        for (const quantity of [1, 89, 100, 9999]) {
          await page.setContent(
            `<style>${css}:root{--body-base-size:14px;--color-text:#343231;}body{margin:0}header{display:flex;justify-content:flex-end;color:${color};background:black}</style><header><button class="${triggerClass}"><span class="size-5"></span><span id="quantity" class="${quantityClass}">${quantity}</span></button></header>`,
          );
          const count = page.locator("#quantity");
          const bounds = await count.boundingBox();
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
          // Assert the visible count, not the existing expanded ::before hit area.
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          await expect(count).toHaveCSS("color", color);
        }
      }
    }
  } finally {
    await browser.close();
  }
});
