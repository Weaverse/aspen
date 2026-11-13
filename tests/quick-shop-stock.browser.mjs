import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {QuickShop} from './app/components/product/quick-shop';
      import FeaturedProduct from './app/sections/single-product';
      import MainProduct from './app/sections/main-product';
      import {useCartStore} from './app/components/cart/store';
      import {buildOptimisticAddCart} from './app/components/cart/optimistic-cart';
      window.cartStore = useCartStore;
      let cartRevision = 0;
      window.setCartLines = lines => {
        const cart = buildOptimisticAddCart(lines);
        cartRevision += 1;
        useCartStore.setState({
          serverCart: cart ? {...cart,id:'fixture-cart',updatedAt:new Date(1800000000000+cartRevision).toISOString(),isOptimistic:false,lines:{...cart.lines,nodes:cart.lines.nodes.map((line,index)=>({...line,id:'line-'+index,isOptimistic:false}))}} : null,
          pendingAdds:new Map(),pendingLineUpdates:new Map(),lineUpdatesInFlight:new Map(),pendingLineRemovals:new Set(),
        });
      };
      const root = createRoot(document.getElementById('root'));
      window.renderShop = (variants, layout = 'desktop', surface = 'quick') => {
        window.variants = variants;
        window.fixture = {storeDomain:'example.com', product:{title:'Madison Bed',handle:'madison-bed',media:{nodes:[]},selectedOrFirstAvailableVariant:variants[0]}};
        window.selectMainVariant = variant => {
          window.fixture = {...window.fixture, product:{...window.fixture.product, selectedOrFirstAvailableVariant:variant}};
          root.render(<MainProduct addToCartText='Add to cart' showProductStory={false} showProductReviews={false}/>);
        };
        root.render(surface === 'featured' ? <FeaturedProduct loaderData={window.fixture} addToCartText='Add to cart'/> : surface === 'main' ? <MainProduct addToCartText='Add to cart' showProductStory={false} showProductReviews={false}/> : <QuickShop layout={layout} data={window.fixture}/>);
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
      name: "quick-shop-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^~\// }, ({ path }) => {
          if (
            [
              "~/components/product/quantity",
              "~/components/cart/store",
              "~/utils/cn",
              "~/utils/breakpoints",
              "~/components/cart/use-cart-inventory-policy",
              "~/hooks/use-product-quantity",
            ].includes(path)
          ) {
            return;
          }
          return { path, namespace: "fixture" };
        });
        builder.onResolve(
          {
            filter:
              /^(\.\/(variant-prices|combined-listing-target|product-details|product-story|variants)|\.\.\/main-product\/variants|@shopify\/hydrogen|@weaverse\/hydrogen|react-router)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: `
          import React from 'react';
          import {useCartStore,canAddCartLines} from '${root}app/components/cart/store';
          export const useTranslation=()=>({t:(key,vars)=>key==='product.lowStock'?'Only '+vars.count+' items in stock':key});
          export const getAdjacentAndFirstAvailableVariants=()=>window.variants;
          export const getProductOptions=()=>[{}];
          export const mapSelectedProductOptionToObject=()=>({});
          export const useTranslatedThemeSettings=()=>({addToCartText:'Add to cart'});
          export const usePrefixPathWithLocale=path=>path;
          export const useQuickViewScrollbar=()=>{};
          export const useFetcher=()=>({});
          export const useFetchers=()=>[];
          export const CartForm={ACTIONS:{LinesAdd:"LinesAdd",LinesUpdate:"LinesUpdate",LinesRemove:"LinesRemove"}};
          export const useLoaderData=()=>window.fixture;
          export const useOptimisticVariant=v=>v;
          export const createSchema=x=>x;
          export const useTranslatedText=()=>(value)=>value;
          export const sectionBackgroundInputs=()=>[];
          export const layoutInputs=[];
          export const IMAGES_PLACEHOLDERS={};
          export const PRODUCT_QUERY='';
          export const isDiscounted=()=>false;
          export const getCombinedListingTarget=()=>null;
          export const Section=({children})=><section>{children}</section>;
          export const ProductVariants=({onVariantChange})=><div>{window.variants.map(v=><button key={v.id} onClick={()=>onVariantChange ? onVariantChange(v) : window.selectMainVariant(v)}>{v.id}</button>)}</div>;
          export const Button=()=>null, Image=()=>null, SoldOutBadge=()=>null, ProductCompareAtPrice=()=>null, SpacedMoney=()=>null, Money=()=>null, ProductDetails=()=>null, ProductStory=()=>null, ProductRating=()=>null, BundledVariants=()=>null, ProductWishlistButton=()=>null;
          export const QuickShopVariants=({onVariantChange})=><div>{window.variants.map(v=><button key={v.id} onClick={()=>onVariantChange(v.id)}>{v.id}</button>)}</div>;
          export const AddToCartButton=({lines,disabled,children})=>{const allowed=useCartStore(state=>canAddCartLines(state,lines));return <button data-testid="add-to-cart" disabled={disabled || !allowed} onClick={()=>window.added=lines}>{children}</button>};
          export const ShopPayButton=({variantIdsAndQuantities})=><button onClick={()=>window.checkout=variantIdsAndQuantities}>Shop Pay</button>;
          export const Link=({children})=><a>{children}</a>;
          export default Link;
          export const LoyaltyPointsHint=()=>null, BackInStockForm=()=>null, ProductBadges=()=>null, ProductCardRating=()=>null, ProductMedia=()=>null, ProgressBar=()=>null, ScrollArea=()=>null, Skeleton=()=>null, SellingPlanSelector=()=>null, ProductCardWishlistButton=()=>null, VariantPrices=()=>null;
        `,
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});

const variant = (id, quantityAvailable) => ({
  id,
  quantityAvailable,
  availableForSale: true,
  product: { handle: "madison-bed" },
  price: { amount: "899", currencyCode: "USD" },
});

test("Quick Shop caps stock and clamps both purchase payloads after variant changes", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route("**/api/cart-inventory-policy?*", (route) =>
        route.fulfill({
          json: {
            policies: { low: "DENY", high: "DENY", backorder: "CONTINUE" },
          },
        }),
      );
      await page.route("https://fixture.example/", (route) =>
        route.fulfill({
          body: '<div id="root"></div>',
          contentType: "text/html",
        }),
      );
      await page.goto("https://fixture.example/");
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(
        (layout) =>
          window.renderShop(
            [
              {
                id: "low",
                quantityAvailable: 2,
                availableForSale: true,
                price: { amount: "899", currencyCode: "USD" },
              },
              {
                id: "high",
                quantityAvailable: 8,
                availableForSale: true,
                price: { amount: "899", currencyCode: "USD" },
              },
            ],
            layout,
          ),
        width < 768 ? "mobile" : "desktop",
      );
      const plus = page.getByRole("button", {
        name: "product.increaseQuantity",
        exact: true,
      });
      await plus.click();
      await expect(page.locator("output")).toHaveText("2");
      await expect(plus).toBeDisabled();
      await page.getByRole("button", { name: "high", exact: true }).click();
      for (let i = 0; i < 6; i += 1) {
        await plus.click();
      }
      await expect(page.locator("output")).toHaveText("8");
      await page.getByRole("button", { name: "low", exact: true }).click();
      await expect(page.locator("output")).toHaveText("2");
      await page
        .getByRole("button", { name: "Add to cart", exact: true })
        .click();
      await page.getByRole("button", { name: "Shop Pay", exact: true }).click();
      expect(
        await page.evaluate(() => [
          window.added[0].quantity,
          window.checkout[0].quantity,
        ]),
      ).toEqual([2, 2]);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Quick Shop retains the ten-item limit for backorders and unknown stock", async () => {
  const browser = await chromium.launch();
  try {
    for (const stock of [2, 0, null]) {
      const page = await browser.newPage();
      await page.route("https://fixture.example/", (route) =>
        route.fulfill({
          body: '<div id="root"></div>',
          contentType: "text/html",
        }),
      );
      await page.route("**/api/cart-inventory-policy?*", (route) =>
        route.fulfill({ json: { policies: { backorder: "CONTINUE" } } }),
      );
      await page.goto("https://fixture.example/");
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(
        (v) => window.renderShop([v]),
        variant("backorder", stock),
      );
      const plus = page.getByRole("button", {
        name: "product.increaseQuantity",
        exact: true,
      });
      for (let i = 0; i < 9; i += 1) {
        await plus.click();
      }
      await expect(page.locator("output")).toHaveText("10");
      await expect(plus).toBeDisabled();
      await page.evaluate(() =>
        window.setCartLines([
          {
            merchandiseId: "backorder",
            quantity: 7,
            selectedVariant: window.variants[0],
          },
        ]),
      );
      await expect(page.locator("output")).toHaveText("10");
      await expect(page.getByTestId("add-to-cart")).toBeEnabled();
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Quick Shop preserves backorders when inventory policy is unavailable", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("https://fixture.example/", (route) =>
      route.fulfill({
        body: '<div id="root"></div>',
        contentType: "text/html",
      }),
    );
    await page.route("**/api/cart-inventory-policy?*", (route) =>
      route.fulfill({ status: 503, json: { error: "Unavailable" } }),
    );
    await page.goto("https://fixture.example/");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate((v) => window.renderShop([v]), variant("low", 2));
    const plus = page.getByRole("button", {
      name: "product.increaseQuantity",
      exact: true,
    });
    await plus.click();
    await expect(page.locator("output")).toHaveText("2");
    await expect(plus).toBeEnabled();
    await plus.click();
    await expect(page.locator("output")).toHaveText("3");
    await expect(
      page.getByRole("button", { name: "Add to cart", exact: true }),
    ).toBeEnabled();
  } finally {
    await browser.close();
  }
});

for (const surface of ["featured", "main"]) {
  for (const policy of ["DENY", "CONTINUE"]) {
    test(`${surface} respects ${policy} inventory policy in both purchase payloads`, async () => {
      const browser = await chromium.launch();
      try {
        for (const width of [390, 834, 1440]) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
          });
          await page.route("https://fixture.example/", (route) =>
            route.fulfill({
              body: '<div id="root"></div>',
              contentType: "text/html",
            }),
          );
          await page.route("**/api/cart-inventory-policy?*", (route) =>
            route.fulfill({
              json: { policies: { low: policy, high: policy } },
            }),
          );
          await page.goto("https://fixture.example/");
          await page.addScriptTag({ content: bundle.outputFiles[0].text });
          await page.evaluate(
            ({ surface: purchaseSurface, variants }) =>
              window.renderShop(variants, "desktop", purchaseSurface),
            { surface, variants: [variant("high", 8), variant("low", 2)] },
          );
          const plus = page.getByRole("button", {
            name: "product.increaseQuantity",
            exact: true,
          });
          const limit = policy === "DENY" ? 8 : 10;
          for (let i = 1; i < limit; i += 1) {
            await plus.click();
          }
          await expect(page.locator("output")).toHaveText(String(limit));
          await expect(plus).toBeDisabled();
          await page.getByRole("button", { name: "low", exact: true }).click();
          const expected = policy === "DENY" ? 2 : 10;
          await expect(page.locator("output")).toHaveText(String(expected));
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Shop Pay", exact: true })
            .click();
          expect(
            await page.evaluate(() => [
              window.added[0].quantity,
              window.checkout[0].quantity,
            ]),
          ).toEqual([expected, expected]);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    });
  }
}

test("all purchase surfaces preserve sold-out and policy failure behavior", async () => {
  const browser = await chromium.launch();
  try {
    for (const purchaseSurface of ["quick", "featured", "main"]) {
      for (const scenario of [
        { stock: 0, policy: "DENY", soldOut: true },
        { stock: 0, policy: "CONTINUE", soldOut: false },
        { stock: 2, policy: null, soldOut: false },
      ]) {
        const page = await browser.newPage();
        await page.route("https://fixture.example/", (route) =>
          route.fulfill({
            body: '<div id="root"></div>',
            contentType: "text/html",
          }),
        );
        await page.route("**/api/cart-inventory-policy?*", (route) =>
          scenario.policy
            ? route.fulfill({ json: { policies: { low: scenario.policy } } })
            : route.fulfill({ status: 503, json: { error: "Unavailable" } }),
        );
        await page.goto("https://fixture.example/");
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(
          ({ surface, selected }) =>
            window.renderShop([selected], "desktop", surface),
          {
            surface: purchaseSurface,
            selected: variant("low", scenario.stock),
          },
        );
        const add = page.getByTestId("add-to-cart");
        const plus = page.getByRole("button", {
          name: "product.increaseQuantity",
          exact: true,
        });
        if (scenario.soldOut) {
          await expect(page.locator("output")).toHaveText("0");
          await expect(add).toBeDisabled();
          await expect(plus).toBeDisabled();
          await expect(
            page.getByRole("button", { name: "Shop Pay", exact: true }),
          ).toHaveCount(0);
        } else {
          await expect(add).toBeEnabled();
          for (let i = 1; i < 3; i += 1) {
            await plus.click();
          }
          await expect(page.locator("output")).toHaveText("3");
          await add.click();
          await page
            .getByRole("button", { name: "Shop Pay", exact: true })
            .click();
          expect(
            await page.evaluate(() => [
              window.added[0].quantity,
              window.checkout[0].quantity,
            ]),
          ).toEqual([3, 3]);
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("a delayed policy cannot overwrite the newly selected variant and cached reads are reused", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const requests = [];
    let release;
    const delayed = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("https://fixture.example/", (route) =>
      route.fulfill({
        body: '<div id="root"></div>',
        contentType: "text/html",
      }),
    );
    await page.route("**/api/cart-inventory-policy?*", async (route) => {
      const id = new URL(route.request().url()).searchParams.get("id");
      requests.push(id);
      if (id === "low") {
        await delayed;
      }
      await route.fulfill({
        json: { policies: { [id]: id === "low" ? "CONTINUE" : "DENY" } },
      });
    });
    await page.goto("https://fixture.example/");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(
      (variants) => window.renderShop(variants),
      [variant("low", 2), variant("high", 3)],
    );
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
    await expect(page.locator("output")).toHaveText("0");
    await expect(
      page.getByRole("button", { name: "Shop Pay", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "high", exact: true }).click();
    const plus = page.getByRole("button", {
      name: "product.increaseQuantity",
      exact: true,
    });
    await plus.click();
    await plus.click();
    await expect(page.locator("output")).toHaveText("3");
    release();
    await page.getByRole("button", { name: "low", exact: true }).click();
    await expect(plus).toBeEnabled();
    await plus.click();
    await expect(page.locator("output")).toHaveText("4");
    await page.getByRole("button", { name: "high", exact: true }).click();
    await expect(page.locator("output")).toHaveText("3");
    await expect(plus).toBeDisabled();
    expect(requests.sort()).toEqual(["high", "low"]);
  } finally {
    await browser.close();
  }
});

for (const purchaseSurface of ["quick", "featured", "main"]) {
  test(`${purchaseSurface} shows zero after all seven units are reserved and recovers when stock is freed`, async () => {
    const browser = await chromium.launch();
    try {
      for (const width of [390, 834, 1440]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        await page.route("https://fixture.example/", (route) =>
          route.fulfill({
            body: '<div id="root"></div>',
            contentType: "text/html",
          }),
        );
        await page.route("**/api/cart-inventory-policy?*", (route) =>
          route.fulfill({ json: { policies: { low: "DENY" } } }),
        );
        await page.goto("https://fixture.example/");
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(
          ({ surface, selected }) =>
            window.renderShop([selected], "desktop", surface),
          { surface: purchaseSurface, selected: variant("low", 7) },
        );
        const plus = page.getByRole("button", {
          name: "product.increaseQuantity",
          exact: true,
        });
        const minus = page.getByRole("button", {
          name: "product.decreaseQuantity",
          exact: true,
        });
        const output = page.locator("output");
        const add = page.getByTestId("add-to-cart");
        for (let i = 1; i < 7; i += 1) {
          await plus.click();
        }
        await add.click();
        expect(await page.evaluate(() => window.added[0].quantity)).toBe(7);
        await page.evaluate(() =>
          window.setCartLines([
            {
              merchandiseId: "low",
              quantity: 7,
              selectedVariant: window.variants[0],
            },
          ]),
        );
        await expect(output).toHaveText("0");
        await expect(plus).toBeDisabled();
        await expect(minus).toBeDisabled();
        await expect(add).toBeDisabled();
        await expect(
          page.getByRole("button", { name: "Shop Pay", exact: true }),
        ).toHaveCount(0);
        await page.evaluate(() =>
          window.cartStore.getState().stageLineUpdate("line-0", 6),
        );
        await expect(output).toHaveText("0");
        await page.evaluate(() =>
          window.cartStore.getState().stageLineRemoval("line-0"),
        );
        await expect(output).toHaveText("0");
        await page.evaluate(() =>
          window.setCartLines([
            {
              merchandiseId: "low",
              quantity: 2,
              selectedVariant: window.variants[0],
            },
            {
              merchandiseId: "low",
              quantity: 2,
              selectedVariant: window.variants[0],
              sellingPlanId: "subscription",
            },
          ]),
        );
        await expect(output).toHaveText("1");
        await plus.click();
        await plus.click();
        await expect(output).toHaveText("3");
        await expect(plus).toBeDisabled();
        await add.click();
        expect(await page.evaluate(() => window.added[0].quantity)).toBe(3);
        await page.evaluate(() => {
          window.setCartLines([]);
          window.pendingToken = window.cartStore.getState().stagePendingAdd([
            {
              merchandiseId: "low",
              quantity: 7,
              selectedVariant: window.variants[0],
            },
          ]);
        });
        await expect(output).toHaveText("0");
        await expect(add).toBeDisabled();
        await page.evaluate(() =>
          window.cartStore.getState().clearPendingAdd(window.pendingToken),
        );
        await expect(output).toHaveText("1");
        await expect(add).toBeEnabled();
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}

test("failed or unknown product policy lookups preserve confirmed cart policies", async () => {
  const browser = await chromium.launch();
  try {
    for (const knownPolicy of ["DENY", "CONTINUE"]) {
      for (const responseStatus of [200, 503]) {
        for (const surface of ["quick", "featured", "main"]) {
          const page = await browser.newPage();
          await page.route("https://fixture.example/", (route) =>
            route.fulfill({
              body: '<div id="root"></div>',
              contentType: "text/html",
            }),
          );
          let requests = 0;
          await page.route("**/api/cart-inventory-policy?*", (route) => {
            requests += 1;
            return route.fulfill({
              status: responseStatus,
              json: { policies: { low: null } },
            });
          });
          await page.goto("https://fixture.example/");
          await page.addScriptTag({ content: bundle.outputFiles[0].text });
          const lookup = page.waitForResponse((response) =>
            response.url().includes("/api/cart-inventory-policy?"),
          );
          await page.evaluate(
            ({ policy, purchaseSurface, selected }) => {
              window.cartStore.setState({
                inventoryPolicies: new Map([[selected.id, policy]]),
              });
              window.setCartLines([
                {
                  merchandiseId: selected.id,
                  quantity: 7,
                  selectedVariant: selected,
                },
              ]);
              window.renderShop([selected], "desktop", purchaseSurface);
            },
            {
              policy: knownPolicy,
              purchaseSurface: surface,
              selected: variant("low", 7),
            },
          );
          // Wait for the lookup to finish instead of asserting the pending state.
          await (await lookup).finished();
          await expect
            .poll(() =>
              page.evaluate(
                () =>
                  document.querySelector(
                    'button[aria-label="product.increaseQuantity"]',
                  )?.disabled,
              ),
            )
            .toBe(knownPolicy === "DENY");
          await expect.poll(() => requests).toBe(1);
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          expect(
            await page.evaluate(() =>
              window.cartStore.getState().inventoryPolicies.get("low"),
            ),
          ).toBe(knownPolicy);
          if (knownPolicy === "DENY") {
            await expect(page.locator("output")).toHaveText("0");
            await expect(page.getByTestId("add-to-cart")).toBeDisabled();
          } else {
            await expect(page.locator("output")).toHaveText("1");
            await expect(page.getByTestId("add-to-cart")).toBeEnabled();
          }
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
