import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const item = await readFile(
  `${root}app/sections/testimonials/testimonials-item.tsx`,
  "utf8",
);
const content = await readFile(
  `${root}app/sections/testimonials/content.tsx`,
  "utf8",
);
const itemClass = item.match(/"(mx-auto grid[^"]+)"/)[1];
const contentClass = content.match(/"(order-2 flex[^"]+)"/)[1];
const imageSource = await readFile(
  `${root}app/sections/testimonials/hotspot-item.tsx`,
  "utf8",
);
const imageClass = imageSource.match(/"(relative order-1[^"]+)"/)[1];
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

test("Testimonials tablet image reaches the edge while text retains its own padding", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      390,
      767,
      768,
      834,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<!doctype html><style>${css}:root{--page-padding:32px}</style>
        <section><div id="item" class="${itemClass}"><div id="content" class="${contentClass}"><p>Testimonial</p></div><div id="image" class="${imageClass}" style="height:400px"></div></div></section>`);
      const geometry = await page.locator("#item").evaluate((el) => {
        const image = el.querySelector("#image").getBoundingClientRect();
        const text = el.querySelector("#content");
        const imageStyle = getComputedStyle(el.querySelector("#image"));
        return {
          width: el.getBoundingClientRect().width,
          imageWidth: image.width,
          rightGap: el.getBoundingClientRect().right - image.right,
          paddingLeft: getComputedStyle(text).paddingLeft,
          paddingRight: getComputedStyle(text).paddingRight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          topLeftRadius: imageStyle.borderTopLeftRadius,
          topRightRadius: imageStyle.borderTopRightRadius,
          bottomLeftRadius: imageStyle.borderBottomLeftRadius,
          bottomRightRadius: imageStyle.borderBottomRightRadius,
        };
      });
      assert.equal(geometry.overflow, false);
      if (width >= 768 && width <= TABLET_MAX_PX) {
        assert.equal(geometry.rightGap, 0);
        assert.equal(geometry.imageWidth, width / 2);
        assert.equal(geometry.paddingLeft, "32px");
        assert.equal(geometry.paddingRight, "32px");
        assert.equal(geometry.topRightRadius, "0px");
        assert.equal(geometry.bottomRightRadius, "0px");
      } else {
        assert.equal(geometry.rightGap, width < 768 ? 0 : 32);
        assert.equal(geometry.paddingLeft, width < 768 ? "20px" : "0px");
        assert.equal(geometry.topRightRadius, geometry.topLeftRadius);
        assert.equal(geometry.bottomRightRadius, geometry.bottomLeftRadius);
      }
      if (width < 768) {
        assert.equal(geometry.topLeftRadius, "0px");
        assert.equal(geometry.bottomLeftRadius, "0px");
      } else {
        assert.notEqual(geometry.topLeftRadius, "0px");
        assert.notEqual(geometry.bottomLeftRadius, "0px");
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
