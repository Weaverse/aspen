import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const sources = await Promise.all(
  [
    "app/sections/main-product/index.tsx",
    "app/sections/single-product/index.tsx",
    "app/components/product/quick-shop.tsx",
  ].map((path) => readFile(`${root}${path}`, "utf8")),
);
function priceRow(source, opening) {
  const start = source.indexOf(opening);
  expect(start).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf("</div>", start) + 6);
}
const main = priceRow(
  sources[0],
  '<div className="flex items-center gap-2 font-heading font-normal text-2xl leading-[normal]">',
);
const featured = priceRow(
  sources[1],
  '<div className="flex items-center gap-3 font-heading font-normal text-2xl">',
);
const quick = sources[2].match(/<VariantPrices[\s\S]*?\/>/)[0];
const moneyFixture = `
  import React from "react";
  const format = (data) => new Intl.NumberFormat(window.moneyLocale || "en-US", {
    style:"currency",currency:data.currencyCode,minimumFractionDigits:0,maximumFractionDigits:2,
  });
  export const Money=({data,className}) => <span className={className}>{format(data).format(Number(data.amount))}</span>;
  export const useMoney=(data) => {
    const formatter=format(data), value=formatter.format(Number(data.amount));
    const symbol=formatter.formatToParts(Number(data.amount)).find(p=>p.type==="currency").value;
    return {withoutTrailingZeros:value,currencySymbol:symbol,currencyNarrowSymbol:symbol,
      withoutTrailingZerosAndCurrency:value.replace(symbol,"").trim()};
  };
`;
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
    import React from "react";
    import {createRoot} from "react-dom/client";
    import {Money} from "@shopify/hydrogen";
    import {VariantPrices, SpacedMoney, ProductCompareAtPrice} from "./app/components/product/variant-prices";
    import {isDiscounted} from "./app/utils/product";
    const root=createRoot(document.getElementById("root"));
    window.renderPrices=({locale="en-US",currency="USD",compare="999",price="699",show=true}={})=>{
      window.moneyLocale=locale;
      const selectedVariant={price:{amount:price,currencyCode:currency},compareAtPrice:compare===null?null:{amount:compare,currencyCode:currency}};
      const currentVariant=selectedVariant, showSalePrice=show, showCompareAtPrice=show;
      root.render(<>
        <section data-caller="main">${main}</section>
        <section data-caller="featured">${featured}</section>
        <section data-caller="quick">${quick}</section>
        <section data-caller="card"><VariantPrices variant={selectedVariant} showCompareAtPrice={show}
          spacedCurrency compareAtFirst className="font-body text-sm leading-none"
          compareAtPriceClassName="text-(--color-compare-price-text) line-through"/></section>
      </>);
    };
  `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "money-boundary",
      setup(builder) {
        builder.onResolve({ filter: /^@shopify\/hydrogen$/ }, () => ({
          path: "money",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: moneyFixture,
          loader: "tsx",
          resolveDir: root,
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

test("large compare-at prices share Figma typography/color without changing compact prices or locale formatting", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><style>${css}:root{--body-base-size:14px;--color-text:#343231;--color-text-subtle:#524B46;--color-compare-price-text:#999999;}</style><div id="root"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [locale, currency] of [
        ["en-US", "USD"],
        ["fr-FR", "EUR"],
      ]) {
        await page.evaluate((settings) => window.renderPrices(settings), {
          locale,
          currency,
        });
        for (const caller of ["main", "featured", "quick"]) {
          const compare = page
            .locator(
              `[data-caller="${caller}"] .line-through, [data-caller="${caller}"] .strike`,
            )
            .first();
          await expect(compare).toHaveCSS("color", "rgb(153, 153, 153)");
          await expect(compare).toHaveCSS("font-family", /Tenor Sans/);
          await expect(compare).toHaveCSS("font-size", "24px");
          await expect(compare).toHaveCSS("font-weight", "400");
          await expect(compare).toHaveCSS("font-style", "normal");
          await expect(compare).toHaveCSS("line-height", "normal");
          await expect(compare).toHaveCSS(
            "text-decoration-line",
            "line-through",
          );
          const content = (await compare.textContent()).replace(/\s/g, "");
          expect(content).toBe(locale === "en-US" ? "$999" : "999€");
          expect(
            await compare.evaluate(
              (el) => getComputedStyle(el, "::before").content,
            ),
          ).toBe("none");
        }
        const card = page.locator('[data-caller="card"] .line-through');
        await expect(card).toHaveCSS("font-size", "14px");
        await expect(card).toHaveCSS("font-family", /DM Sans/);
      }
    }
    await page.addStyleTag({
      content:
        ":root{--color-compare-price-text:#abcdef;--color-text-subtle:#ff0000;}",
    });
    for (const caller of ["main", "featured", "quick"]) {
      await expect(
        page.locator(`[data-caller="${caller}"] .line-through`),
      ).toHaveCSS("color", "rgb(171, 205, 239)");
    }
    for (const settings of [
      { compare: null },
      { compare: "699" },
      { compare: "500" },
      { show: false },
    ]) {
      await page.evaluate((value) => window.renderPrices(value), settings);
      await expect(page.locator(".line-through,.strike")).toHaveCount(0);
    }
  } finally {
    await browser.close();
  }
});
