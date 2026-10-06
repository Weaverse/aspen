import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

// Real section and stylesheet; stub CMS and the generic section wrapper only.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import ImageWithText, { schema } from "./app/sections/image-with-text";
      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.renderSection = (props) => root.render(React.createElement(ImageWithText, props,
        React.createElement("div", { className: "iwt-split-media" },
          React.createElement("div", { className: "rounded-[20px]", style: { height: 100 } }))));
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
      name: "section-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^(@weaverse\/hydrogen|~\/components\/(section|background-image))$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? "export const createSchema = (schema) => schema;"
              : path.endsWith("background-image")
                ? "export const backgroundInputs = [];"
                : `import React from "react";
               export const Section = React.forwardRef(({children, containerClassName, className, style, "data-media-position": position}, ref) =>
                 React.createElement("section", {ref, className, style, "data-media-position": position},
                   React.createElement("div", {className: containerClassName}, children)));`,
          loader: "js",
          resolveDir: root,
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

test("split spacing toggle and right corners preserve other layouts and breakpoints", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, 1032, 1033, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const mediaPosition of ["right", "left"]) {
        await page.evaluate(
          (position) =>
            window.renderSection({ layout: "split", mediaPosition: position }),
          mediaPosition,
        );
        const row = page.locator(".iwt-split-row");
        await expect(row).toHaveCSS(
          "padding-top",
          width < 768 ? "0px" : "40px",
        );
        await expect(row).toHaveCSS(
          "padding-bottom",
          width < 768 ? "0px" : "40px",
        );
        const image = page.locator(".iwt-split-media > div");
        await expect(image).toHaveCSS("border-top-left-radius", "20px");
        await expect(image).toHaveCSS("border-bottom-left-radius", "20px");
        const rightRadius =
          width >= 768 && mediaPosition === "right" ? "0px" : "20px";
        await expect(image).toHaveCSS("border-top-right-radius", rightRadius);
        await expect(image).toHaveCSS(
          "border-bottom-right-radius",
          rightRadius,
        );
        await page.evaluate(
          (position) =>
            window.renderSection({
              layout: "split",
              mediaPosition: position,
              showVerticalSpacing: false,
            }),
          mediaPosition,
        );
        await expect(row).toHaveCSS("padding-top", "0px");
        await expect(row).toHaveCSS("padding-bottom", "0px");
      }
      await page.evaluate(() =>
        window.renderSection({ layout: "overlay", showVerticalSpacing: false }),
      );
      await expect(page.locator(".iwt-split-row")).toHaveCount(0);
      await expect(page.locator(".iwt-split-media > div")).toHaveCSS(
        "border-top-right-radius",
        "20px",
      );
      assert.equal(
        await page.evaluate(() => {
          const input = window.schema.settings[0].inputs.find(
            (setting) => setting.name === "showVerticalSpacing",
          );
          return (
            input.defaultValue === true &&
            input.condition({ layout: "split" }) &&
            !input.condition({ layout: "overlay" }) &&
            !input.condition({})
          );
        }),
        true,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
