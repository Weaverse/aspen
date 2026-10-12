import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(
  `${root}app/components/layout/predictive-search/search-desktop/predictive-search-result.tsx`,
  "utf8",
);
const collection = source.slice(
  source.indexOf("function CollectionResultItem("),
);
const classes = [...collection.matchAll(/className="([^"]+)"/g)].map(
  (match) => match[1],
);
const [, cardClass, frameClass, imageClass] = classes;
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(classes.flatMap((value) => value.split(" ")));

test("Search collection image zoom is desktop-only, clipped, and motion-safe", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [375, 768, 1032, 1033, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(
        `<style>${css}</style><a href="/collections/tables" style="width:258px;margin:40px" class="${cardClass}"><div id="frame" class="${frameClass}"><div id="image" class="${imageClass}"><img alt="Tables" style="width:100%;height:100%" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='258' height='194'%3E%3C/svg%3E"></div></div><span>Tables</span></a>`,
      );
      const card = page.locator("a");
      const image = page.locator("#image");
      const frame = page.locator("#frame");
      const before = await card.boundingBox();
      await expect(frame).toHaveCSS("overflow", "hidden");
      await card.hover();
      await expect(image).toHaveCSS("scale", width >= 1033 ? "1.05" : "none");
      expect(await card.boundingBox()).toEqual(before);
      await page.mouse.move(0, 0);
      await expect(image).toHaveCSS("scale", "none");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("a").hover();
    await expect(page.locator("#image")).toHaveCSS("scale", "none");
    await expect(page.locator("#image")).toHaveCSS("transition-duration", "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const touch = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: true,
    });
    const touchPage = await touch.newPage();
    await touchPage.setContent(await page.content());
    await touchPage.locator("a").hover();
    await expect(touchPage.locator("#image")).toHaveCSS("scale", "none");
    await touch.close();
  } finally {
    await browser.close();
  }
});
