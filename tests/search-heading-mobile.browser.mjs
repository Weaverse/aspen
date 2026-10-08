import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

// Execute the actual route heading with the real theme CSS and bundled font.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(`${root}app/routes/($locale).search.tsx`, "utf8");
const heading = source.slice(
  source.indexOf("function SearchHeading("),
  source.indexOf("function SearchProducts("),
);
const locale = JSON.parse(
  await readFile(`${root}app/locales/en-us.json`, "utf8"),
);
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
    import React from "react";
    import {createRoot} from "react-dom/client";
    const locale = ${JSON.stringify(locale)};
    const useTranslation = () => ({t: (key, vars = {}) => key.split(".").reduce((value, part) => value?.[part], locale).replace(/{{(.*?)}}/g, (_, name) => vars[name.trim()] ?? "")});
    ${heading}
    createRoot(document.getElementById("root")).render(<SearchHeading {...window.config}/>);
  `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
});
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);
const font = (
  await readFile(
    `${root}node_modules/@fontsource/tenor-sans/files/tenor-sans-latin-400-normal.woff2`,
  )
).toString("base64");
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, config) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    `<style>${css}@font-face{font-family:"Tenor Sans";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:400}</style><div class="p-4"><div id="root"></div></div>`,
  );
  await page.evaluate(
    (value) => {
      window.config = value;
    },
    { keepLabelTogether: width < 768, ...config },
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("heading").waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("short mobile search heading is inline instead of forcing the term onto another line", async () => {
  assert.match(source, /<SearchHeading searchTerm={searchTerm} \/>/);
  assert.doesNotMatch(source, /<SearchHeading[^>]*\bstacked\b/);
  for (const width of [375, 390, 767]) {
    const page = await render(width, { searchTerm: "S" });
    const dimensions = await page.getByRole("heading").evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
    }));
    assert.ok(
      dimensions.height <= dimensions.lineHeight + 1,
      `${width}px short heading must occupy one line`,
    );
    assert.equal(
      await page.getByRole("heading").textContent(),
      "Results for “S”",
    );
    await page.close();
  }
});

test("long search terms wrap naturally without truncation or horizontal overflow", async () => {
  const term = "Comfortable living room furniture with extra cushions";
  const page = await render(320, { searchTerm: term });
  assert.equal(
    await page.getByRole("heading").textContent(),
    `Results for “${term}”`,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.close();
});

test("mobile label stays together and SEA moves as a unit only when space is insufficient", async () => {
  for (const width of [320, 390, 767]) {
    const page = await render(width, { searchTerm: "SEA" });
    const headingElement = page.getByRole("heading");
    const label = headingElement.locator("span").first();
    const term = headingElement.locator("span").last();
    const [labelBox, termBox] = await Promise.all([
      label.boundingBox(),
      term.boundingBox(),
    ]);
    const lineHeight = await label.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).lineHeight),
    );
    assert.ok(
      labelBox.height <= lineHeight + 1,
      "RESULTS FOR must never split",
    );
    assert.ok(termBox.height <= lineHeight + 1, "SEA must move as one unit");
    if (width === 320) {
      assert.ok(
        termBox.y > labelBox.y,
        "insufficient space moves only SEA down",
      );
    }
    if (width === 767) {
      assert.equal(termBox.y, labelBox.y, "sufficient space keeps both inline");
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.close();
  }
});

test("tablet/desktop count and empty-search translations remain unchanged", async () => {
  for (const width of [768, 1032, 1033, 1440]) {
    const page = await render(width, { searchTerm: "S", resultCount: 4 });
    assert.equal(
      await page.getByRole("heading").textContent(),
      "4 Results for “S”",
    );
    await page.close();
  }
  const page = await render(390, { searchTerm: "" });
  assert.equal(
    await page.getByRole("heading").textContent(),
    locale.search.title,
  );
  await page.close();
});
