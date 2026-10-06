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
    resolveDir: root,
    loader: "tsx",
    contents: `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import ScrollingText, { schema } from "./app/sections/scrolling-text";
    import Item from "./app/sections/scrolling-text/item";
    const root = createRoot(document.getElementById("root"));
    window.schema = schema;
    window.renderPreset = () => root.render(<ScrollingText layoutStyle="style2" iconSize={24} textSize="20" gap={32} topbarScrollingSpeed={1} verticalPadding={12} verticalMargin={0} visibleOnMobile={true}>{schema.presets.children.map((item, index) => <Item key={index} {...item} />)}</ScrollingText>);
    window.renderSection = (legacy = false, layoutStyle = "style2") => root.render(
      <ScrollingText layoutStyle={layoutStyle} content="Legacy text" iconUrls='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>' iconSize={24} textSize="20" gap={32} topbarScrollingSpeed={1} verticalPadding={12} verticalMargin={0} visibleOnMobile={true}>
        {!legacy && ["A", "B", "C", "D"].map((text) => <Item key={text} data-wv-id={text} content={'<p><a href="/collections/' + text + '">Text content ' + text + '</a></p>'} icon='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>' />)}
      </ScrollingText>
    );
  `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "fixture",
      setup(builder) {
        builder.onResolve(
          { filter: /@weaverse\/hydrogen|use-translated-text$/ },
          () => ({ path: "mock", namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "export const createSchema = (schema) => schema; export const useTranslatedText = () => (value) => value;",
          loader: "js",
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

test("Style 2 keeps independent icon/text groups inline and scrolling at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 640, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 600 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderSection());
      await expect(page.locator('[data-wv-id="A"]')).toHaveCount(1);
      const group = page.locator('[data-wv-id="A"]');
      await expect(group).toContainText("Text content A");
      await expect(group).toHaveCSS("display", "flex");
      await expect(group.locator("svg")).toHaveCSS("width", "24px");
      const geometry = await group.evaluate((node) => {
        const icon = node.querySelector("svg").getBoundingClientRect();
        const text = node.querySelector("p").getBoundingClientRect();
        return {
          aligned:
            Math.abs(icon.y + icon.height / 2 - text.y - text.height / 2) < 1,
          animation: getComputedStyle(node.parentElement.parentElement)
            .animationName,
          widths: [
            ...node.parentElement.parentElement.parentElement.children,
          ].map((el) => el.getBoundingClientRect().width),
          overflow: document.documentElement.scrollWidth > innerWidth,
          gap: Number.parseFloat(getComputedStyle(node.parentElement).gap),
        };
      });
      assert.equal(geometry.aligned, true);
      assert.equal(geometry.animation, "marquee");
      assert.ok(Math.abs(geometry.widths[0] - geometry.widths[1]) < 0.1);
      assert.ok(geometry.widths[0] >= width);
      assert.equal(geometry.gap, 32);
      assert.equal(geometry.overflow, false);
      await expect(page.getByRole("link")).toHaveCount(4);
      for (const text of ["A", "B", "C", "D"]) {
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("link", { name: `Text content ${text}`, exact: true }),
        ).toBeFocused();
      }
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.tagName),
        "BODY",
      );
      await page.evaluate(() => window.renderSection(true));
      await expect(page.locator("section")).not.toContainText("Legacy text");
      await expect(page.locator("section svg")).toHaveCount(0);
      await page.evaluate(() => window.renderPreset());
      await expect(page.locator("section")).toContainText("Text content A");
      await expect(page.locator("section")).toContainText("Text content D");
      const visibility = await page.evaluate(() => {
        const inputs = window.schema.settings[0].inputs;
        const text = inputs.find((input) => input.name === "content");
        const icons = inputs.find((input) => input.name === "iconUrls");
        return [
          text.condition({ layoutStyle: "style1" }),
          text.condition({ layoutStyle: "style2" }),
          icons.condition({ layoutStyle: "style2" }),
        ];
      });
      assert.deepEqual(visibility, [true, false, false]);
      await page.evaluate(() => window.renderSection(true, "style1"));
      await expect(page.locator("section ul li")).toHaveCount(50);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
