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
      import PromotionSlider, {TabsLayout, schema as sliderSchema} from "./app/sections/promotion-grid/grid-items";
      import PromotionGrid, {schema as gridSchema} from "./app/sections/promotion-grid";
      import PromotionItem, {schema as itemSchema} from "./app/sections/promotion-grid/item";
      const tabsData = ["Best Selling", "Sofa Beds", "Decorations"].map((name, index) => ({
        id:index, headingContent:name, paragraphContent:name + " body", buttonContent:name + " link",
        backgroundImage:"https://cdn.shopify.com/s/files/1/0000/0001/files/fixture" + index + ".jpg",
        to:"/collections/fixture" + index, variant:"decor", buttonTextSize:12,
        paragraphTag:"p", paragraphColor:"#FFFFFF"
      }));
      function Fixture({overrides=[]}) {
        const [activeTab, setActiveTab] = useState(0);
        const [contentOverrides,setContentOverrides]=useState(overrides);
        window.updateTabOverrides=setContentOverrides;
        return <TabsLayout tabsData={tabsData.map((tab,index)=>({...tab,...contentOverrides[index]}))} activeTab={activeTab}
          setActiveTab={setActiveTab} rest={{}} />;
      }
      const router = createMemoryRouter([{id:"root",path:"/",element:<Fixture />}]);
      const root = createRoot(document.getElementById("root"));
      root.render(<RouterProvider router={router} />);
      window.renderTabs = (overrides=[]) => root.render(<RouterProvider router={createMemoryRouter([
        {id:"root",path:"/",element:<Fixture overrides={overrides} />}
      ])} />);
      window.renderSlider = (options = {}) => {
        const {count=3, instances=1, headings, parentLayout, itemProps, ...props}=options;
        const element=<>{Array.from({length:instances},(_,group)=><PromotionGrid key={group} layout={parentLayout}><PromotionSlider {...sliderSchema.presets} {...props}>
          {Array.from({length:count},(_,index)=><PromotionItem key={index} {...itemSchema.presets} {...itemProps}
            backgroundImage={tabsData[index % 3].backgroundImage}
            headingContent={headings?.[index] ?? (index % 2 ? "Quality furniture made to last through moves and milestones." : "The best of every modern style from minimalist to mid century.")}
            to={"/collections/fixture"+index} />)}
        </PromotionSlider></PromotionGrid>)}</>;
        root.render(<RouterProvider router={createMemoryRouter([{id:"root",path:"/",element}])} />);
      };
      window.promotionSchemas = {grid:gridSchema, slider:sliderSchema, item:itemSchema};
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
        if (process.env.TEST_BASELINE_REF) {
          builder.onLoad(
            { filter: /sections\/promotion-grid\/(item|arrows)\.tsx$/ },
            ({ path }) => ({
              loader: "tsx",
              contents: execFileSync(
                "git",
                [
                  "show",
                  `${process.env.TEST_BASELINE_REF}:${path.slice(root.length)}`,
                ],
                { cwd: root, encoding: "utf8" },
              ),
            }),
          );
        }
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
const themeTokens = `:root { --body-base-size:14px; --h2-base-size:53px; --h3-base-size:44px; --h4-base-size:37px; --h6-base-size:26px; --radius-md:12px; --color-text-inverse:#fef4eb; --color-text-light:#979797; --color-line-subtle:#d8d8d8; }`;
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, options = {}) {
  const { imageColor, ...browserOptions } = options;
  const page = await browser.newPage({
    viewport: { width, height: 1100 },
    ...browserOptions,
  });
  page.setDefaultTimeout(3000);
  await page.route("**/fixture*.jpg*", async (route) => {
    const index = route
      .request()
      .url()
      .match(/fixture(\d)/)?.[1];
    if (imageColor) {
      await route.fulfill({
        contentType: "image/svg+xml",
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="${imageColor}" d="M0 0h20v20H0z"/></svg>`,
      });
    } else if (
      process.env.PROMOTION_VISUAL_ASSETS &&
      index &&
      Number(index) < 2
    ) {
      await route.fulfill({
        body: await readFile(
          `${process.env.PROMOTION_VISUAL_ASSETS}/fixture${index}.png`,
        ),
        contentType: "image/png",
      });
    } else {
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="white" d="M0 0h20v20H0z"/></svg>',
      });
    }
  });
  await page.setContent(
    `<!doctype html><style>${css}${themeTokens}</style><div id="root"></div>`,
  );
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page
    .getByRole("button", { name: "Best Selling", exact: true })
    .waitFor();
  return page;
}

test("Promotion heading exposes one content control and preserves saved text", async () => {
  const page = await render(834);
  const headingInputs = await page.evaluate(
    () =>
      window.promotionSchemas.item.settings.find(
        (group) => group.group === "Heading (optional)",
      ).inputs,
  );
  const contentInputs = headingInputs.filter(
    (input) => input.name === "headingContent",
  );
  assert.equal(contentInputs.length, 1);
  assert.equal(contentInputs[0].defaultValue, "Section heading");
  assert.equal(
    new Set(headingInputs.map((input) => input.name)).size,
    headingInputs.length,
  );
  await page.evaluate(() =>
    window.renderSlider({
      count: 1,
      parentLayout: "slider",
      headings: ["Saved merchant heading"],
    }),
  );
  await expect(
    page.getByRole("heading", { name: "Saved merchant heading", exact: true }),
  ).toBeVisible();
  await page.close();
});

test("parent owns Layout type and overrides legacy child styles without resetting saved sections", async () => {
  const page = await render(834);
  const schemaContract = await page.evaluate(() => {
    const inputs = (schema) => schema.settings.flatMap((group) => group.inputs);
    const parent = inputs(window.promotionSchemas.grid).find(
      (input) => input.name === "layout",
    );
    const child = inputs(window.promotionSchemas.slider).find(
      (input) => input.name === "layout",
    );
    return {
      parentLabel: parent.label,
      parentDefault: parent.defaultValue ?? null,
      preset: window.promotionSchemas.grid.presets.layout,
      sliderLimit: window.promotionSchemas.slider.limit,
      promotionTypes: window.promotionSchemas.slider.childTypes,
      legacyHidden: child.condition() === false,
      staleConditions: inputs(window.promotionSchemas.slider).filter(
        (input) =>
          typeof input.condition === "string" &&
          input.condition.startsWith("layout."),
      ).length,
    };
  });
  assert.deepEqual(schemaContract, {
    parentLabel: "Layout type",
    parentDefault: null,
    preset: "slider",
    sliderLimit: 1,
    promotionTypes: ["promotion-grid-item"],
    legacyHidden: true,
    staleConditions: 0,
  });
  for (const options of [
    { layout: "tabs" },
    { layout: "slider", parentLayout: "tabs", instances: 2 },
    { layout: "tabs", parentLayout: "slider", instances: 2 },
    {},
  ]) {
    await page.evaluate((settings) => window.renderSlider(settings), options);
    const tabs =
      (options.parentLayout ?? options.layout ?? "slider") === "tabs";
    await expect(
      page.locator(tabs ? ".promotion-tabs" : ".promotion-slider"),
    ).toHaveCount(options.instances ?? 1);
    await expect(
      page.locator(tabs ? ".promotion-slider" : ".promotion-tabs"),
    ).toHaveCount(0);
  }
  await page.close();
});

test("Promotion Tabs titles follow content on mobile and keep desktop/tablet top insets", async () => {
  for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
    const page = await render(width);
    const row = page
      .getByRole("button", { name: "Best Selling", exact: true })
      .locator("..");
    const geometry = await row.evaluate((el) => ({
      top:
        el.getBoundingClientRect().top -
        el.closest(".promotion-tabs").getBoundingClientRect().top,
      contentBottom: el.parentElement
        .querySelector(".paragraph")
        .parentElement.getBoundingClientRect().bottom,
      rowTop: el.getBoundingClientRect().top,
    }));
    if (width < 768) {
      assert.ok(geometry.rowTop >= geometry.contentBottom);
    } else {
      assert.equal(geometry.top, isDesktopViewport(width) ? 160 : 40);
    }
    await expect(
      page.getByRole("button", { name: "Best Selling", exact: true }),
    ).toHaveCSS("padding-top", "10px");
    await page.close();
  }
});

test("Promotion Tabs tablet spacing follows the tab row and preserves other breakpoints", async () => {
  for (const width of [
    390,
    767,
    768,
    834,
    TABLET_MAX_PX,
    DESKTOP_MIN_PX,
    1440,
  ]) {
    const page = await render(width);
    const tablet = width >= 768 && !isDesktopViewport(width);
    for (const wrapped of [false, true]) {
      if (wrapped) {
        await page
          .locator(".promotion-tabs button span")
          .evaluateAll((labels) => {
            for (const label of labels) {
              label.textContent =
                "Long collection label that wraps to multiple lines";
            }
          });
      }
      const geometry = await page
        .locator(".promotion-tabs")
        .evaluate((section) => {
          const paragraph = section.querySelector(".paragraph");
          const row = section.querySelector("button").parentElement;
          const content = paragraph.parentElement;
          return {
            rowTop:
              row.getBoundingClientRect().top -
              section.getBoundingClientRect().top,
            rowLeft:
              row.getBoundingClientRect().left -
              section.getBoundingClientRect().left,
            rowRight:
              section.getBoundingClientRect().right -
              row.getBoundingClientRect().right,
            rowToContent:
              content.getBoundingClientRect().top -
              row.getBoundingClientRect().bottom,
            contentTop:
              content.getBoundingClientRect().top -
              section.getBoundingClientRect().top,
            paragraphToLink:
              section.querySelector("a").getBoundingClientRect().top -
              paragraph.getBoundingClientRect().bottom,
            bottomSpace:
              section.getBoundingClientRect().bottom -
              section.querySelector("a").getBoundingClientRect().bottom,
            height: section.getBoundingClientRect().height,
            contentWidth: content.getBoundingClientRect().width,
            tabFontSize: getComputedStyle(row.querySelector("span")).fontSize,
          };
        });
      assert.equal(geometry.paragraphToLink, 40);
      if (tablet) {
        assert.equal(geometry.rowTop, 40);
        assert.equal(geometry.rowLeft, 32);
        assert.equal(geometry.rowRight, 32);
        assert.equal(geometry.rowToContent, 64);
        assert.equal(geometry.bottomSpace, 80);
        assert.equal(geometry.contentWidth, Math.min(720, width - 64));
        assert.equal(geometry.tabFontSize, "26px");
      } else if (width < 768) {
        assert.equal(geometry.contentTop, 0);
        assert.ok(geometry.height >= 562);
      } else {
        assert.equal(geometry.rowToContent, 200);
        assert.ok(geometry.height >= 840);
      }
    }
    await page.close();
  }
});

test("Promotion Tabs labels stay fixed when switching tabs", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width);
    const positions = () =>
      page
        .locator(".promotion-tabs button span")
        .evaluateAll((labels) =>
          labels.map((label) => label.getBoundingClientRect().top),
        );
    const before = await positions();
    await page.getByRole("button", { name: "Sofa Beds", exact: true }).click();
    assert.deepEqual(await positions(), before);
    await page.close();
  }
});

test("Review 32: mobile tab headings and following content do not jump when selection changes", async () => {
  for (const width of [320, 375, 393, 767]) {
    const page = await render(width);
    await page.evaluate(() =>
      window.renderTabs([
        { paragraphContent: "Short description." },
        {
          paragraphContent:
            "Generous comfort by day, a welcoming place to stay by night. Designed to transform with ease.",
        },
        {
          subheadingContent: "A collection for every home",
          paragraphContent: "Long translated content ".repeat(25),
          buttonContent: "Discover our collection and explore more",
        },
      ]),
    );
    for (const wrapped of [false, true]) {
      if (wrapped) {
        await page
          .locator(".promotion-tabs button span")
          .evaluateAll((labels) => {
            for (const label of labels) {
              label.textContent += " collection with a longer heading";
            }
          });
      }
      const geometry = () =>
        page.locator(".promotion-tabs").evaluate((section) => {
          const bounds = section.getBoundingClientRect();
          return {
            height: bounds.height,
            headings: Array.from(section.querySelectorAll("button span")).map(
              (label) => label.getBoundingClientRect().top - bounds.top,
            ),
          };
        });
      const before = await geometry();
      for (const index of [1, 2, 0]) {
        const tab = page.locator(".promotion-tabs button").nth(index);
        await tab.click();
        // Keep the mouse over the clicked tab through the entire transition.
        // Previously, changing paragraph height moved another tab under it.
        await expect(tab).toHaveAttribute("aria-pressed", "true");
        await page.waitForTimeout(650);
        await expect(tab).toHaveAttribute("aria-pressed", "true");
        assert.deepEqual(await geometry(), before);
      }
      // Keyboard selection must use the same stable layout as touch/click.
      const secondTab = page.locator(".promotion-tabs button").nth(1);
      await secondTab.focus();
      await secondTab.press("Space");
      await expect(secondTab).toHaveAttribute("aria-pressed", "true");
      assert.deepEqual(await geometry(), before);
    }
    await page.close();
  }
});

test("mobile preview ignores mouse hover but still allows deliberate click selection", async () => {
  const page = await render(393);
  const first = page.getByRole("button", { name: "Best Selling", exact: true });
  const second = page.getByRole("button", { name: "Sofa Beds", exact: true });
  await second.hover();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await page.close();
});

test("mobile tabs remain stable after content edits, resizing and touch selection", async () => {
  const page = await render(393, { hasTouch: true });
  await page.evaluate(() =>
    window.updateTabOverrides([
      { paragraphContent: "Short description." },
      { paragraphContent: "Long edited description ".repeat(15) },
      { paragraphContent: "", buttonContent: "" },
    ]),
  );
  for (const width of [393, 767, 768, 834, 1440, 393]) {
    await page.setViewportSize({ width, height: 1100 });
    const bounds = () =>
      page
        .locator(".promotion-tabs button")
        .first()
        .evaluate((button) => {
          const section = button.closest(".promotion-tabs");
          return {
            nav:
              button.getBoundingClientRect().top -
              section.getBoundingClientRect().top,
            height: section.getBoundingClientRect().height,
          };
        });
    const before = await bounds();
    for (const index of [1, 2, 0]) {
      const button = page.locator(".promotion-tabs button").nth(index);
      await button.tap();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      if (width < 768) {
        assert.deepEqual(await bounds(), before);
      } else {
        assert.equal((await bounds()).nav, isDesktopViewport(width) ? 160 : 40);
      }
    }
    if (width >= 768) {
      // Inactive long copy must not reserve extra height on tablet/desktop.
      const content = page.locator(".promotion-tab-content:not([inert])");
      const grid = content.locator("..");
      assert.equal(
        await grid.evaluate((el) => el.getBoundingClientRect().height),
        await content.evaluate((el) => el.getBoundingClientRect().height),
      );
    }
    await expect(page.getByRole("link")).toHaveCount(1);
  }
  await page.close();
});

test("Promotion Tabs fades panels without exposing inactive CTAs and respects reduced motion", async () => {
  const page = await render(834);
  const content = page.locator(".promotion-tab-content:not([inert])");
  const outgoing = page.locator(".promotion-tab-content").first();
  await page.getByRole("button", { name: "Sofa Beds", exact: true }).click();
  await expect(outgoing).toHaveAttribute("inert", "");
  await expect(page.getByRole("link")).toHaveCount(1);
  await expect(content.locator(".paragraph")).toHaveText("Sofa Beds body");
  await expect(content).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("link", { name: "Sofa Beds link" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Decorations", exact: true }).click();
  await expect(content.locator(".paragraph")).toHaveText("Decorations body");
  await expect(content).toHaveCSS("opacity", "1");
  await expect(page.locator(".promotion-tab-background")).toHaveCount(1);
  await expect(page.locator(".promotion-tab-background")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.close();
});

test("Promotion Tabs switches body and link together and retargets interrupted background fades", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width);
    const paragraph = page.locator(
      ".promotion-tab-content:not([inert]) .paragraph",
    );
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
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(paragraph).toHaveText(`${name} body`);
      await expect(
        page.getByRole("link", { name: `${name} link`, exact: true }),
      ).toHaveAttribute("href", `/collections/fixture${index}`);
      await expect(page.locator(".promotion-tab-background")).toHaveCount(1);
    }
    const layers = page.locator(".promotion-tab-background");
    await expect(layers).toHaveCount(1);
    await expect(layers.nth(0)).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: "Sofa Beds", exact: true }).click();
    await expect
      .poll(async () =>
        Number(
          await layers
            .last()
            .evaluate((layer) => getComputedStyle(layer).opacity),
        ),
      )
      .toBeGreaterThan(0);
    const midway = Number(
      await layers.last().evaluate((layer) => getComputedStyle(layer).opacity),
    );
    assert.ok(midway < 1, "background must fade rather than switch instantly");
    await page
      .getByRole("button", { name: "Decorations", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Best Selling", exact: true })
      .click();
    await expect(layers).toHaveCount(1);
    await expect(layers.first()).toHaveCSS("opacity", "1");
    assert.match(
      await layers.locator("img").getAttribute("src"),
      /fixture0\.jpg/,
    );
    await expect(paragraph).toHaveText("Best Selling body");
    await expect(page.getByRole("link")).toHaveCount(1);
    await page.close();
  }
});

test("background pixels stay opaque throughout normal and interrupted fades", async () => {
  const page = await render(834, { imageColor: "black" });
  await expect
    .poll(() =>
      page
        .locator(".promotion-tabs img")
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  const sample = async () => {
    const png = await page.screenshot({
      clip: { x: 1, y: 1, width: 1, height: 1 },
    });
    return page.evaluate(async (data) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }, png.toString("base64"));
  };
  assert.deepEqual(await sample(), [0, 0, 0, 255]);
  for (const index of [1, 2, 0, 1]) {
    await page.locator(".promotion-tabs button").nth(index).click();
    await expect
      .poll(() =>
        page
          .locator(".promotion-tabs img")
          .last()
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await page.locator(".promotion-tabs").evaluate((section) => {
      for (const layer of section.querySelectorAll(
        ".promotion-tab-background",
      )) {
        for (const animation of layer.getAnimations()) {
          animation.pause();
          animation.currentTime = 250;
        }
      }
    });
    assert.deepEqual(
      await sample(),
      [0, 0, 0, 255],
      "identical opaque images must not flash gray",
    );
  }
  await page.locator(".promotion-tabs").evaluate((section) => {
    for (const layer of section.querySelectorAll(".promotion-tab-background")) {
      for (const animation of layer.getAnimations()) {
        animation.finish();
      }
    }
  });
  await expect(page.locator(".promotion-tab-background")).toHaveCount(1);
  await page.close();
});

test("slow or failed incoming images retain the last visible background and recover", async () => {
  const page = await render(834);
  let releaseImage;
  const pendingImage = new Promise((resolve) => {
    releaseImage = resolve;
  });
  await page.route("**/fixture1.jpg*", async (route) => {
    await pendingImage;
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="black" d="M0 0h20v20H0z"/></svg>',
    });
  });
  const layers = page.locator(".promotion-tab-background");
  await page.getByRole("button", { name: "Sofa Beds", exact: true }).click();
  await expect(layers).toHaveCount(2);
  await page.waitForTimeout(650);
  await expect(layers.first()).toHaveCSS("opacity", "1");
  await expect(layers.last()).toHaveCSS("opacity", "0");
  assert.match(
    await layers.first().locator("img").getAttribute("src"),
    /fixture0\.jpg/,
  );
  releaseImage();
  await expect(layers).toHaveCount(1);
  assert.match(
    await layers.locator("img").getAttribute("src"),
    /fixture1\.jpg/,
  );

  await page.route("**/fixture2.jpg*", (route) => route.abort());
  await page.getByRole("button", { name: "Decorations", exact: true }).click();
  await expect(layers).toHaveCount(2);
  await page.waitForTimeout(650);
  await expect(layers.first()).toHaveCSS("opacity", "1");
  await expect(layers.last()).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Best Selling", exact: true }).click();
  await expect(layers).toHaveCount(1);
  assert.match(
    await layers.locator("img").getAttribute("src"),
    /fixture0\.jpg/,
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const name of ["Sofa Beds", "Best Selling", "Sofa Beds"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(layers).toHaveCount(1);
    await expect(layers).toHaveCSS("animation-name", "none");
  }
  await page.close();
});

test("revisiting failed targets does not accumulate invisible background layers", async () => {
  const page = await render(834);
  await page.route(/\/fixture[12]\.jpg/, (route) => route.abort());
  for (const index of [1, 2, 1, 2, 1, 2]) {
    await page.locator(".promotion-tabs button").nth(index).click();
    await expect(page.locator(".promotion-tab-background")).toHaveCount(2);
    await expect(page.locator(".promotion-tab-background").first()).toHaveCSS(
      "opacity",
      "1",
    );
  }
  await page.locator(".promotion-tabs button").first().click();
  await expect(page.locator(".promotion-tab-background")).toHaveCount(1);
  await page.close();
});

test("Promotion slider matches responsive container and card spacing without clipping content", async () => {
  for (const width of [
    320,
    375,
    767,
    768,
    TABLET_MAX_PX,
    DESKTOP_MIN_PX,
    1728,
  ]) {
    const page = await render(width);
    await page.evaluate(() => window.renderSlider());
    const slider = page.locator(".promotion-slider");
    await expect(slider).toBeVisible();
    const mobile = width < 768;
    await expect(slider).toHaveCSS("max-width", "1440px");
    await expect(slider).toHaveCSS("padding-left", mobile ? "20px" : "32px");
    const card = page.locator(".promotion-grid-item").first();
    await expect(card).toHaveCSS("padding-left", "40px");
    await expect(card).toHaveCSS("padding-top", "80px");
    await expect(card).toHaveCSS("row-gap", "40px");
    await expect(card.locator(".paragraph")).toHaveCSS("padding-block", "16px");
    const bounds = await card.boundingBox();
    const button = await card.locator("a").boundingBox();
    assert.ok(
      button.y + button.height <= bounds.y + bounds.height - 79,
      JSON.stringify({ width, bounds, button }),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const next = slider.getByRole("button", { name: "carousel.nextSlide" });
    const nextBox = await next.boundingBox();
    assert.ok(
      nextBox.x < width && nextBox.x + nextBox.width > 0,
      "next control must be reachable",
    );
    if (width === 375) {
      await next.click();
      await expect(slider.locator(".swiper-slide-active .heading")).toHaveText(
        "Quality furniture made to last through moves and milestones.",
      );
    }
    await page.close();
  }
});

test("Style 1 preserves merchant letter spacing and keeps design tracking as the default", async () => {
  for (const width of [390, 834, 1440]) {
    const page = await render(width);
    for (const [letterSpacing, em] of [
      ["wide", 0.025],
      ["tight", -0.025],
      ["wider", 0.05],
      ["normal", isDesktopViewport(width) ? -0.03 : -0.02],
      [undefined, isDesktopViewport(width) ? -0.03 : -0.02],
    ]) {
      await page.evaluate(
        (spacing) =>
          window.renderSlider({
            itemProps: { size: "default", letterSpacing: spacing },
          }),
        letterSpacing,
      );
      const heading = page.locator(".promotion-grid-item .heading").first();
      await expect(heading).toBeVisible();
      const tracking = await heading.evaluate((element) => {
        const style = getComputedStyle(element);
        return parseFloat(style.letterSpacing) / parseFloat(style.fontSize);
      });
      assert.ok(
        Math.abs(tracking - em) < 0.0001,
        JSON.stringify({ width, letterSpacing, tracking, expected: em }),
      );
    }
    await page.close();
  }
});

test("Style 1 tablet follows the 834px Figma layout without changing mobile or desktop", async () => {
  for (const width of [
    375,
    767,
    768,
    834,
    TABLET_MAX_PX,
    DESKTOP_MIN_PX,
    1728,
  ]) {
    const page = await render(width);
    await page.evaluate(() => window.renderSlider({ count: 2 }));
    const tablet = width >= 768 && width < DESKTOP_MIN_PX;
    const slider = page.locator(".promotion-slider");
    const header = slider.locator("..").locator("h2");
    const card = slider.locator(".promotion-grid-item").first();
    await expect(header).toHaveCSS(
      "font-size",
      tablet ? "53px" : width < 768 ? "37px" : "44px",
    );
    await expect(card.locator(".heading")).toHaveCSS(
      "font-size",
      width < DESKTOP_MIN_PX ? "26px" : "44px",
    );
    await expect(card).toHaveCSS(
      "min-height",
      width < DESKTOP_MIN_PX ? "427px" : "462px",
    );
    const slides = slider.locator(".swiper-slide");
    const first = await slides.nth(0).boundingBox();
    const second = await slides.nth(1).boundingBox();
    const expectedGap = tablet ? 16 : width < 768 ? 10 : 20;
    assert.ok(Math.abs(second.x - first.x - first.width - expectedGap) < 1);
    if (tablet) {
      await expect(card.locator(".heading")).toHaveCSS("line-height", "28.6px");
      await expect(card.locator(".heading")).toHaveCSS("text-wrap", "wrap");
      assert.ok(Math.abs(first.width - (width - 64 - 16) / 2) < 1);
      assert.equal(first.x, 32);
    }
    if (width === 834 && process.env.PROMOTION_VISUAL_ASSETS) {
      await page.evaluate(() =>
        window.renderSlider({
          count: 2,
          headings: [
            "The best of every modern style from minimalist century.",
            "Quality furniture made to last through moves and milestones.",
          ],
        }),
      );
      for (const [family, path] of [
        [
          "Promotion Visual Heading",
          "@fontsource/tenor-sans/files/tenor-sans-latin-400-normal.woff2",
        ],
        [
          "Promotion Visual Body",
          "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
        ],
      ]) {
        const font = await readFile(`${root}node_modules/${path}`);
        await page.addStyleTag({
          content: `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${font.toString("base64")}) format("woff2");font-style:normal;font-weight:${family === "Promotion Visual Heading" ? "400" : "100 900"};}`,
        });
      }
      // The isolated fixture has no HTTP origin for CSS font URLs.
      await page.addStyleTag({
        content:
          ':root{--font-heading:"Promotion Visual Heading";--font-body:"Promotion Visual Body"}.font-heading,.heading{font-family:"Promotion Visual Heading"}.paragraph,.button{font-family:"Promotion Visual Body"}',
      });
      await page.evaluate(async () => {
        await Promise.all([
          document.fonts.load('400 53px "Promotion Visual Heading"'),
          document.fonts.load('400 14px "Promotion Visual Body"'),
        ]);
        await document.fonts.ready;
      });
      await expect(slider.locator("img").first()).toHaveJSProperty(
        "complete",
        true,
      );
      await slider.locator("..").screenshot({
        path: `${process.env.PROMOTION_VISUAL_ASSETS}/tablet.png`,
      });
    }
    await page.close();
  }
});

test("two-card mobile sliders can navigate and multiple sections stay independent", async () => {
  const page = await render(390);
  await page.evaluate(() => window.renderSlider({ count: 2, instances: 2 }));
  const sliders = page.locator(".promotion-slider");
  await expect(sliders).toHaveCount(2);
  for (const slider of await sliders.all()) {
    await expect(slider.locator(".swiper-slide-active .heading")).toHaveText(
      "The best of every modern style from minimalist to mid century.",
    );
  }
  await sliders
    .nth(1)
    .getByRole("button", { name: "carousel.nextSlide" })
    .click();
  await expect(
    sliders.nth(1).locator(".swiper-slide-active .heading"),
  ).toHaveText("Quality furniture made to last through moves and milestones.");
  await expect(
    sliders.nth(0).locator(".swiper-slide-active .heading"),
  ).toHaveText(
    "The best of every modern style from minimalist to mid century.",
  );
  await page.close();
});

test("all promotion cards share one bottom edge and retain 80px to the section bottom", async () => {
  for (const width of [390, 834, DESKTOP_MIN_PX, 1220, 1440, 1728]) {
    const page = await render(width);
    await page.evaluate(() => window.renderSlider({ count: 2 }));
    const geometry = await page.locator(".promotion-slider").evaluate((el) => {
      const bottom = el.parentElement.getBoundingClientRect().bottom;
      return [...el.querySelectorAll(".promotion-grid-item")].map((card) => {
        const box = card.getBoundingClientRect();
        return { height: box.height, bottomGap: bottom - box.bottom };
      });
    });
    assert.ok(
      geometry.every((card) => Math.abs(card.height - geometry[0].height) < 1),
      JSON.stringify({ width, geometry }),
    );
    assert.ok(
      geometry.every((card) => Math.abs(card.bottomGap - 80) < 1),
      JSON.stringify({ width, geometry }),
    );
    await page.close();
  }
});

test("mobile tab content grows before navigation rather than overlapping long copy", async () => {
  const page = await render(375);
  await page
    .locator(".promotion-tab-content:not([inert]) .paragraph")
    .evaluate((el) => (el.textContent = "Long translated content ".repeat(30)));
  const geometry = await page.locator(".promotion-tabs").evaluate((el) => {
    const paragraph = el.querySelector(".paragraph").getBoundingClientRect();
    const link = el.querySelector("a").getBoundingClientRect();
    const nav = el
      .querySelector("button")
      .parentElement.getBoundingClientRect();
    return {
      paragraphBottom: paragraph.bottom,
      linkTop: link.top,
      linkBottom: link.bottom,
      navTop: nav.top,
      height: el.getBoundingClientRect().height,
    };
  });
  assert.equal(geometry.linkTop - geometry.paragraphBottom, 40);
  assert.ok(geometry.navTop > geometry.linkBottom);
  assert.ok(geometry.height > 562);
  await page.close();
});

test("promotion navigation respects merchant visibility/shape and stays usable without hover on touch widths", async () => {
  for (const width of [390, 768, 1728]) {
    const page = await render(width);
    await page.evaluate(() =>
      window.renderSlider({ count: 2, showArrows: false, showDots: false }),
    );
    await expect(page.locator(".promotion-arrow-next")).toHaveCount(0);
    await expect(page.locator(".promotion-dots")).toHaveCount(0);
    await page.evaluate(() =>
      window.renderSlider({
        count: 2,
        showDots: true,
        arrowsShape: "square",
        showArrowsOnHover: true,
      }),
    );
    const next = page.getByRole("button", { name: "carousel.nextSlide" });
    await expect(next).toHaveCSS("border-radius", "0px");
    if (width < DESKTOP_MIN_PX) {
      await expect(next).toHaveCSS("opacity", "1");
    }
    if (width < 768) {
      await expect(page.locator(".promotion-dots")).toBeVisible();
    } else {
      await expect(page.locator(".promotion-dots")).toBeHidden();
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.close();
  }
});
