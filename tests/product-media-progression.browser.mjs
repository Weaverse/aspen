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
      window.renderGallery = (count, variant = 'product-page') => root.render(
        React.createElement(ProductMedia, {
          mediaLayout: 'slider', imageAspectRatio: '1/1', showThumbnails: false,
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
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "gallery-fixture",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen":
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

async function render(page, count, variant = "product-page") {
  await page.setContent(
    `<style>${css}:root {--radius-sm: 8px;} #root {width: 300px;}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate(
    (settings) => window.renderGallery(settings.count, settings.variant),
    { count, variant },
  );
  await expect(
    page.getByRole("button", { name: "Slide 1", exact: true }),
  ).toBeVisible();
}

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
        ).toHaveCSS("border-radius", "0px");
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
