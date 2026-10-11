import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

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

test("Highlights icons retain design sizes, Studio controls and legacy custom SVG colors", async () => {
  const browser = await chromium.launch();
  try {
    {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
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
        await expect(icon).toHaveCSS("background-color", "rgb(41, 35, 30)");
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
          customIcon:
            '<svg width="48" height="48"><path fill="#ffffff" d="M0 0h48v48H0z"/></svg>',
        }),
      );
      await expect(icon).toHaveCSS("width", "48px");
      await expect(icon.locator("svg")).toHaveCount(1);
      await expect(icon.locator("path")).toHaveAttribute("fill", "#29231E");
      await page.evaluate(() =>
        window.renderBadge({
          iconType: "custom",
          badgeTextColor: "#ff0000",
          customIcon: '<svg><path fill="#ffffff" d="M0 0h48v48H0z"/></svg>',
        }),
      );
      await expect(icon.locator("path")).toHaveAttribute("fill", "#ff0000");
      await page.route("https://icons.example.test/icon.svg", (route) =>
        route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
        }),
      );
      await page.evaluate(() =>
        window.renderBadge({
          iconType: "custom",
          customIcon: "https://icons.example.test/icon.svg",
        }),
      );
      await expect(icon.locator("img")).toHaveCSS(
        "filter",
        "brightness(0) saturate(1) invert(0.1)",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
