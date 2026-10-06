import assert from "node:assert/strict";
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
      import Countdown from "./app/sections/countdown";
      import SubHeading, { schema } from "./app/sections/countdown/subheading";

      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.renderCountdown = (backgroundBorderRadius) => root.render(
        React.createElement(
          Countdown,
          { scenario: "scenario1", height: "small" },
          React.createElement(SubHeading, {
            content: "Seasonal Sale",
            color: "#FEF4EB",
            backgroundColor: "#434343",
            backgroundBorderRadius,
            alignment: "left",
          }),
          React.createElement(
            "p",
            { className: "paragraph" },
            "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
          ),
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
      name: "countdown-subheading-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "weaverse",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onResolve(
          {
            filter: /~\/components\/(background-image|overlay|section)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: path.endsWith("background-image")
            ? "export const backgroundInputs = [];"
            : path.endsWith("overlay")
              ? "export const overlayInputs = [];"
              : path.endsWith("section")
                ? `import React from "react";
                   export const Section = React.forwardRef(({ children }, ref) =>
                     React.createElement("section", { ref }, children));`
                : path === "translation"
                  ? "export const useTranslatedText = () => (value) => value;"
                  : "export const createSchema = (value) => value;",
          loader: "js",
          resolveDir: root,
        }));
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

test("Countdown label uses theme typography, radius, and vertical alignment", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root { --radius-sm: 8px; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderCountdown());

      const label = page.getByText("Seasonal Sale", { exact: true });
      await expect(label).toHaveCSS("border-radius", "8px");
      assert.match(
        await label.evaluate((node) => getComputedStyle(node).fontFamily),
        /Tenor Sans/,
      );
      const centerOffset = await label.evaluate((node) => {
        const backgroundBox = node.getBoundingClientRect();
        const textRange = document.createRange();
        textRange.selectNodeContents(node);
        const textBox = textRange.getBoundingClientRect();
        return Math.abs(
          backgroundBox.y +
            backgroundBox.height / 2 -
            (textBox.y + textBox.height / 2),
        );
      });
      assert.ok(
        centerOffset < 1,
        `label text is ${centerOffset}px off-center at ${width}px`,
      );

      await page.evaluate(() => window.renderCountdown(0));
      await expect(label).toHaveCSS("border-radius", "0px");
      await page.close();
    }

    assert.equal(
      await browser.newPage().then(async (page) => {
        await page.setContent('<div id="root"></div>');
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        return page.evaluate(
          () =>
            window.schema.settings[0].inputs.find(
              (input) => input.name === "backgroundBorderRadius",
            ).defaultValue,
        );
      }),
      8,
    );
  } finally {
    await browser.close();
  }
});
