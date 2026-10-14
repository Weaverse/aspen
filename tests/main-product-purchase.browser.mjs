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
      import ProductInformation from './app/sections/main-product';
      const root = createRoot(document.getElementById('root'));
      window.renderProduct = ({combined, child, soldOut, locale, discount, showSalePrice = true}) => {
        const variant = {id:'variant-own', product:{handle:'chair'}, selectedOptions:[{name:'Color',value:'Cream'}], availableForSale:!soldOut, quantityAvailable:3, price:{amount:'999',currencyCode:'USD'}};
        if(discount) {variant.compareAtPrice=variant.price; variant.price={amount:'699',currencyCode:'USD'};}
        window.productData={storeDomain:'https://shop.example',locale,product:{id:'product-own',handle:'chair',title:'Chair',tags:combined?['combined']:[],selectedOrFirstAvailableVariant:variant,priceRange:{minVariantPrice:variant.price},media:{nodes:[]},isBundle:null}};
        const value = (name, handle, selected, available) => ({name,handle,selected,available,isDifferentProduct:handle!=='chair',variantUriQuery:'Color='+name,firstSelectableVariant:{...variant,id:'variant-'+handle,product:{handle}}});
        window.productOptions=[{name:'Color',optionValues:[value('Cream','chair',true,!soldOut),...(child?[value('Moss','child-chair',false,!soldOut)]:[])]}];
        root.render(<ProductInformation addToCartText='Add to bag' soldOutText='Sold out' showSalePrice={showSalePrice} showProductStory={false} showProductReviews={false} showProductRating={false} showWishlist={false} mediaLayout='slider'/>);
      };
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
      name: "purchase-fixture",
      setup(builder) {
        const stubs = {
          "@shopify/hydrogen": `import React from 'react'; export const getProductOptions=()=>window.productOptions; export const getAdjacentAndFirstAvailableVariants=()=>[]; export const useOptimisticVariant=v=>v; export const Money=({data,className})=><span className={className}>{data.amount}</span>; export const Image=()=>null; export const ShopPayButton=({variantIdsAndQuantities})=><a href={'/checkout/'+variantIdsAndQuantities[0].id}>Shop Pay</a>;`,
          "@weaverse/hydrogen": `export const useTranslation=()=>({t:key=>key}); export const createSchema=v=>v; export const useThemeSettings=()=>({});`,
          "react-router": `import React from 'react'; export const useLoaderData=()=>window.productData; export const useRouteLoaderData=()=>({selectedLocale:window.productData.locale}); export const useNavigate=()=>to=>{window.navigation=to;}; export const Link=React.forwardRef(({to,viewTransition,...props},ref)=><a href={to} ref={ref} {...props}/>);`,
          "~/hooks/use-translated-text":
            "export const useTranslatedText=()=>value=>value;",
          "~/utils/product":
            "export const isDiscounted=(price,compare)=>Number(compare?.amount)>Number(price?.amount); export const hasOnlyDefaultVariant=()=>false;",
          "~/components/section":
            "import React from 'react'; export const layoutInputs=[]; export const Section=React.forwardRef(({children},ref)=><section ref={ref}>{children}</section>);",
          "~/components/product/add-to-cart-button":
            "import React from 'react'; export const AddToCartButton=({lines,children,disabled,...props})=><button disabled={disabled} onClick={()=>{window.submitted=lines;}}>{children}</button>;",
        };
        const empty = [
          "~/components/loyalty/loyalty-points-hint",
          "~/components/product/back-in-stock-form",
          "~/components/product/badges",
          "~/components/product/bundled-variants",
          "~/components/product/judgeme-review",
          "~/components/product/product-media",
          "~/components/product/variant-prices",
          "~/components/subscriptions/selling-plan-selector",
          "~/components/wishlist/product-wishlist-button",
          "~/sections/judgeme-reviews/review-index",
          "./product-details",
          "./product-story",
        ];
        for (const path of empty) {
          stubs[path] =
            "export const LoyaltyPointsHint=()=>null; export const BackInStockForm=()=>null; export const ProductBadges=()=>null; export const BundledVariants=()=>null; export const ProductRating=()=>null; export const ProductMedia=()=>null; export const VariantPrices=()=>null; export const SellingPlanSelector=()=>null; export const ProductWishlistButton=()=>null; export const ProductDetails=()=>null; export const ProductStory=()=>null; export default ()=>null;";
        }
        builder.onResolve({ filter: /./ }, ({ path }) =>
          path in stubs ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /./, namespace: "fixture" }, ({ path }) => ({
          contents: stubs[path],
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});

test("compare-at price follows theme color and inspected typography on all layouts", async () => {
  const stylesheet = await compile(
    await readFile(`${root}app/styles/app.css`, "utf8"),
    { base: `${root}app/styles`, onDependency: () => undefined },
  );
  const css = stylesheet.build(
    new Scanner({
      sources: [
        { base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false },
      ],
    }).scan(),
  );
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1033, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        `<style>${css}:root {--body-base-size:14px;--color-compare-price-text:#999999;--color-text-subtle:#524B46;}</style><div id='root'></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate((settings) => window.renderProduct(settings), {
        combined: false,
        discount: true,
      });
      const price = page.locator(".line-through");
      await expect(price).toHaveText("999");
      await expect(price).toHaveCSS("color", "rgb(153, 153, 153)");
      await expect(price).toHaveCSS("font-size", "24px");
      await expect(price).toHaveCSS("font-weight", "400");
      await expect(price).toHaveCSS("font-family", /Tenor Sans/);
      await expect(price).toHaveCSS("line-height", "normal");
      await expect(price).toHaveCSS("text-decoration-line", "line-through");
      await page.addStyleTag({
        content: ":root {--color-compare-price-text:#abcdef;}",
      });
      await expect(price).toHaveCSS("color", "rgb(171, 205, 239)");
      await page.evaluate((settings) => window.renderProduct(settings), {
        combined: false,
        discount: true,
        showSalePrice: false,
      });
      await expect(price).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("tagged products with their own variants keep a usable purchase form", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const combined of [true, false]) {
      await page.evaluate((settings) => window.renderProduct(settings), {
        combined,
        child: false,
        soldOut: false,
      });
      await expect(
        page.getByRole("button", { name: "Add to bag", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "product.increaseQuantity", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add to bag", exact: true })
        .click();
      const submitted = await page.evaluate(() => window.submitted);
      expect(submitted[0].merchandiseId).toBe("variant-own");
      expect(submitted[0].quantity).toBeGreaterThan(1);
      await page.evaluate((settings) => window.renderProduct(settings), {
        combined,
        child: false,
        soldOut: true,
      });
      await expect(
        page.getByRole("button", { name: "Sold out", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("link", { name: "Shop Pay", exact: true }),
      ).toHaveCount(0);
    }
  } finally {
    await browser.close();
  }
});

test("real combined parents link to a child instead of adding their own variant", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate((settings) => window.renderProduct(settings), {
      combined: true,
      child: true,
      soldOut: false,
      locale: { language: "FR", country: "FR" },
    });
    await expect(
      page.getByRole("button", { name: "Add to bag", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "product.selectOptions", exact: true }),
    ).toHaveAttribute("href", "/fr-fr/products/child-chair?Color=Moss");
    await page.evaluate((settings) => window.renderProduct(settings), {
      combined: true,
      child: true,
      soldOut: true,
    });
    await expect(
      page.getByRole("link", { name: "product.selectOptions", exact: true }),
    ).toHaveAttribute("href", "/products/child-chair?Color=Moss");
    await expect(
      page.getByRole("link", { name: "Shop Pay", exact: true }),
    ).toHaveCount(0);
  } finally {
    await browser.close();
  }
});
