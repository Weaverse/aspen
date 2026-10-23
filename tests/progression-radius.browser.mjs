import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const callers = [
  "app/components/product/quick-shop.tsx",
  "app/components/cart/cart-summary.tsx",
  "app/sections/main-product/index.tsx",
  "app/sections/ali-reviews/review-bar.tsx",
  "app/sections/judgeme-reviews/review-form.tsx",
  "app/components/product/product-media.tsx",
  "app/sections/promotion-grid/dots.tsx",
  "app/sections/slideshow/dots.tsx",
  "app/components/root/global-loading.tsx",
];
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ProgressBar,SegmentedProgressBar} from './app/components/progress-bar';
    const root=createRoot(document.getElementById('root'));
    window.renderProgress=({segmented,...props})=>root.render(segmented ?
      <SegmentedProgressBar data-testid="track" {...props} count={5}
        getLabel={i=>'Slide '+(i+1)} onSegmentSelect={i=>window.lastSelection=i}/>
      :<ProgressBar data-testid="track" {...props}/>);
  `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
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

test("every progression caller uses the shared component", async () => {
  for (const file of callers) {
    const source = await readFile(`${root}${file}`, "utf8");
    assert.match(source, /from "~\/components\/progress-bar"/, file);
    assert.doesNotMatch(source, /bg-progress-(active|track)/, file);
  }
});

test("shared percentage bars retain caller geometry, colors, radius and zero/full widths", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 834, 1032, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--radius-sm:8px;--color-line:red;--color-text:green}#root{width:300px}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const [className, indicatorClassName, height, trackWidth] of [
        ["h-1 w-full", "h-1", 4, 300],
        [
          "relative h-1 w-full max-xl:order-1",
          "h-full transition-all duration-300",
          4,
          300,
        ],
        ["flex h-1", "block h-full transition-[width]", 4, 300],
        ["h-1.5 w-72 max-w-80", "h-1.5", 6, 288],
        ["h-2", "block h-full", 8, 300],
      ]) {
        for (const value of [0, 40, 100]) {
          await page.evaluate((props) => window.renderProgress(props), {
            className,
            indicatorClassName,
            value,
          });
          const track = page.getByTestId("track"),
            fill = track.locator(":scope > div");
          await expect(track).toHaveCSS("height", `${height}px`);
          await expect(track).toHaveCSS("width", `${trackWidth}px`);
          await expect(track).toHaveCSS(
            "background-color",
            "rgb(216, 216, 216)",
          );
          await expect(fill).toHaveCSS(
            "background-color",
            "rgb(157, 157, 157)",
          );
          await expect
            .poll(async () =>
              Math.abs(
                (await fill.evaluate(
                  (el) => el.getBoundingClientRect().width,
                )) -
                  (trackWidth * value) / 100,
              ),
            )
            .toBeLessThan(0.05);
          await expect(fill).toHaveCSS("height", `${height}px`);
          for (const radius of [8, 12]) {
            await page.addStyleTag({
              content: `:root{--radius-sm:${radius}px}`,
            });
            await expect(track).toHaveCSS("border-radius", `${radius}px`);
            await expect(fill).toHaveCSS("border-radius", `${radius}px`);
            await expect(track).toHaveCSS("overflow", "hidden");
          }
        }
      }
      await page.evaluate(() =>
        window.renderProgress({
          className: "fixed inset-x-0 top-0 h-1 bg-transparent",
          indicatorClassName: "h-full w-0 opacity-0",
        }),
      );
      await expect(page.getByTestId("track")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      await expect(page.getByTestId("track").locator(":scope > div")).toHaveCSS(
        "width",
        "0px",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("segmented bars preserve single/cumulative selection, geometry and click/keyboard actions", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root{--radius-sm:8px}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const [
        className,
        segmentClassName,
        segmentStyle,
        height,
        trackWidth,
      ] of [
        ["flex w-40", "h-0.5 min-w-0 flex-1", undefined, 2, 160],
        ["flex w-40", "h-0.5", { width: 32, minWidth: 32 }, 2, 160],
        ["flex h-1 w-40", "flex-1", undefined, 4, 160],
        ["flex w-fit min-w-0", "h-1 w-12", undefined, 4, 240],
      ]) {
        for (const cumulative of [false, true]) {
          await page.evaluate((props) => window.renderProgress(props), {
            segmented: true,
            activeIndex: 2,
            cumulative,
            markCurrent: true,
            className,
            segmentClassName,
            segmentStyle,
          });
          const track = page.getByTestId("track"),
            buttons = track.getByRole("button");
          await expect(track).toHaveCSS("width", `${trackWidth}px`);
          await expect(track).toHaveCSS("height", `${height}px`);
          await expect(track).toHaveCSS("border-radius", "8px");
          await expect(buttons).toHaveCount(5);
          for (let i = 0; i < 5; i += 1) {
            await expect(buttons.nth(i)).toHaveCSS(
              "background-color",
              (cumulative ? i <= 2 : i === 2)
                ? "rgb(157, 157, 157)"
                : "rgb(216, 216, 216)",
            );
          }
          await expect(buttons.nth(2)).toHaveAttribute("aria-current", "true");
          await buttons.nth(4).click();
          assert.equal(await page.evaluate(() => window.lastSelection), 4);
          await buttons.nth(1).press("Enter");
          assert.equal(await page.evaluate(() => window.lastSelection), 1);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
