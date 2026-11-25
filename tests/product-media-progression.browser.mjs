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
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {ProductMedia} from './app/components/product/product-media';
      const root = createRoot(document.getElementById('root'));
      window.renderGallery = (count, variant = 'product-page', shape = 'rounded-sm') => root.render(
        React.createElement(ProductMedia, {
          arrowsShape: shape, mediaLayout: 'slider', imageAspectRatio: '1/1', showThumbnails: false,
          showDots: true, navigationStyle: 'sides', navigationVariant: variant,
          media: Array.from({length: count}, (_, i) => ({
            id: String(i), __typename: 'MediaImage', mediaContentType: 'IMAGE',
            image: {url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', width: 500, height: 500},
          })),
        }),
      );
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  define: { "import.meta.env.DEV": "false" },
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "gallery-fixture",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen/react-router":
            "export const useTranslation = () => ({t: (key, value) => value ? 'Slide ' + value.index : key});",
          "./media-zoom": "export const ZoomModal = () => null;",
          "~/components/image":
            "import React from 'react'; export const Image = ({data, className}) => React.createElement('img', {src: data?.url, className});",
        };
        builder.onResolve({ filter: /./ }, ({ path }) =>
          path in stubs ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /./, namespace: "fixture" }, ({ path }) => ({
          contents: stubs[path],
          loader: "js",
          resolveDir: root,
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
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

async function render(
  page,
  count,
  variant = "product-page",
  shape = "rounded-sm",
) {
  await page.setContent(
    `<style>${css}:root {--radius-sm: 8px;} #root {width: 300px;}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate(
    (settings) =>
      window.renderGallery(settings.count, settings.variant, settings.shape),
    { count, variant, shape },
  );
  await expect(
    page.getByRole("button", { name: "Slide 1", exact: true }),
  ).toBeVisible();
}

test("gallery progression fills cumulatively and retracts across variants and breakpoints", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      for (const variant of ["default", "quick-shop", "product-page"]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await render(page, 5, variant);
        const first = page.getByRole("button", {
          name: "Slide 1",
          exact: true,
        });
        const second = page.getByRole("button", {
          name: "Slide 2",
          exact: true,
        });
        await expect(first).toHaveCSS("background-color", "rgb(157, 157, 157)");
        await expect(second).toHaveCSS(
          "background-color",
          "rgb(216, 216, 216)",
        );
        await second.hover();
        await expect(second).toHaveCSS(
          "background-color",
          "rgb(216, 216, 216)",
        );
        await second.click();
        await expect(second).toHaveCSS(
          "background-color",
          "rgb(157, 157, 157)",
        );
        await expect(first).toHaveCSS("background-color", "rgb(157, 157, 157)");
        const third = page.getByRole("button", {
          name: "Slide 3",
          exact: true,
        });
        await expect(third).toHaveCSS("background-color", "rgb(216, 216, 216)");
        await page
          .getByRole("button", { name: "Slide 5", exact: true })
          .click();
        for (let index = 1; index <= 5; index += 1) {
          await expect(
            page.getByRole("button", { name: `Slide ${index}`, exact: true }),
          ).toHaveCSS("background-color", "rgb(157, 157, 157)");
        }
        await second.click();
        await expect(first).toHaveCSS("background-color", "rgb(157, 157, 157)");
        await expect(second).toHaveCSS(
          "background-color",
          "rgb(157, 157, 157)",
        );
        await expect(third).toHaveCSS("background-color", "rgb(216, 216, 216)");
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("product-page gallery arrows have no shadow at every breakpoint", async () => {
  // Tailwind composes shadow-none as transparent zero-size shadow layers.
  const noVisibleShadow =
    /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/;
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await render(page, 5);
      for (const name of ["product.previousMedia", "product.nextMedia"]) {
        await expect(page.getByRole("button", { name, exact: true })).toHaveCSS(
          "box-shadow",
          noVisibleShadow,
        );
      }
      await page.close();
    }
    const page = await browser.newPage();
    await render(page, 5, "default");
    await expect(
      page.getByRole("button", { name: "product.nextMedia", exact: true }),
    ).not.toHaveCSS("box-shadow", noVisibleShadow);
  } finally {
    await browser.close();
  }
});

test("progression returns to the first segment when the gallery loops", async () => {
  const browser = await chromium.launch();
  try {
    for (const variant of ["product-page", "default", "quick-shop"]) {
      const page = await browser.newPage();
      await render(page, 5, variant);
      await page.getByRole("button", { name: "Slide 5", exact: true }).click();
      await expect(page.locator(".swiper-slide-active")).toHaveAttribute(
        "data-swiper-slide-index",
        "4",
      );
      await expect
        .poll(() =>
          page.locator(".swiper").evaluate((el) => el.swiper.animating),
        )
        .toBe(false);
      await page
        .getByRole("button", { name: "product.nextMedia", exact: true })
        .click();
      await expect(page.locator(".swiper-slide-active")).toHaveAttribute(
        "data-swiper-slide-index",
        "0",
      );
      await expect(
        page.getByRole("button", { name: "Slide 1", exact: true }),
      ).toHaveClass(/!bg/);
      await expect(
        page.getByRole("button", { name: "Slide 5", exact: true }),
      ).not.toHaveClass(/!bg/);
      if (variant !== "product-page") {
        await expect(
          page
            .getByRole("button", { name: "Slide 1", exact: true })
            .locator(".."),
        ).toHaveCSS("border-radius", "8px");
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("product progression fills its track and uses the small radius token at every width", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      for (const count of [3, 5, 9]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await render(page, count);
        const first = page.getByRole("button", {
          name: "Slide 1",
          exact: true,
        });
        const last = page.getByRole("button", {
          name: `Slide ${count}`,
          exact: true,
        });
        await last.click();
        await expect(last).toHaveClass(/!bg/);
        const bounds = await last.evaluate((b) => ({
          right: b.getBoundingClientRect().right,
          trackRight: b.parentElement.getBoundingClientRect().right,
        }));
        expect(Math.abs(bounds.right - bounds.trackRight)).toBeLessThan(1);
        await expect(first.locator("..")).toHaveCSS("border-radius", "8px");
        await expect(first.locator("..")).toHaveCSS("overflow", "hidden");
        await page.addStyleTag({ content: ":root {--radius-sm: 10px;}" });
        await expect(first.locator("..")).toHaveCSS("border-radius", "10px");
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Main Product frame stays square across mobile/tablet/desktop and image counts", async () => {
  const source = await readFile(
    `${root}app/sections/main-product/index.tsx`,
    "utf8",
  );
  const frameClass = source.match(
    /"([^"\n]*\[&_\.product-media-slider\][^"\n]*)"/,
  )[1];
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 430, 767, 768, 1024, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(
        `<style>${css}body{margin:0}#root{width:100%}</style><div class="${frameClass}" data-testid="main-product-frame"><div id="root"></div></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const count of [1, 3]) {
        await page.evaluate((value) => window.renderGallery(value), count);
        await expect(page.locator(".product-media-slider")).toBeVisible();
        await expect
          .poll(async () => {
            const box = await page
              .getByTestId("main-product-frame")
              .boundingBox();
            return Math.abs(box.width - box.height);
          })
          .toBeLessThan(1);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Main Product mobile/tablet gallery is square and flush with the viewport for padded section widths", async () => {
  const source = await readFile(
    `${root}app/sections/main-product/index.tsx`,
    "utf8",
  );
  const frameClass = source.match(
    /"([^"\n]*\[&_\.product-media-slider\][^"\n]*)"/,
  )[1];
  const bleedClass = source.match(/"(-mx-\(--page-padding\)[^"\n]*)"/)[1];
  const browser = await chromium.launch();
  try {
    for (const width of [390, 430, 767, 768, 1024, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const padding = width < 512 ? 20 : width < 1033 ? 32 : 40;
      for (const padded of [false, true]) {
        await page.setContent(
          `<style>${css}body{margin:0;--page-padding:${padding}px}#root{width:100%}</style><section style="padding-inline:${padded ? padding : 0}px"><div class="${frameClass} ${padded ? bleedClass : ""}" data-testid="frame"><div id="root"></div></div><p data-testid="details">Product details</p></section>`,
        );
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(() => window.renderGallery(3));
        await expect(page.locator(".product-media-slider")).toBeVisible();
        const frame = await page.getByTestId("frame").boundingBox();
        expect(Math.abs(frame.width - frame.height)).toBeLessThan(1);
        if (width < 1033) {
          expect(frame.x).toBe(0);
          expect(frame.width).toBe(width);
        }
        const details = await page.getByTestId("details").boundingBox();
        expect(details.x).toBe(padded ? padding : 0);
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          ),
        ).toBe(false);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("product-page media arrows respect merchant shape below and above desktop", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1024, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      for (const shape of ["circle", "square"]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await render(page, 5, "product-page", shape);
        for (const name of ["product.previousMedia", "product.nextMedia"]) {
          const arrow = page.getByRole("button", { name, exact: true });
          const radius = await arrow.evaluate((el) => {
            const style = getComputedStyle(el);
            return {
              radius: parseFloat(style.borderTopLeftRadius),
              width: el.getBoundingClientRect().width,
            };
          });
          if (shape === "square") {
            expect(radius.radius).toBe(0);
          } else {
            expect(radius.radius).toBeGreaterThanOrEqual(radius.width / 2);
          }
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
