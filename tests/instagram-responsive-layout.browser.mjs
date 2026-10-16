import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
async function classes(file, prefix) {
  const source = await readFile(
    `${root}app/sections/instagram/${file}.tsx`,
    "utf8",
  );
  return source.match(new RegExp(`className="(${prefix}[^"]+)"`))[1];
}
const rowClass = await classes("index", "instagram-row");
const contentClass = await classes("content", "instagram-content");
const wrapClass = await classes("slider", "instagram-grid-wrap");
const gridClass = await classes("slider", "instagram-grid grid");
const tileClass = await classes("image", "instagram-tile");
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

test("Instagram tablet keeps content beside a usable horizontal image grid", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      390,
      743,
      767,
      768,
      744,
      820,
      834,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.setContent(`<!doctype html><style>${css}</style>
        <section><div class="${rowClass}"><div class="${contentClass}"><p>Instagram</p><p>Meet the room edits: real life shots of our furniture in action.</p><a>Explore now</a></div><div class="${wrapClass}"><div class="${gridClass}">${Array.from({ length: 8 }, () => `<div class="${tileClass}"><span class="block h-full w-full"></span></div>`).join("")}</div></div></div></section>`);
      const geometry = await page.locator(".instagram-row").evaluate((row) => {
        const content = row
          .querySelector(".instagram-content")
          .getBoundingClientRect();
        const grid = row
          .querySelector(".instagram-grid")
          .getBoundingClientRect();
        const style = getComputedStyle(row);
        return {
          content,
          grid,
          innerWidth:
            row.clientWidth -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight),
          columns: getComputedStyle(
            row.querySelector(".instagram-grid"),
          ).gridTemplateColumns.split(" ").length,
          tiles: [...row.querySelectorAll(".instagram-tile")].map((tile) => ({
            width: tile.getBoundingClientRect().width,
            height: tile.getBoundingClientRect().height,
          })),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(geometry.overflow, false);
      assert.equal(geometry.columns, width < 744 ? 2 : 4);
      for (const tile of geometry.tiles) {
        assert.ok(Math.abs(tile.width - tile.height) < 1);
      }
      if (width < 744) {
        assert.equal(
          geometry.grid.width,
          geometry.innerWidth,
          `${width}px image grid must not be squeezed beside the content card`,
        );
        assert.ok(geometry.grid.top >= geometry.content.bottom);
      } else if (width <= TABLET_MAX_PX) {
        assert.equal(geometry.grid.top, geometry.content.top);
        assert.ok(geometry.grid.left >= geometry.content.right);
        assert.ok(geometry.grid.width >= geometry.content.width * 1.9);
        assert.ok(geometry.tiles.every((tile) => tile.width >= 80));
      } else {
        assert.equal(geometry.content.width, 320);
        assert.equal(geometry.grid.top, geometry.content.top);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Instagram tablet gives a lone Studio block the full available width", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 743, 744, 767, 768, 834, TABLET_MAX_PX]) {
      for (const child of [
        `<div class="${contentClass}">Instagram content</div>`,
        `<div class="${wrapClass}"><div class="${gridClass}">${Array.from({ length: 8 }, () => `<div class="${tileClass}">Image</div>`).join("")}</div></div>`,
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
        });
        await page.setContent(
          `<!doctype html><style>${css}</style><div class="${rowClass}">${child}</div>`,
        );
        const geometry = await page
          .locator(".instagram-row")
          .evaluate((row) => {
            const style = getComputedStyle(row);
            return {
              available:
                row.clientWidth -
                parseFloat(style.paddingLeft) -
                parseFloat(style.paddingRight),
              child: row.firstElementChild.getBoundingClientRect().width,
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          });
        assert.equal(geometry.overflow, false);
        assert.equal(
          geometry.child,
          geometry.available,
          `${width}px lone block must fill the row`,
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
