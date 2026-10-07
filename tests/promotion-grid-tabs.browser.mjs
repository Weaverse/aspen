import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import {
  DESKTOP_MIN_PX,
  isDesktopViewport,
  TABLET_MAX_PX,
} from "./responsive-test-widths.mjs";

// Real TabsLayout, Paragraph and Link; expose the private layout only in this bundle.
const root = fileURLToPath(new URL("../", import.meta.url));
const componentPath = "app/sections/promotion-grid/grid-items.tsx";
const componentSource = process.env.TEST_BASELINE_REF
  ? execFileSync(
      "git",
      ["show", `${process.env.TEST_BASELINE_REF}:${componentPath}`],
      { cwd: root, encoding: "utf8" },
    )
  : await readFile(`${root}${componentPath}`, "utf8");
const bundle = await build({
  stdin: {
    contents: `
      import React, {useState} from "react";
      import {createRoot} from "react-dom/client";
      import {createMemoryRouter, RouterProvider} from "react-router";
      import {TabsLayout} from "./app/sections/promotion-grid/grid-items";
      const tabsData = ["Best Selling", "Sofa Beds", "Decorations"].map((name, index) => ({
        id:index, headingContent:name, paragraphContent:name + " body", buttonContent:name + " link",
        backgroundImage:"https://cdn.shopify.com/s/files/1/0000/0001/files/fixture" + index + ".jpg",
        to:"/collections/fixture" + index, variant:"decor", buttonTextSize:12,
        paragraphTag:"p", paragraphColor:"#FFFFFF"
      }));
      function Fixture() {
        const [activeTab, setActiveTab] = useState(0);
        return <TabsLayout tabsData={tabsData} activeTab={activeTab}
          setActiveTab={setActiveTab} rest={{}} />;
      }
      const router = createMemoryRouter([{id:"root",path:"/",element:<Fixture />}]);
      createRoot(document.getElementById("root")).render(<RouterProvider router={router} />);
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "tabs-fixture",
      setup(builder) {
        builder.onLoad(
          { filter: /sections\/promotion-grid\/grid-items\.tsx$/ },
          () => ({
            loader: "tsx",
            contents: `${componentSource}\nexport { TabsLayout };`,
          }),
        );
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "cms",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "js",
          contents:
            path === "translation"
              ? "export const useTranslatedText = () => value => value;"
              : `export const createSchema = value => value;
             export const IMAGES_PLACEHOLDERS = {};
             export const useChildInstances = () => [];
             export const useThemeSettings = () => ({});
             export const useTranslation = () => ({t:key => key});`,
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
const scanner = new Scanner({
  sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
});
// Include the bundled source, including utilities removed from the current tree.
const candidates = scanner.scan();
candidates.push(
  ...scanner.scanFiles([{ content: componentSource, extension: "tsx" }]),
);
const css =
  stylesheet.build(candidates) +
  (bundle.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "");
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width) {
  const page = await browser.newPage({ viewport: { width, height: 1100 } });
  page.setDefaultTimeout(3000);
  await page.route("**/fixture*.jpg*", (route) => route.abort());
  await page.setContent(`<style>${css}</style><div id="root"></div>`);
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page
    .getByRole("button", { name: "Best Selling", exact: true })
    .waitFor();
  return page;
}

test("Promotion Tabs title row uses desktop 120px, tablet 40px and unchanged mobile 373px", async () => {
  for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
    const page = await render(width);
    const row = page
      .getByRole("button", { name: "Best Selling", exact: true })
      .locator("..");
    await expect(row).toHaveCSS(
      "top",
      width < 768 ? "373px" : isDesktopViewport(width) ? "120px" : "40px",
    );
    await expect(
      page.getByRole("button", { name: "Best Selling", exact: true }),
    ).toHaveCSS("padding-top", width < 768 ? "12px" : "16px");
    await page.close();
  }
});

test("Promotion Tabs switches title, body and link together while background still crossfades", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width);
    await page.clock.install({ time: new Date("2026-10-04T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-04T00:00:01Z"));
    const paragraph = page.locator(".promotion-tabs .paragraph");
    for (const [name, index] of [
      ["Sofa Beds", 1],
      ["Decorations", 2],
      ["Best Selling", 0],
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      if (isDesktopViewport(width)) {
        await button.hover({ force: true });
      } else {
        await button.click({ force: true });
      }
      await expect(button).toHaveClass(/border-\[#D8D8D8\]/);
      await expect(paragraph).toHaveText(`${name} body`, { timeout: 200 });
      await expect(
        page.getByRole("link", { name: `${name} link`, exact: true }),
      ).toHaveAttribute("href", `/collections/fixture${index}`);
      await expect(paragraph.locator("..")).toHaveCSS("opacity", "1");
      if (index === 1) {
        await expect(page.locator(".promotion-tabs img")).toHaveCount(2);
        await page.clock.runFor(600);
        await expect(page.locator(".promotion-tabs img")).toHaveCount(1);
        assert.match(
          await page.locator(".promotion-tabs img").getAttribute("src"),
          /fixture1\.jpg/,
        );
      }
    }
    await page.clock.runFor(600);
    await expect(page.locator(".promotion-tabs img")).toHaveCount(1);
    assert.match(
      await page.locator(".promotion-tabs img").getAttribute("src"),
      /fixture0\.jpg/,
    );
    await page.close();
  }
});
