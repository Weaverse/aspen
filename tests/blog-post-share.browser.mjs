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
      import { flushSync } from "react-dom";
      import BlogPost, { schema } from "./app/sections/blog-post";
      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.renderPost = (showShareButtons = true, settings = {}) => flushSync(() => root.render(<BlogPost showShareButtons={showShareButtons} {...settings} />));
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
      name: "blog-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^react-router$|^~\/components\/(section|image)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          const contents =
            path === "@weaverse/hydrogen"
              ? 'export const createSchema = (schema) => schema; export const isBrowser = false; export const useTranslation = () => ({ t: (key) => key === "blog.share" ? "Share" : key });'
              : path === "react-router"
                ? `export const useRouteLoaderData = () => ({ layout: {shop: {primaryDomain: {url: "https://example.com"}}}}); export const useLoaderData = () => ({ blog: { handle: "journal" }, article: {title: "Article", handle: "article", contentHtml: "<p>Article body</p>" + "<p>Paragraph</p>".repeat(90), tags: [], author: {}}, formattedDate: "" });`
                : 'import React from "react"; export const layoutInputs = []; export const Image = () => null; export const Section = React.forwardRef(({children}, ref) => <section ref={ref}>{children}</section>);';
          return { contents, loader: "tsx", resolveDir: root };
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

test("Article desktop Share tracks the content column with a 40px gap and preserves mobile/tablet placement", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      320, 390, 767, 768, 1032, 1033, 1279, 1280, 1440, 1536, 1920,
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root { --radius-md: 12px; --color-background: #fff; --color-background-subtle: #ededed; --color-line-subtle: #d8d8d8; --color-text: #343231; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderPost());
      const sidebar = page.locator("section > div:nth-child(2) > div");
      const panel = sidebar.locator(":scope > div");
      const article = page.locator("article");
      await expect(article).toBeVisible();
      await expect(panel.locator("button")).toHaveCount(4);
      const labels = await panel
        .locator("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute("aria-label")),
        );
      assert.deepEqual(labels, [
        "blog.shareTwitter",
        "blog.shareFacebook",
        "blog.closeShare",
        "blog.copyLink",
      ]);
      assert.equal(
        await page.evaluate(
          () =>
            window.schema.settings
              .flatMap((group) => group.inputs)
              .find((input) => input.name === "showShareButtons").defaultValue,
        ),
        true,
      );
      if (width >= 1033) {
        await expect(sidebar).toBeVisible();
        const bodyBox = await article.boundingBox();
        const shareBox = await panel.boundingBox();
        assert.equal(bodyBox.width, 720);
        assert.equal(bodyBox.x - shareBox.x - shareBox.width, 40);
        assert.ok(Math.abs(bodyBox.x + bodyBox.width / 2 - width / 2) < 1);
        await expect(panel).toHaveCSS("border-radius", "12px");
        await expect(panel.locator("button")).toHaveCount(4);
        await expect(panel.locator("button").first()).toHaveCSS(
          "background-color",
          "rgb(237, 237, 237)",
        );
        await expect(panel.locator("button").first()).toHaveCSS(
          "border-color",
          "rgb(216, 216, 216)",
        );
        await page.evaluate(() => window.scrollTo(0, 900));
        assert.ok((await panel.boundingBox()).y >= 0);
      } else {
        await expect(panel).toBeVisible();
        await expect(panel).toHaveCSS("flex-direction", "row");
        const bodyBox = await article.boundingBox();
        const shareBox = await panel.boundingBox();
        assert.equal(
          shareBox.y - bodyBox.y - bodyBox.height,
          width >= 768 ? 20 : 16,
        );
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (url) => {
              window.copiedUrl = url;
            },
          },
        }),
      );
      await panel
        .getByRole("button", { name: "blog.copyLink", exact: true })
        .click();
      await expect(
        panel.getByRole("button", { name: "blog.linkCopied", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("status")).toHaveText(
        "blog.articleLinkCopied",
      );
      await expect(page.getByRole("status")).toBeVisible();
      await expect(page.getByRole("status")).toHaveAttribute(
        "aria-live",
        "polite",
      );
      // Section isolates its children; a later content layer must not cover the toast.
      await page.evaluate(() => {
        document.querySelector("section").style.isolation = "isolate";
        const content = document.createElement("div");
        content.id = "later-content";
        content.style.cssText =
          "position:fixed;bottom:0;left:0;width:100%;height:100px;background:white;isolation:isolate";
        document.body.append(content);
      });
      assert.equal(
        await page.getByRole("status").evaluate((toast) => {
          const rect = toast.getBoundingClientRect();
          return toast.contains(
            document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
            ),
          );
        }),
        true,
        "Copy notification must appear above later page content",
      );
      await page.evaluate(() =>
        document.getElementById("later-content").remove(),
      );
      assert.equal(
        await page.evaluate(() => window.copiedUrl),
        "https://example.com/blogs/journal/article",
      );
      await panel
        .getByRole("button", { name: "blog.closeShare", exact: true })
        .click();
      await expect(page.getByText("Share", { exact: true })).toHaveCount(0);
      await page.evaluate(() => window.renderPost(false));
      await expect(page.getByText("Share", { exact: true })).toHaveCount(0);
      await page.evaluate(() => window.renderPost(true));
      await expect(page.getByText("Share", { exact: true })).toBeVisible();
      for (let mask = 0; mask < 8; mask += 1) {
        const settings = {
          showShareTwitter: Boolean(mask & 1),
          showShareFacebook: Boolean(mask & 2),
          showShareLinkedIn: Boolean(mask & 4),
        };
        await page.evaluate((data) => window.renderPost(true, data), settings);
        const expected = [
          settings.showShareTwitter && "blog.shareTwitter",
          settings.showShareFacebook && "blog.shareFacebook",
          settings.showShareLinkedIn && "blog.shareLinkedIn",
          "blog.closeShare",
          "blog.copyLink",
        ].filter(Boolean);
        assert.deepEqual(
          await panel
            .locator("button")
            .evaluateAll((buttons) =>
              buttons.map((button) => button.getAttribute("aria-label")),
            ),
          expected,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      }
      const shareDefaults = await page.evaluate(() =>
        window.schema.settings
          .flatMap((group) => group.inputs)
          .filter((input) => input.name.startsWith("showShare"))
          .map((input) => [input.name, input.defaultValue]),
      );
      assert.deepEqual(shareDefaults, [
        ["showShareButtons", true],
        ["showShareTwitter", true],
        ["showShareFacebook", true],
        ["showShareLinkedIn", false],
      ]);
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw new Error("Clipboard denied");
            },
          },
        }),
      );
      await panel
        .getByRole("button", { name: "blog.copyLink", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText("blog.copyLinkFailed");
      await expect(
        panel.getByRole("button", { name: "blog.linkCopied", exact: true }),
      ).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
