import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Real collection toolbar, Sort, LayoutSwitcher, router and theme CSS.
// Store/CMS data and unrelated drawer/button/link adapters are fixtures.
const root = fileURLToPath(new URL("../", import.meta.url));
const locale = JSON.parse(
  await readFile(`${root}app/locales/en-us.json`, "utf8"),
);
const collectionSource = await readFile(
  `${root}app/sections/collection-filters/index.tsx`,
  "utf8",
);
const contentClass = collectionSource.match(
  /<div className="(flex gap-5 pt-3[^"]*)"/,
)[1];
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React, { useState } from "react";
      import { createRoot } from "react-dom/client";
      import { createMemoryRouter, RouterProvider } from "react-router";
      import { ToolsBar } from "./app/sections/collection-filters/tools-bar";
      function App() {
        const [mobile, setMobile] = useState(1);
        const [desktop, setDesktop] = useState(2);
        return <div className="p-4"><ToolsBar
          enableSort showProductsCount enableFilter filtersPosition="drawer"
          expandFilters showFiltersCount gridSizeDesktop={desktop} gridSizeMobile={mobile}
          {...window.config}
          onGridSizeChange={(value, context) => context === "mobile" ? setMobile(value) : setDesktop(value)}
        /><div className=${JSON.stringify(contentClass)} data-next-content><span data-product-content>Products</span></div></div>;
      }
      window.router = createMemoryRouter([{path: "*", loader: () => ({
        collection: {title: "Beds", products: {nodes: [{}, {}, {}, {}], filters: [{}]}},
        appliedFilters: window.config.appliedFilters || [],
      }), Component: App}], {initialEntries: ["/collections/beds?filter.v.option.color=Black"]});
      createRoot(document.getElementById("root")).render(<RouterProvider router={window.router}/>);
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "store-adapters",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|components\/(button|link|scroll-area|animate-drawer)$|^\.\/filters$/,
          },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "tsx",
          resolveDir: root,
          contents:
            path === "@weaverse/hydrogen"
              ? `const locale = ${JSON.stringify(locale)}; export const useTranslation = () => ({t: (key, vars = {}) => key.split(".").reduce((value, part) => value?.[part], locale)?.replace(/{{(.*?)}}/g, (_, name) => vars[name.trim()] ?? "") || key});`
              : path.endsWith("/button")
                ? `import React from "react"; export const Button = React.forwardRef(({animate, variant, ...props}, ref) => <button ref={ref} {...props}/>);`
                : path.endsWith("/link")
                  ? `export {Link as default} from "react-router";`
                  : path.endsWith("/scroll-area")
                    ? `export const ScrollArea = ({children}) => children;`
                    : path.endsWith("/animate-drawer")
                      ? `import React from "react"; import * as Dialog from "@radix-ui/react-dialog"; export const AnimatedDrawer = ({open, children}) => open ? <Dialog.Portal><Dialog.Content aria-describedby={undefined}>{children}</Dialog.Content></Dialog.Portal> : null;`
                      : `export const Filters = () => null;`,
        }));
      },
    },
  ],
});
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  {
    base: `${root}app/styles`,
    onDependency: () => undefined,
  },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, config = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(`<style>${css}</style><div id="root"></div>`);
  await page.evaluate((value) => {
    window.config = value;
  }, config);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole("heading", { name: "Beds" })).toBeVisible();
  return page;
}

test("mobile product count shares the Sort row below layout/filter controls", async () => {
  for (const width of [320, 390, 767]) {
    const page = await render(width);
    const count = page.locator("header p");
    const sort = page.getByRole("button", { name: /^Sort by:/ });
    const controls = page.locator(
      'button[data-layout-context="mobile"]:visible',
    );
    const [countBox, sortBox, controlsBox] = await Promise.all([
      count.boundingBox(),
      sort.boundingBox(),
      controls.first().boundingBox(),
    ]);
    assert.ok(
      Math.abs(
        countBox.y + countBox.height / 2 - sortBox.y - sortBox.height / 2,
      ) < 1,
      `${width}px count and Sort must share a row`,
    );
    assert.ok(countBox.x < sortBox.x);
    assert.ok(countBox.y >= controlsBox.y + controlsBox.height);
    const titleBox = await page
      .getByRole("heading", { name: "Beds" })
      .boundingBox();
    const controlsRowBox = await controls
      .first()
      .locator("../..")
      .boundingBox();
    assert.equal(controlsRowBox.y - titleBox.y - titleBox.height, 24);
    assert.equal(countBox.y - controlsRowBox.y - controlsRowBox.height, 12);
    const headerBox = await page.locator("header").boundingBox();
    const contentBox = await page
      .locator("[data-product-content]")
      .boundingBox();
    assert.equal(contentBox.y - headerBox.y - headerBox.height, 12);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await controls.last().click();
    await expect(controls.last()).toHaveAttribute("aria-pressed", "true");
    await sort.click();
    await page.getByRole("menuitem", { name: "Newest", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sort by: Newest" }),
    ).toBeVisible();
    const query = await page.evaluate(
      () => window.router.state.location.search,
    );
    assert.equal(new URLSearchParams(query).get("sort"), "newest");
    assert.equal(
      new URLSearchParams(query).get("filter.v.option.color"),
      "Black",
    );
    await sort.click();
    await page
      .getByRole("menuitem", { name: "Price (high to low)", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.close();
  }
});

test("tablet/desktop retain title-controls and count-Sort alignment", async () => {
  for (const width of [768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
    const page = await render(width);
    const boxes = await Promise.all([
      page.getByRole("heading", { name: "Beds" }).boundingBox(),
      page
        .locator('button[data-layout-context="desktop"]:visible')
        .first()
        .boundingBox(),
      page.locator("header p").boundingBox(),
      page.getByRole("button", { name: /^Sort by:/ }).boundingBox(),
    ]);
    for (const [a, b] of [
      [boxes[0], boxes[1]],
      [boxes[2], boxes[3]],
    ]) {
      assert.ok(Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 1);
    }
    await expect(page.locator("header")).toHaveCSS(
      "padding-bottom",
      width <= TABLET_MAX_PX ? "0px" : "32px",
    );
    await page.close();
  }
});

test("merchant visibility toggles and resolved mobile padding remain unchanged", async () => {
  for (const config of [
    { enableSort: false },
    { showProductsCount: false },
    { enableSort: false, showProductsCount: false },
    { enableFilter: false, appliedFilters: [{}] },
  ]) {
    const page = await render(390, config);
    await expect(page.locator("header p")).toHaveCount(
      config.showProductsCount === false ? 0 : 1,
    );
    await expect(page.getByRole("button", { name: /^Sort by:/ })).toHaveCount(
      config.enableSort === false ? 0 : 1,
    );
    await expect(
      page.getByRole("button", { name: /Filter products/ }),
    ).toHaveCount(config.enableFilter === false ? 0 : 1);
    await expect(page.locator("header")).toHaveCSS("padding-bottom", "0px");
    if (config.enableSort === false && config.showProductsCount !== false) {
      const count = await page.locator("header p").boundingBox();
      const controls = await page
        .locator('button[data-layout-context="mobile"]:visible')
        .first()
        .boundingBox();
      assert.ok(
        count.y + count.height <= controls.y,
        "without Sort retain the original count placement",
      );
    }
    await page.close();
  }
});
