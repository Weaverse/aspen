import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import Badge from "./app/sections/highlights/badge";
      const root = createRoot(document.getElementById("root"));
      window.renderBadge = (props) => root.render(React.createElement(Badge, props));
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
      name: "highlights-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^~\/hooks\/use-translated-text$|^~\/components\/(heading|link)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? "export const createSchema = (schema) => schema; export const useTranslation = () => ({ t: (key) => key });"
              : path.includes("use-translated-text")
                ? "export const useTranslatedText = () => (value) => value;"
                : "export const headingInputs = []; export default function Component() { return null; }",
          loader: "js",
        }));
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  {
    base: `${root}app/styles`,
    onDependency: () => undefined,
  },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Highlights built-in icons match the design across breakpoints and retain Studio controls", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root { --color-text: #343231; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const icon = page.locator("#root > div > div:first-child > div");
      for (const [iconType, size] of [
        ["circle", 40],
        ["square", 36],
        ["triangle", 48],
      ]) {
        await page.evaluate(
          (type) => window.renderBadge({ iconType: type }),
          iconType,
        );
        await expect(icon).toHaveCSS("width", `${size}px`);
        await expect(icon).toHaveCSS("height", `${size}px`);
        await expect(icon).toHaveCSS("background-color", "rgb(52, 50, 49)");
        if (iconType === "circle") {
          const radius = await icon.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
          );
          expect(radius).toBeGreaterThanOrEqual(size / 2);
        }
        if (iconType === "triangle") {
          await expect(icon).toHaveCSS(
            "clip-path",
            "polygon(50% 0%, 0% 100%, 100% 100%)",
          );
        }
      }
      await page.evaluate(() =>
        window.renderBadge({ iconType: "square", badgeTextColor: "#ff0000" }),
      );
      await expect(icon).toHaveCSS("background-color", "rgb(255, 0, 0)");
      await page.evaluate(() => window.renderBadge({ showIcon: false }));
      await expect(icon).toHaveCount(0);
      await page.evaluate(() =>
        window.renderBadge({
          iconType: "custom",
          customIcon: '<svg width="48" height="48"></svg>',
        }),
      );
      await expect(icon).toHaveCSS("width", "48px");
      await expect(icon.locator("svg")).toHaveCount(1);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
