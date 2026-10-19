import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {ProductVariants} from './app/sections/main-product/variants';
      import {QuickShopOptionValues} from './app/components/product/quick-shop-option-values';
      import {SwatchPreview} from './app/components/product/swatch';
      import {ProductCardOptions} from './app/components/product/product-card-options';
      import {FilterItem} from './app/sections/collection-filters/filter-item';
      const root = createRoot(document.getElementById('root'));
      window.renderSwatches = () => root.render(
        React.createElement(ProductVariants, {
          selectedVariant: {selectedOptions: []},
          productOptions: [{name: 'Color', optionValues: [true, false].map((selected) => ({
            name: selected ? 'Cream' : 'Moss', selected, available: true,
            firstSelectableVariant: {}, swatch: {color: '#E2E2D4'},
          }))}],
        }),
      );
      window.renderPreview = (size, color, image) => root.render(
        <div>{[true,false].map(selected => <SwatchPreview key={String(selected)} size={size} selected={selected} color={color} image={image}/>)}</div>
      );
      window.renderQuick = () => root.render(<QuickShopOptionValues layout="buttons"
        onVariantChange={id => window.selectedId=id}
        option={{name:"Color", optionValues:[true,false].map(selected=>({name:selected?"Cream":"Moss", selected,
          available:selected, firstSelectableVariant:{id:selected?"cream":"moss"}, swatch:{color:"#E2E2D4"}
        }))}}/>);
      window.renderCardAndFilter = () => root.render(<>
        <div id="card"><ProductCardOptions
          product={{handle:"fixture",title:"Fixture", options:[{name:"Color",optionValues:["Cream","Moss"].map(name=>({
            name,swatch:{color:"#E2E2D4"},firstSelectableVariant:{id:name,availableForSale:true}
          }))}]}}
          selectedVariant={{selectedOptions:[{name:"Color",value:"Cream"}]}}
          setSelectedVariant={variant=>window.selectedId=variant.id}/></div>
        <div id="filter"><FilterItem displayAs="swatch" appliedFilters={[]} showFiltersCount={false}
          option={{label:"Cream",count:1,input:JSON.stringify({variantOption:{name:"Color",value:"Cream"}})}}/></div>
      </>);
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
      name: "swatch-fixture",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen":
            "export const useTranslation = () => ({t: (_, value) => value.value});",
          "react-router": `export const useNavigate = () => to => {window.navigation=to};
            export const useLocation = () => ({pathname:"/collections/all"});
            export const useSearchParams = () => [new URLSearchParams()];
            export const useRouteLoaderData = () => ({swatchesConfigs:{colors:[{name:"Cream",value:"#E2E2D4"}],images:[]}});`,
          "~/hooks/use-translated-theme-settings":
            "export const useTranslatedThemeSettings = () => ({pcardShowOptionValues:true,pcardOptionToShow:'Color',pcardMaxOptionValues:5});",
          "~/components/tooltip":
            "import React from 'react'; export const Tooltip=({children})=>React.createElement(React.Fragment,null,children); export const TooltipTrigger=Tooltip; export const TooltipContent=()=>null;",
          "~/components/link":
            "import React from 'react'; export const Link=({children,...props})=>React.createElement('a',props,children);",
          "~/utils/product":
            "export const hasOnlyDefaultVariant = () => false;",
          "@shopify/hydrogen":
            "import React from 'react'; export const Image = ({data,...props}) => React.createElement('img',{...props,src:data?.url});",
        };
        builder.onResolve({ filter: /./ }, ({ path }) =>
          path in stubs ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /./, namespace: "fixture" }, ({ path }) => ({
          resolveDir: root,
          contents: stubs[path],
          loader: "js",
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

test("Main and Featured Product use the same canonical swatch selector", async () => {
  for (const file of ["main-product", "single-product"]) {
    const source = await readFile(
      `${root}app/sections/${file}/index.tsx`,
      "utf8",
    );
    assert.match(source, /<ProductVariants\b/);
    assert.doesNotMatch(source, /productDetailSwatches/);
  }
});

test("product-detail swatches keep Figma dimensions and theme tokens at all widths", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root {--radius-xs: 4px; --color-line: #9D9D9D; --color-line-subtle: #D8D8D8; --color-background: #fff;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderSwatches());
      const selected = page.getByRole("button", { name: "Cream" });
      const unselected = page.getByRole("button", { name: "Moss" });
      await expect(selected).toHaveCSS("border-top-width", "1px");
      await expect(selected).toHaveCSS("border-color", "rgb(157, 157, 157)");
      await expect(unselected).toHaveClass(/border-\[0\.5px\]/);
      await expect(unselected).toHaveCSS("border-color", "rgb(216, 216, 216)");
      for (const button of [selected, unselected]) {
        await expect(button).toHaveCSS("padding", "4px");
        await expect(button).toHaveCSS("border-radius", "4px");
        await expect(button).toHaveCSS("display", "flex");
        await expect(button).toHaveCSS("align-items", "flex-start");
        await expect(button).toHaveCSS("gap", "10px");
        await expect(button).toHaveCSS(
          "background-color",
          "rgb(255, 255, 255)",
        );
        await expect(button.locator("span")).toHaveCSS("width", "20px");
        await expect(button.locator("span")).toHaveCSS("height", "20px");
        await expect(button.locator("span")).toHaveCSS("border-radius", "4px");
        await expect(button.locator("span")).toHaveCSS(
          "border-top-width",
          "0px",
        );
      }
      await page.addStyleTag({
        content: ":root {--radius-xs: 6px; --color-line: #123456;}",
      });
      await expect(selected).toHaveCSS("border-radius", "6px");
      await expect(selected).toHaveCSS("border-color", "rgb(18, 52, 86)");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("both canonical sizes share tokens for color/image/fallback and Quick View preserves availability", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 820, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root {--radius-xs:4px;--color-line:#9D9D9D;--color-line-subtle:#D8D8D8;--color-background:#fff;}</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const size of ["large", "small"]) {
        for (const mode of ["color", "image", "invalid"]) {
          await page.evaluate(
            ({ size: swatchSize, mode: fillMode }) =>
              window.renderPreview(
                swatchSize,
                fillMode === "invalid" ? "not-a-color" : "#E2E2D4",
                fillMode === "image"
                  ? {
                      url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                    }
                  : undefined,
              ),
            { size, mode },
          );
          const frames = page.locator("#root > div > span");
          await expect(frames).toHaveCount(2);
          for (const frame of await frames.all()) {
            await expect(frame).toHaveCSS(
              "padding",
              size === "large" ? "4px" : "2px",
            );
            await expect(frame).toHaveCSS("border-radius", "4px");
            const fill = frame.locator("span,img");
            await expect(fill).toHaveCSS(
              "width",
              size === "large" ? "20px" : "12px",
            );
            await expect(fill).toHaveCSS(
              "height",
              size === "large" ? "20px" : "12px",
            );
            await expect(fill).toHaveCSS("border-radius", "4px");
            if (mode === "invalid") {
              await expect(fill).toHaveCSS(
                "background-color",
                "rgb(216, 216, 216)",
              );
            }
          }
        }
      }
      await page.evaluate(() => window.renderQuick());
      const selected = page.getByRole("button", { name: "Color: Cream" });
      const unavailable = page.getByRole("button", { name: "Color: Moss" });
      await expect(selected).toHaveCSS("border-top-width", "1px");
      await expect(selected.locator("span")).toHaveCSS("width", "20px");
      await expect(unavailable).toBeDisabled();
      await selected.click();
      assert.equal(await page.evaluate(() => window.selectedId), "cream");
      await page.addStyleTag({
        content:
          ":root{--radius-xs:6px;--color-line:#123456;--color-background:#fafafa;}",
      });
      await expect(selected).toHaveCSS("border-radius", "6px");
      await expect(selected).toHaveCSS("border-color", "rgb(18, 52, 86)");
      await expect(selected).toHaveCSS(
        "background-color",
        "rgb(250, 250, 250)",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Product Card and color Filter use canonical small/large styles without changing their actions", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<style>${css}:root{--radius-xs:4px;--color-line:#9D9D9D;--color-line-subtle:#D8D8D8;--color-background:#fff;}</style><div id="root"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => window.renderCardAndFilter());
    const card = page.locator("#card").getByRole("button", { name: "Moss" });
    await expect(card).toHaveCSS("padding", "2px");
    await expect(card.locator("span")).toHaveCSS("width", "12px");
    await card.click();
    assert.equal(await page.evaluate(() => window.selectedId), "Moss");
    const filter = page
      .locator("#filter")
      .getByRole("button", { name: "Cream" });
    await expect(filter).toHaveCSS("padding", "4px");
    await expect(filter.locator("span")).toHaveCSS("width", "20px");
    await filter.click();
    assert.match(
      await page.evaluate(() => window.navigation),
      /filter\.variantOption=/,
    );
  } finally {
    await browser.close();
  }
});
