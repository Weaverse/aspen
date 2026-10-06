import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

// Run with: node --test tests/product-card-review.browser.mjs
// Render the real ProductCard, ProductCardOptions, ProductItems and Swiper.
// Stub only CMS settings/content at the boundary, not the visual components.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { createMemoryRouter, RouterProvider } from "react-router";
      import { ProductCard } from "./app/components/product/product-card";
      import { ArrowButton } from "./app/components/arrow-button";
      import { TooltipProvider } from "./app/components/tooltip";
      import { WishlistProvider } from "./app/components/wishlist/wishlist-provider";
      import { CaretLeft } from "@phosphor-icons/react";
      import ProductItems from "./app/sections/featured-products/product-items";
      import FeaturedProducts from "./app/sections/featured-products";
      const image = (id, color) => ({ id, url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="' + color + '"/></svg>'), width: 200, height: 200 });
      const primary = image("primary", "red");
      const secondary = image("secondary", "blue");
      const money = { amount: "100", currencyCode: "USD" };
      const variant = (name, img) => ({ id: name, availableForSale: true, selectedOptions: [{ name: "Color", value: name }], image: img, price: money, compareAtPrice: null });
      const first = variant("Red", primary);
      const second = variant("Blue", secondary);
      const product = {
        id: "product", title: "Fixture product", handle: "fixture-product", vendor: "Fixture",
        images: { nodes: [primary, secondary] },
        priceRange: { minVariantPrice: money, maxVariantPrice: money },
        compareAtPriceRange: { minVariantPrice: money, maxVariantPrice: money },
        selectedOrFirstAvailableVariant: first, variants: { nodes: [first, second] },
        options: [{ name: "Color", optionValues: [
          { name: "Red", swatch: { color: "#FF0000" }, firstSelectableVariant: first },
          { name: "Blue", swatch: { color: "#0000FF" }, firstSelectableVariant: second },
        ] }], tags: [], badges: [{ key: "best_seller", value: "true" }], publishedAt: "2025-01-01",
      };
      window.start = ({ layout, settings = {}, mobileLayout = false, arrowsShape = "rounded-sm", arrowsColor = "secondary", arrowsIcon = "auto" } = {}) => {
        window.fixtureSettings = { pcardImageRatio: "1/1", pcardShowOptionValues: true, pcardOptionToShow: "Color", pcardShowImageOnHover: true, ...settings };
        const element = layout
          ? React.createElement(FeaturedProducts, { layout }, React.createElement(ProductItems, { loaderData: { products: [0,1,2,3,4].map(i => ({ ...product, id: "product-"+i })) }, productsToShow: 5, slidesPerView: 3, arrowsShape, arrowsColor, ...(arrowsIcon === "omitted" ? {} : { arrowsIcon }) }))
          : React.createElement("div", { style: { width: 320 } }, React.createElement(ProductCard, { product, mobileLayout }), React.createElement(ArrowButton, { tone: "neutral", "aria-label": "Recommendation previous" }, React.createElement(CaretLeft)));
        const router = createMemoryRouter([{ id: "root", path: "*", element: React.createElement(WishlistProvider, { initialWishlist: { authenticated: false, productIds: [] } }, React.createElement(TooltipProvider, null, element)) }]);
        createRoot(document.getElementById("root")).render(React.createElement(RouterProvider, { router }));
      };
    `,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "cms-fixture",
      setup(builder) {
        // Optional baseline run proves these assertions catch the old behavior.
        if (process.env.TEST_BASELINE_REF) {
          builder.onLoad(
            {
              filter:
                /app\/(components\/product\/product-card(?:-options)?|sections\/featured-products\/product-items)\.tsx$/,
            },
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
              ? "export const useTranslatedText = () => (value) => value;"
              : `export const createSchema = value => value;
               export const IMAGES_PLACEHOLDERS = {};
               export const useParentInstance = () => null;
               export const useThemeSettings = () => window.fixtureSettings;
               export const useTranslation = () => ({ t: (key, values = {}) => key + (values.value ? ':' + values.value : '') });`,
        }));
      },
    },
  ],
});

const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css =
  stylesheet.build(
    new Scanner({
      sources: [
        { base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false },
      ],
    }).scan(),
  ) + bundle.outputFiles.find((file) => file.path.endsWith(".css")).text;
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, options = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  page.setDefaultTimeout(5000);
  await page.setContent(`<style>${css}
    :root { --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px;
      --color-background: #FFF; --color-text: #343231; --color-text-subtle: #524B46;
      --color-line: #9D9D9D; --color-line-subtle: #D8D8D8;
      --pcard-border-radius-default: 8px; --pcard-hover-background-default: #F1F1F1;
      --btn-primary-bg: #123456; --btn-primary-text: #FFF;
      --btn-secondary-bg: #345678; --btn-secondary-text: #FEDCBA;
      --btn-secondary-bg-hover: #456789; --btn-secondary-text-hover: #ABCDEF;
      --btn-featured-products-nav-bg: #EDEAE6; --btn-featured-products-nav-text: #524B46;
      --btn-featured-products-nav-bg-hover: #D8D2CB; --btn-featured-products-nav-text-hover: #524B46; }
    #root { margin: 40px auto; width: min(100% - 40px, 1100px); }
  </style><div id="root"></div>`);
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  await page.evaluate((args) => window.start(args), options);
  await page.locator("article:visible").first().waitFor();
  return page;
}

test("standard product cards zoom only on desktop without swapping images", async () => {
  for (const width of [390, 768, 1032, 1033, 1440]) {
    for (const mobileLayout of [false, true]) {
      const page = await render(width, {
        mobileLayout,
        settings: { pcardHoverZoom: 130 },
      });
      const card = page.locator("article");
      await card.hover();
      await expect(card.locator("img")).toHaveCount(1);
      const image = card.locator("a").first().locator("img");
      await expect(image).toHaveCSS("opacity", "1");
      await expect(image).toHaveCSS(
        "scale",
        width >= 1033 && !mobileLayout ? "1.3" : "none",
      );
      await page.mouse.move(0, 0);
      await expect(image).toHaveCSS("scale", "none");
      await page.close();
    }
  }
});

test("zoom keeps the old 105% default and respects the existing off switch", async () => {
  for (const [settings, scale] of [
    [{}, "1.05"],
    [{ pcardImageZoom: false, pcardHoverZoom: 140 }, "none"],
    [{ pcardHoverZoom: 100 }, "1"],
  ]) {
    const page = await render(1440, { settings });
    const card = page.locator("article");
    await card.hover();
    await expect(card.locator("a").first().locator("img")).toHaveCSS(
      "scale",
      scale,
    );
    await page.close();
  }
});

test("Related products mobileLayout keeps its desktop padding, background and image frame", async () => {
  const page = await render(1440, { mobileLayout: true });
  const card = page.locator("article");
  const frame = card.locator("[data-product-card-image-frame]");
  await card.hover();
  await expect(card).toHaveCSS("padding-top", "20px");
  await expect(card).toHaveCSS("padding-left", "20px");
  await expect(card).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(frame).toHaveCSS("top", "0px");
  await expect(frame).toHaveCSS("left", "0px");
  await expect(card.locator("a").first().locator("img")).toHaveCSS(
    "scale",
    "none",
  );
  await page.close();
});

test("image insets 20px on desktop without resizing either featured card style", async () => {
  for (const layout of ["carousel", "grid"]) {
    for (const width of [390, 768, 1032, 1033, 1440]) {
      const page = await render(width, { layout });
      const card = page.locator("article:visible").first();
      const link = card.locator("a").first();
      const frame = card.locator("[data-product-card-image-frame]");
      const beforeCard = await card.boundingBox();
      const beforeLink = await link.boundingBox();
      await card.hover();
      await expect(frame).toHaveCSS("top", width >= 1033 ? "20px" : "0px");
      await expect(frame).toHaveCSS("right", width >= 1033 ? "20px" : "0px");
      await expect(frame).toHaveCSS("bottom", width >= 1033 ? "20px" : "0px");
      await expect(frame).toHaveCSS("left", width >= 1033 ? "20px" : "0px");
      assert.deepEqual(await card.boundingBox(), beforeCard);
      if (width >= 1033) {
        const bounds = await card.boundingBox();
        const imageBounds = await link.boundingBox();
        assert.ok(Math.abs(imageBounds.x - bounds.x - 20) < 0.1);
        assert.ok(
          Math.abs(
            bounds.x + bounds.width - imageBounds.x - imageBounds.width - 20,
          ) < 0.1,
        );
        assert.ok(Math.abs(imageBounds.y - bounds.y - 20) < 0.1);
        const info = await card.locator(":scope > div").last().boundingBox();
        assert.ok(
          Math.abs(info.y - imageBounds.y - imageBounds.height - 20) < 0.1,
        );
      } else {
        assert.deepEqual(await link.boundingBox(), beforeLink);
      }
      if (width >= 1033) {
        await expect(card).toHaveCSS("background-color", "rgb(241, 241, 241)");
      }
      await page.close();
    }
  }
});

test("keyboard focus gets the desktop image effect without moving the card", async () => {
  for (const width of [390, 768, 1440]) {
    const page = await render(width);
    const card = page.locator("article");
    const before = await card.boundingBox();
    await card.locator("a").first().focus();
    await expect(card.locator("[data-product-card-image-frame]")).toHaveCSS(
      "top",
      width >= 1033 ? "20px" : "0px",
    );
    await expect(card.locator("img")).toHaveCSS(
      "scale",
      width >= 1033 ? "1.05" : "none",
    );
    assert.deepEqual(await card.boundingBox(), before);
    await page.close();
  }
});

test("badges, wishlist and Quick Add stay inside the inset image frame", async () => {
  for (const width of [390, 768, 1032, 1033, 1440]) {
    const page = await render(width, {
      settings: {
        pcardEnableWishlist: true,
        pcardEnableQuickShop: true,
        pcardShowQuickShopOnHover: true,
        pcardShowBestSellerBadges: true,
        pcardShowBadgesOnMobile: true,
        bestSellerBadgeText: "Best seller",
      },
    });
    const card = page.locator("article");
    await card.hover();
    const frame = card.locator("[data-product-card-image-frame]");
    const quickAdd = frame.getByRole("button", {
      name: "product.selectOptions",
      exact: true,
    });
    if (width < 1033) {
      await expect(quickAdd.locator("svg")).toBeVisible();
      await expect(quickAdd.locator("span")).not.toBeVisible();
      await expect(quickAdd).toHaveCSS("width", "48px");
    } else {
      await expect(quickAdd.locator("svg")).not.toBeVisible();
      await expect(quickAdd.locator("span")).toBeVisible();
    }
    await expect(frame).toHaveCSS("top", width >= 1033 ? "20px" : "0px");
    const bounds = await frame.boundingBox();
    const badge = frame.locator(".best-seller-badge");
    const wishlist = frame.getByRole("button", {
      name: "wishlist.add",
      exact: true,
    });
    for (const overlay of [
      badge,
      frame.getByRole("button", { name: "product.selectOptions", exact: true }),
      ...(width >= 1033 ? [wishlist] : []),
    ]) {
      await expect(overlay).toBeVisible();
      const box = await overlay.boundingBox();
      assert.ok(box.x >= bounds.x && box.y >= bounds.y);
      assert.ok(box.x + box.width <= bounds.x + bounds.width + 0.1);
      assert.ok(box.y + box.height <= bounds.y + bounds.height + 0.1);
    }
    if (width >= 1033) {
      const badgeBox = await badge.boundingBox();
      const wishlistIconBox = await wishlist.locator("svg").boundingBox();
      assert.ok(
        Math.abs(
          badgeBox.y +
            badgeBox.height / 2 -
            (wishlistIconBox.y + wishlistIconBox.height / 2),
        ) < 0.1,
      );
    }
    await page.close();
  }
});

test("swatches use design radii, padding, colors and keep variant selection", async () => {
  const page = await render(1440);
  const red = page.getByRole("button", {
    name: "product.selectOptionValue:Red",
    exact: true,
  });
  const blue = page.getByRole("button", {
    name: "product.selectOptionValue:Blue",
    exact: true,
  });
  for (const swatch of [red, blue]) {
    await expect(swatch).toHaveCSS("border-radius", "4px");
    await expect(swatch).toHaveCSS("padding", "2px");
    await expect(swatch).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(swatch.locator("span")).toHaveCSS("width", "12px");
    await expect(swatch.locator("span")).toHaveCSS("height", "12px");
    await expect(swatch.locator("span")).toHaveCSS("border-radius", "4px");
  }
  await expect(red).toHaveCSS("border-color", "rgb(157, 157, 157)");
  await expect(blue).toHaveCSS("border-color", "rgb(216, 216, 216)");
  await expect(red).toHaveCSS("border-top-width", "1px");
  // Chromium snaps subpixel borders to device pixels; assert the authored
  // half-pixel width via the compiled utility as well as selection styling.
  assert.ok(
    await blue.evaluate((el) => el.classList.contains("border-[0.5px]")),
  );
  await blue.click();
  await expect(blue).toHaveAttribute("aria-pressed", "true");
  await expect(red).toHaveAttribute("aria-pressed", "false");
  await expect(blue).toHaveCSS("border-color", "rgb(157, 157, 157)");
  await expect(page.locator("article a").first()).toHaveAttribute(
    "href",
    /Color=Blue/,
  );
  await page.close();
});

test("product slider nav matches design and retains color and shape choices", async () => {
  for (const shape of ["rounded-sm", "square", "circle"]) {
    for (const color of ["primary", "secondary"]) {
      const page = await render(1440, {
        layout: "carousel",
        arrowsShape: shape,
        arrowsColor: color,
      });
      const button = page.getByRole("button", {
        name: "product.nextProduct",
        exact: true,
      });
      await expect(button).toHaveCSS("padding", "12px");
      const buttonBounds = await button.boundingBox();
      assert.equal(buttonBounds.width, 44);
      assert.equal(buttonBounds.height, 44);
      await expect(button.locator("svg")).toHaveAttribute(
        "viewBox",
        "0 0 9 17",
      );
      const icon = await button.locator("svg").boundingBox();
      assert.equal(icon.width, 9);
      assert.equal(icon.height, 17);
      await expect(button.locator("svg path")).toHaveAttribute(
        "fill",
        "currentColor",
      );
      await expect(button.locator("svg")).toHaveCSS("rotate", "180deg");
      await expect(button).toHaveCSS(
        "background-color",
        color === "secondary" ? "rgb(237, 234, 230)" : "rgb(18, 52, 86)",
      );
      if (color === "secondary") {
        await expect(button).toHaveCSS("color", "rgb(82, 75, 70)");
        await button.hover();
        await expect(button).toHaveCSS(
          "background-color",
          "rgb(216, 210, 203)",
        );
        await expect(button).toHaveCSS("color", "rgb(82, 75, 70)");
      }
      if (shape !== "circle") {
        await expect(button).toHaveCSS(
          "border-radius",
          shape === "square" ? "0px" : "12px",
        );
      }
      await page.close();
    }
  }
  const page = await render(1440);
  const button = page.getByRole("button", { name: "Recommendation previous" });
  await expect(button).toHaveCSS("padding", "12px");
  await expect(button).toHaveCSS("border-radius", "12px");
  await page.close();
});

test("Style 1 left and right carets share the supplied design path", async () => {
  const page = await render(1440, { layout: "carousel" });
  const left = page.getByRole("button", {
    name: "product.previousProduct",
    exact: true,
  });
  const right = page.getByRole("button", {
    name: "product.nextProduct",
    exact: true,
  });
  const leftPath = await left.locator("svg path").getAttribute("d");
  const rightPath = await right.locator("svg path").getAttribute("d");
  assert.equal(leftPath, rightPath);
  assert.ok(leftPath?.startsWith("M0.219934 7.71993L7.71993 0.219933"));
  await expect(left.locator("svg")).toHaveCSS("rotate", "none");
  await expect(right.locator("svg")).toHaveCSS("rotate", "180deg");
  await page.close();
});

test("Style 1 nav uses its own theme colors while Style 2 retains Secondary colors", async () => {
  const carousel = await render(1440, { layout: "carousel" });
  await carousel.addStyleTag({
    content:
      ":root { --btn-featured-products-nav-bg: #AABBCC; --btn-featured-products-nav-text: #112233; --btn-featured-products-nav-bg-hover: #CCDDEE; --btn-featured-products-nav-text-hover: #334455; }",
  });
  const carouselButton = carousel.getByRole("button", {
    name: "product.nextProduct",
    exact: true,
  });
  await expect(carouselButton).toHaveCSS(
    "background-color",
    "rgb(170, 187, 204)",
  );
  await expect(carouselButton).toHaveCSS("color", "rgb(17, 34, 51)");
  await carouselButton.hover();
  await expect(carouselButton).toHaveCSS(
    "background-color",
    "rgb(204, 221, 238)",
  );
  await expect(carouselButton).toHaveCSS("color", "rgb(51, 68, 85)");
  await carousel.close();

  const grid = await render(390, { layout: "grid" });
  const gridButton = grid.getByRole("button", {
    name: "product.nextProduct",
    exact: true,
  });
  await expect(gridButton).toHaveCSS("background-color", "rgb(52, 86, 120)");
  await expect(gridButton).toHaveCSS("color", "rgb(254, 220, 186)");
  await grid.close();
});

test("saved sections without arrowsIcon retain the Arrow fallback", async () => {
  const page = await render(1440, {
    layout: "carousel",
    arrowsIcon: "omitted",
  });
  const iconPath = await page
    .getByRole("button", { name: "product.nextProduct", exact: true })
    .locator("svg path")
    .getAttribute("d");
  const newPage = await render(1440, {
    layout: "carousel",
    arrowsIcon: "auto",
  });
  const newIconPath = await newPage
    .getByRole("button", { name: "product.nextProduct", exact: true })
    .locator("svg path")
    .getAttribute("d");
  assert.notEqual(iconPath, newIconPath);
  await page.close();
  await newPage.close();
});

test("only Style 1 receives the new nav design and 32px slider gap", async () => {
  for (const [layout, widths] of [
    ["carousel", [390, 768, 1033, 1440]],
    ["grid", [390]],
  ]) {
    for (const width of widths) {
      const page = await render(width, { layout });
      await page.locator(".swiper-initialized").waitFor();
      const gap = await page
        .getByRole("button", { name: "product.nextProduct", exact: true })
        .evaluate((button) => {
          const controls = button.parentElement;
          const slider = controls.previousElementSibling;
          return (
            controls.getBoundingClientRect().top -
            slider.getBoundingClientRect().bottom
          );
        });
      assert.equal(
        gap,
        layout === "carousel" ? 32 : 24,
        `${layout} at ${width}`,
      );
      if (layout === "grid") {
        await expect(
          page.getByRole("button", {
            name: "product.nextProduct",
            exact: true,
          }),
        ).toHaveCSS("padding", "16px");
      } else {
        const button = page.getByRole("button", {
          name: "product.nextProduct",
          exact: true,
        });
        await expect(button).toHaveCSS("padding", "12px");
        const bounds = await button.boundingBox();
        assert.equal(bounds.width, 44);
        assert.equal(bounds.height, 44);
      }
      await page.close();
    }
  }
});
