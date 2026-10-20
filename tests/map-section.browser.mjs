import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import MapSection from "./app/sections/map/map";
      import Address from "./app/sections/map/address";

      const root = createRoot(document.getElementById("root"));
      window.renderMap = (layoutMap) => root.render(
        React.createElement(
          MapSection,
          { layoutMap, heading: "OUR STORES", panelBackgroundColor: "#FFFFFF" },
          ...["First address", "Second address", "Third address"].map((address,itemIndex)=>React.createElement(Address,{key:address,address,nameStore:"Store "+(itemIndex+1),itemIndex})),
        ),
      );
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "map-section-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "weaverse",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /~\/components\/heading$/ }, () => ({
          path: "heading",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /~\/components\/section$/ }, () => ({
          path: "section",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          if (path === "weaverse") {
            return {
              contents: `
                export const IMAGES_PLACEHOLDERS = ${JSON.stringify(IMAGES_PLACEHOLDERS)};
                export const useChildInstances = () => [
                  { _id: "fixture-address", data: { type: "address-item", address: "First address" } },
                ];
                export const useItemInstance = () => null;
                export const useParentInstance = () => null;
                export const useTranslation = () => ({ t: (key) => key });
              `,
              loader: "js",
              resolveDir: root,
            };
          }
          if (path === "translation") {
            return {
              contents:
                "export const useTranslatedText = () => (value) => value;",
              loader: "js",
              resolveDir: root,
            };
          }
          if (path === "heading") {
            return {
              contents: `
                import React from "react";
                export default function Heading({ content, className }) {
                  return React.createElement("h2", { className }, content);
                }
              `,
              loader: "js",
              resolveDir: root,
            };
          }
          return {
            contents: `
              import React from "react";
              export const sectionSettings = [];
              export const Section = React.forwardRef(
                ({ children }, ref) => React.createElement("section", { ref }, children),
              );
            `,
            loader: "js",
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
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Style 1 tablet stacks a full-width map above selectable stores with design spacing", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      390,
      767,
      768,
      834,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1280,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 1400 } });
      await page.route("https://maps.google.com/**", (route) => route.abort());
      await page.setContent(
        `<!doctype html><style>${css}:root{--radius-md:12px;--page-width:1440px;--page-padding:32px;--section-padding-y:80px}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderMap("list"));
      const map = page.locator("iframe");
      await expect(map).toHaveAttribute("src", /First%20address/);
      await page
        .getByRole("button", { name: "Store 2 Second address" })
        .click();
      await expect(map).toHaveAttribute("src", /Second%20address/);
      await expect(
        page.getByRole("button", { name: "Store 2 Second address" }),
      ).toHaveAttribute("aria-pressed", "true");
      const geometry = await page.locator("section > div").evaluate((row) => {
        const frame = row.querySelector("iframe").parentElement;
        const info = row.firstElementChild;
        const r = row.getBoundingClientRect(),
          f = frame.getBoundingClientRect(),
          i = info.getBoundingClientRect();
        return {
          width: r.width,
          mapWidth: f.width,
          mapHeight: f.height,
          gap: i.top - f.bottom,
          left: getComputedStyle(info).paddingLeft,
          right: getComputedStyle(info).paddingRight,
          bottom: r.bottom - i.bottom,
          radius: getComputedStyle(frame).borderTopLeftRadius,
          columns: getComputedStyle(row).gridTemplateColumns.split(" ").length,
          infoWidth: i.width,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(geometry.overflow, false);
      if (width >= 768 && width <= TABLET_MAX_PX) {
        assert.equal(geometry.mapWidth, width);
        assert.ok(Math.abs(geometry.mapHeight - (width * 9) / 16) < 1);
        assert.equal(geometry.gap, 40);
        assert.equal(geometry.left, "32px");
        assert.equal(geometry.right, "32px");
        assert.equal(geometry.bottom, 80);
        assert.equal(geometry.radius, "0px");
        assert.equal(geometry.columns, 1);
      } else if (width >= DESKTOP_MIN_PX) {
        assert.equal(geometry.columns, 2);
        assert.equal(geometry.infoWidth, 280);
        assert.equal(geometry.radius, "12px");
      } else {
        assert.ok(Math.abs(geometry.mapHeight - (width * 469.125) / 375) < 1);
        assert.equal(geometry.columns, 1);
        assert.equal(geometry.left, "24px");
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Style 2 map panel uses the medium theme radius at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1280, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(
        `<style>${css}:root { --radius-md: 12px; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderMap("accordion"));
      const panel = page.locator("section > div > div").last();
      await expect(panel).toHaveCSS("border-radius", "12px");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
