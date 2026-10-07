import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

// Run with: node --test tests/slideshow-animation.browser.mjs
// Keep the real Slideshow, Slide, animation hook and Swiper; only stub CMS data.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import Slideshow from "./app/sections/slideshow";
      import Slide from "./app/sections/slideshow/slide";
      import { useAnimation } from "./app/hooks/use-animation";
      function ScrollSection() {
        const [scope] = useAnimation();
        return React.createElement("div", { ref: scope, style: { marginTop: 2000 } },
          React.createElement("h2", { className: "heading", "data-motion": "fade-up" }, "Scroll content")
        );
      }
      window.startSection = () => createRoot(document.getElementById("root")).render(React.createElement(ScrollSection));
      function NestedContent() {
        const [scope] = useAnimation();
        return React.createElement("div", { ref: scope },
          React.createElement("h2", { className: "heading", "data-motion": "fade-up" }, "Nested content")
        );
      }
      function NestedSection() {
        const [scope] = useAnimation();
        return React.createElement("section", { ref: scope, style: { marginTop: 2000 } },
          React.createElement("h2", { className: "heading", "data-motion": "fade-up" }, "Parent content"),
          React.createElement(NestedContent)
        );
      }
      window.startNested = () => createRoot(document.getElementById("root")).render(React.createElement(NestedSection));
      window.start = (effect, dotsPosition, arrowsShape, className) => createRoot(document.getElementById("root")).render(
        React.createElement(Slideshow, {
          effect, loop: true, showDots: true, showArrows: true,
          dotsPosition,
          className,
          arrowsIcon: "caret", iconSize: 24, arrowsShape,
          autoRotate: false, changeSlidesEvery: 5,
          children: ["First", "Second", "Third"].map((headingContent) =>
            React.createElement(Slide, { key: headingContent, headingContent, animate: true })
          ),
        })
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
      name: "cms-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "cms",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "translation"
              ? "export const useTranslatedText = () => (value) => value;"
              : `export const createSchema = (value) => value;
                 export const useThemeSettings = () => ({ revealElementsOnScroll: true });
                 export const useTranslation = () => ({ t: (key) => key });`,
          loader: "js",
        }));
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(new URL("../app/styles/app.css", import.meta.url), "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

const dotsLayout = {
  mobilePadding: 32,
  pagePadding: 40,
  mediumBreakpoint: 768,
  largeBreakpoint: 1025,
  extraLargeBreakpoint: 1536,
  pageWidths: [1440, 1600],
};

function getExpectedDotsLeft(viewportWidth, pageWidth) {
  const centeredPageInset =
    (viewportWidth - Math.min(viewportWidth, pageWidth)) / 2;
  if (viewportWidth >= dotsLayout.extraLargeBreakpoint) {
    return centeredPageInset;
  }
  return (
    centeredPageInset +
    (viewportWidth >= dotsLayout.mediumBreakpoint
      ? dotsLayout.pagePadding
      : dotsLayout.mobilePadding)
  );
}

test("slideshow arrow shapes override the shared button radius", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1440]) {
      for (const [shape, radius] of [
        ["square", "0px"],
        ["rounded-sm", "12px"],
        ["circle", "9999px"],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        await page.setContent(`<style>${css}
          :root { --radius-md: 12px; }
          .swiper { width: 100%; height: 300px; }
        </style><div id="root"></div>`);
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(
          (value) => window.start("fade", "left", value),
          shape,
        );
        await page.waitForSelector(".swiper-initialized");
        for (const name of ["carousel.previousSlide", "carousel.nextSlide"]) {
          const actual = await page
            .getByRole("button", { name })
            .evaluate(
              (element) => getComputedStyle(element).borderTopLeftRadius,
            );
          if (shape === "circle") {
            assert.ok(
              Number.parseFloat(actual) >= 20,
              `${shape} at ${width}: ${actual}`,
            );
          } else {
            assert.equal(actual, radius, `${shape} at ${width}`);
          }
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

for (const effect of ["fade", "slide"]) {
  test(`${effect}: animate only the active slide, including subsequent visits`, async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(`<style>${css}
        .swiper { width: 800px; height: 300px; }
        .swiper-slide > div { height: 300px; }
        .md\\:hidden { display: none; }
      </style><div id="root"></div>`);
      await page.evaluate(() => {
        window.headingAnimations = [];
        const original = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          if (this.matches(".heading")) {
            window.headingAnimations.push(this.textContent);
          }
          return original.apply(this, args);
        };
      });
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((value) => window.start(value), effect);
      await page.waitForSelector(".swiper-initialized");
      await page.waitForTimeout(900);
      assert.deepEqual(await page.evaluate(() => window.headingAnimations), [
        "First",
      ]);

      let outgoingHeading = "First";
      for (const heading of ["Second", "Third", "First"]) {
        const previous = await page.evaluate(
          () => window.headingAnimations.length,
        );
        if (heading === "First") {
          await page.locator(".dot").first().click();
        } else {
          await page
            .getByRole("button", { name: "carousel.nextSlide" })
            .click();
        }
        await page.waitForTimeout(100);
        assert.equal(
          await page
            .locator(".heading")
            .filter({ hasText: outgoingHeading })
            .first()
            .evaluate((element) => getComputedStyle(element).opacity),
          "1",
          "Outgoing content must remain visible while its slide fades or slides out",
        );
        await page.waitForTimeout(800);
        assert.deepEqual(
          await page.evaluate(
            (offset) => window.headingAnimations.slice(offset),
            previous,
          ),
          [heading],
        );
        assert.equal(
          await page
            .locator(".swiper-slide-active .heading")
            .first()
            .evaluate((element) => getComputedStyle(element).opacity),
          "1",
        );
        outgoingHeading = heading;
      }

      // Cancel several content reveals before they finish, including a loop.
      for (let index = 0; index < 6; index += 1) {
        await page
          .locator(".swiper")
          .evaluate((element) => element.swiper.slideNext(0));
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(900);
      assert.equal(
        await page
          .locator(".swiper-slide-active .heading")
          .first()
          .evaluate((element) => getComputedStyle(element).opacity),
        "1",
        "Cancelled animations must not hide the final active slide",
      );
    } finally {
      await browser.close();
    }
  });
}

test("other sections still reveal content only when scrolled into view", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.evaluate(() => {
      window.headingAnimations = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        if (this.matches(".heading")) {
          window.headingAnimations.push(this.textContent);
        }
        return original.apply(this, args);
      };
    });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => window.startSection());
    await page.waitForSelector(".heading", { state: "attached" });
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => window.headingAnimations), []);
    await page.locator(".heading").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => window.headingAnimations), [
      "Scroll content",
    ]);
  } finally {
    await browser.close();
  }
});

test("nested animation scopes leave all content visible after completion", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.evaluate(() => {
      // Pin the observer race: a duplicate ancestor observation arrives after
      // the child's observation. Native intersections still drive both.
      const NativeObserver = window.IntersectionObserver;
      const observations = new WeakMap();
      window.IntersectionObserver = class extends NativeObserver {
        constructor(callback, options) {
          super((entries, observer) => {
            const delay = this.observationNumber > 1 ? 50 : 0;
            setTimeout(() => callback(entries, observer), delay);
          }, options);
        }
        observe(element) {
          this.observationNumber = (observations.get(element) || 0) + 1;
          observations.set(element, this.observationNumber);
          super.observe(element);
        }
      };
      window.headingAnimations = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        if (this.matches(".heading")) {
          window.headingAnimations.push(this.textContent);
        }
        return original.apply(this, args);
      };
    });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => window.startNested());
    await page.waitForSelector(".heading");
    await page.waitForTimeout(300);
    await page.locator("section").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
    assert.deepEqual(
      await page.evaluate(() => window.headingAnimations.sort()),
      ["Nested content", "Parent content"],
      "Each node must be animated by one scope only",
    );
    assert.deepEqual(
      await page
        .locator(".heading")
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).opacity),
        ),
      ["1", "1"],
    );
  } finally {
    await browser.close();
  }
});

test("dots stay at the bottom and align responsively to the page container", async () => {
  const browser = await chromium.launch();
  try {
    for (const pageWidth of dotsLayout.pageWidths) {
      for (const viewportWidth of [
        390, 767, 768, 1024, 1025, 1535, 1536, 1920,
      ]) {
        for (const position of [
          undefined,
          "left",
          "middle",
          "top",
          "bottom",
          "right",
        ]) {
          const page = await browser.newPage();
          await page.setViewportSize({ width: viewportWidth, height: 1000 });
          await page.setContent(`<style>${css}
        :root { --page-padding: ${dotsLayout.pagePadding}px; --page-width: ${pageWidth}px; }
        .swiper { width: 100%; height: 300px; }
      </style><div id="root"></div>`);
          await page.addScriptTag({ content: bundle.outputFiles[0].text });
          await page.evaluate((value) => window.start("fade", value), position);
          await page.waitForSelector(".swiper-initialized");
          const layout = await page.locator(".swiper").evaluate((element) => {
            const banner = element.getBoundingClientRect();
            const track = element
              .querySelector(".slideshow-dots > div > div")
              .getBoundingClientRect();
            return {
              bottom: banner.bottom - track.bottom,
              left: track.left - banner.left,
              center:
                (track.left + track.right - banner.left - banner.right) / 2,
              width: track.width,
              height: track.height,
            };
          });
          assert.equal(
            layout.bottom,
            viewportWidth >= dotsLayout.largeBreakpoint ? 71 : 73,
          );
          assert.equal(layout.width, 160);
          assert.equal(layout.height, 4);
          if (position === "middle") {
            assert.ok(Math.abs(layout.center) < 1);
          } else {
            assert.equal(
              layout.left,
              getExpectedDotsLeft(viewportWidth, pageWidth),
            );
          }
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test("dots layout className overrides apply to the responsive container", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}
      :root { --page-padding: 40px; --page-width: 1440px; }
      .swiper { width: 100%; height: 300px; }
    </style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() =>
      window.start("fade", "left", undefined, "max-w-none px-0 justify-center"),
    );
    await page.waitForSelector(".swiper-initialized");
    const centerOffset = await page.locator(".swiper").evaluate((element) => {
      const banner = element.getBoundingClientRect();
      const track = element
        .querySelector(".slideshow-dots > div > div")
        .getBoundingClientRect();
      return (track.left + track.right - banner.left - banner.right) / 2;
    });
    assert.ok(Math.abs(centerOffset) < 1);
    await page.close();
  } finally {
    await browser.close();
  }
});
