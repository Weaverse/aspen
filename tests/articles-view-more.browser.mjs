import assert from "node:assert/strict";
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
      import Articles, { schema } from "./app/sections/articles";
      import RelatedArticles, { schema as relatedSchema } from "./app/sections/related-articles";
      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.relatedSchema = relatedSchema;
      window.renderRelated = (props = {}) => root.render(<RelatedArticles heading="Related articles" {...props} />);
      window.renderArticles = (props = {}) => root.render(<Articles articlePerRow={3} loaderData={{blog: {articles: {nodes: [{title: "Article title", handle: "journal/article"}]}}}} {...props} />);
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
      name: "articles-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^react-router$|^~\/hooks\/(use-translated-text|use-locale)$|^~\/components\/(heading|link|image|section|button|background-image)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "@weaverse/hydrogen") {
            contents =
              "export const createSchema = (schema) => schema; export const IMAGES_PLACEHOLDERS = {}; export const useTranslation = () => ({ t: (key) => key });";
          } else if (path === "react-router") {
            contents =
              'export const useLoaderData = () => ({ relatedArticles: [{ id: "article", title: "Article title", handle: "journal/article" }] });';
          } else if (path.includes("use-translated-text")) {
            contents = `import { translateThemeText } from "./app/utils/translation"; import en from "./app/locales/en-us.json"; export const useTranslatedText = () => (value, key) => translateThemeText((key) => key.split(".").reduce((obj, part) => obj[part], en), value, key);`;
          } else if (path.includes("use-locale")) {
            contents = 'export const useLocale = () => "en-US";';
          } else {
            contents = `import React from "react";
            export const layoutInputs = [], headingInputs = [], backgroundInputs = [];
            export const Section = React.forwardRef(({children, style}, ref) => <section ref={ref} style={style}>{children}</section>);
            export const Image = () => null;
            export const Button = ({children}) => <button>{children}</button>;
            export default function Component({children, to, className}) { return <a href={to} className={className}>{children}</a>; }
            export const Link = Component;
          `;
          }
          return { contents, loader: "tsx", resolveDir: root };
        });
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

test("Articles and Related Articles View More default off and use body-base tokens across breakpoints", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root { --font-body: "DM Sans", sans-serif; --body-base-size: 14px; --body-base-spacing: 0.01em; --body-base-line-height: 1.6; --color-text-subtle: #524B46; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const defaults = await page.evaluate(() => {
        const inputs = window.schema.settings.flatMap((group) => group.inputs);
        return [
          inputs.find((input) => input.name === "showReadMore").defaultValue,
          inputs.find((input) => input.name === "readMoreText").defaultValue,
          window.schema.presets.showReadMore,
          window.schema.presets.readMoreText,
        ];
      });
      assert.deepEqual(defaults, [false, "View More", false, "View More"]);
      await page.evaluate(() => window.renderArticles());
      await expect(page.locator("article")).toHaveCount(1);
      await expect(page.getByText("View More", { exact: true })).toHaveCount(0);
      await page.evaluate(() => window.renderArticles({ showReadMore: true }));
      const label = page.getByText("View More", { exact: true });
      await expect(label).toBeVisible();
      for (const [property, value] of Object.entries({
        "font-size": "14px",
        "font-weight": "400",
        "line-height": "22.4px",
        "letter-spacing": "0.14px",
        color: "rgb(82, 75, 70)",
        "text-align": "center",
      })) {
        await expect(label).toHaveCSS(property, value);
      }
      await expect(label).toHaveCSS("font-family", '"DM Sans", sans-serif');
      await expect(page.locator("article > a")).toHaveAttribute(
        "href",
        "/blogs/journal/article",
      );
      await page.evaluate(() =>
        window.renderArticles({
          showReadMore: true,
          readMoreText: "Merchant CTA",
        }),
      );
      await expect(
        page.getByText("Merchant CTA", { exact: true }),
      ).toBeVisible();
      await page.evaluate(() => window.renderArticles({ showReadMore: false }));
      await expect(label).toHaveCount(0);
      const relatedDefaults = await page.evaluate(() => {
        const inputs = window.relatedSchema.settings.flatMap(
          (group) => group.inputs,
        );
        return [
          inputs.find((input) => input.name === "showReadmore").defaultValue,
          inputs.find((input) => input.name === "readMoreText").defaultValue,
        ];
      });
      assert.deepEqual(relatedDefaults, [false, "View More"]);
      await page.evaluate(() => window.renderRelated());
      await expect(label).toHaveCount(0);
      await page.evaluate(() => window.renderRelated({ showReadmore: true }));
      await expect(label).toBeVisible();
      for (const [property, value] of Object.entries({
        "font-size": "14px",
        "font-weight": "400",
        "line-height": "22.4px",
        "letter-spacing": "0.14px",
        color: "rgb(82, 75, 70)",
        "text-align": "center",
        "text-transform": "none",
      })) {
        await expect(label).toHaveCSS(property, value);
      }
      await expect(label.locator("svg")).toBeVisible();
      await expect(label.locator("svg")).toHaveAttribute("width", "11");
      await page.evaluate(() =>
        window.renderRelated({
          showReadmore: true,
          readMoreText: "Merchant CTA",
        }),
      );
      await expect(
        page.getByText("Merchant CTA", { exact: true }),
      ).toBeVisible();
      await page.evaluate(() => window.renderRelated({ showReadmore: false }));
      await expect(page.getByText("Merchant CTA", { exact: true })).toHaveCount(
        0,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
