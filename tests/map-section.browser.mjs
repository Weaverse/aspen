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
      import MapSection from "./app/sections/map/map";

      const root = createRoot(document.getElementById("root"));
      window.renderMap = (layoutMap) => root.render(
        React.createElement(
          MapSection,
          { layoutMap, heading: "OUR STORES", panelBackgroundColor: "#FFFFFF" },
          React.createElement("div", null, "Store address"),
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
                export const useChildInstances = () => [
                  { data: { type: "address-item", address: "81 Greene St" } },
                ];
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

test("Style 2 map panel uses the medium theme radius at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1024, 1280, 1520]) {
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
