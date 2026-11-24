import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium, expect } from "@playwright/test";
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {createMemoryRouter, RouterProvider, useLocation, useFetcher} from 'react-router';
      import {AnalyticsEvent} from '@shopify/hydrogen';
      import {CartLibrarySync} from './app/components/cart/cart-library-sync';
      import {PageView, ProductView, CollectionView, SearchView, CartView} from './app/components/root/analytics-views';
      import {CustomAnalytics} from './app/components/root/custom-analytics';
      import {isPrivateWishlistPath} from './app/utils/themivo-script-preview';

      const listeners = new Map();
      window.events = [];
      window.refreshes = 0;
      window.registrations = 0;
      // Observe publications separately from destination delivery. The real
      // consent bus is a transport boundary, not the behavior under test.
      window.Shopify = {analytics: {
        getConfig: () => ({shop: {id: 'shop'}, customData: {}}),
        publish(event, data = {}) {
          const payload = {url: location.href, ...data};
          window.events.push({event, data: payload});
          for (const callback of listeners.get(event) || []) callback(payload, {});
        },
        addDestination({setup}) {
          window.registrations++;
          setup({subscribe(event, callback) {
            const list = listeners.get(event) || [];
            list.push(callback);
            listeners.set(event, list);
            return () => listeners.set(event, list.filter(fn => fn !== callback));
          }});
        },
      }};
      const money = {amount: '10', currencyCode: 'USD'};
      let revision = 0, quantity = 0;
      const cart = () => ({
        id: 'cart', updatedAt: String(++revision), totalQuantity: quantity,
        cost: {totalAmount: money},
        lines: {nodes: quantity ? [{
          id: 'line', quantity, cost: {amountPerQuantity: money},
          merchandise: {
            id: 'variant', title: 'Chair', price: money,
            product: {id: 'product', title: 'Chair', handle: 'chair'},
          },
        }] : []},
      });
      let state = {
        data: cart(), revalidating: false,
        pending: {lines: new Map(), discountCodes: new Map(), note: false, attributes: false},
      };
      const subscribers = new Set();
      window.sdkStore = {
        getState: () => state,
        subscribe(fn) {
          subscribers.add(fn);
          return () => subscribers.delete(fn);
        },
      };
      window.refreshCart = () => {
        window.refreshes++;
        state = {...state, data: window.actionCart};
        for (const fn of subscribers) fn(state);
      };
      window.trackerCount = () => subscribers.size;
      window.cartQuantity = () => state.data.totalQuantity;
      function Fixture() {
        const location = useLocation(), fetcher = useFetcher();
        return <>
          <CartLibrarySync/>
          <PageView/>
          <ProductView products={[{id: 'product', title: 'Chair', price: money}]}/>
          <CollectionView collection={{id: 'collection', handle: 'chairs'}}/>
          <SearchView searchTerm="chair" searchResults={{totalCount: 1}}/>
          <CartView cart={null} ready/>
          {!isPrivateWishlistPath(location.pathname) && <CustomAnalytics/>}
          <output>{location.pathname}</output>
          <fetcher.Form method="post" action="/cart"><button>Add item</button></fetcher.Form>
        </>;
      }
      const router = createMemoryRouter([
        {
          id: 'root', path: '*', element: <Fixture/>,
          // Hold loader revalidation so the confirmed action result is visible
          // in useFetchers, as it is while the real root loader fetches data.
          loader: () => window.actionCart ? new Promise(resolve => {
            window.finishRevalidation = () => {window.actionCart = null; resolve({});};
          }) : {},
        },
        {path: '/cart', action: () => {
          quantity++;
          window.actionCart = cart();
          return {cart: window.actionCart};
        }},
      ], {initialEntries: [location.pathname]});
      window.go = async path => {
        history.pushState(null, '', path);
        await router.navigate(path);
      };
      window.emitAll = () => {
        for (const event of Object.values(AnalyticsEvent)) {
          window.Shopify.analytics.publish(event, {products: [], cart: null});
        }
      };
      window.emitPrivatePage = () => window.Shopify.analytics.publish(
        AnalyticsEvent.PAGE_VIEWED, {url: 'https://aspen.test/wishlist/shared/secret'},
      );
      if (window.disableAnalytics) delete window.Shopify;
      createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "import.meta.env.DEV": "false" },
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "analytics-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /^@shopify\/hydrogen\/react$/ }, () => ({
          path: "sdk-hook",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /^\.\/cart-store$/ }, () => ({
          path: "cart-store",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "js",
          resolveDir: root,
          contents:
            path === "sdk-hook"
              ? `
                import {useEffect} from 'react';
                import {trackCartAnalytics} from '@shopify/hydrogen';
                export function useCartAnalytics() {
                  useEffect(() => trackCartAnalytics(window.sdkStore), []);
                }`
              : `export const useCartActions=()=>({refresh:window.refreshCart});`,
        }));
      },
    },
  ],
});

test("private wishlist suppresses cart/route analytics and persistent GTM callbacks while cart reconciliation continues", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://aspen.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="root"></div>',
      }),
    );
    await page.goto("https://aspen.test/products/chair");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const read = () =>
      page.evaluate(() => ({
        refreshes: window.refreshes,
        quantity: window.cartQuantity(),
        events: window.events.map((e) => e.event),
        gtm: window.dataLayer.filter((e) => e.event).map((e) => e.event),
        registrations: window.registrations,
      }));
    await expect.poll(() => page.evaluate(() => window.trackerCount())).toBe(1);
    await page.getByRole("button", { name: "Add item" }).click();
    await expect.poll(async () => (await read()).refreshes).toBe(1);
    await page.evaluate(() => window.finishRevalidation());
    const initial = await read();
    assert.ok(initial.gtm.includes("add_to_cart"));
    for (const event of [
      "page_viewed",
      "product_viewed",
      "collection_viewed",
      "search_viewed",
      "cart_viewed",
    ]) {
      assert.ok(initial.events.includes(event), `Public ${event} must publish`);
    }
    for (const path of [
      "/wishlist/shared/secret",
      "/fr-fr/wishlist/join/invitation",
      "/wishlist/preview",
      "/es-es/wishlist/shared/secret",
    ]) {
      const beforeNavigation = await read();
      await page.evaluate((p) => window.go(p), path);
      await expect(page.locator("output")).toHaveText(path);
      await expect
        .poll(() => page.evaluate(() => window.trackerCount()))
        .toBe(0);
      const before = await read();
      assert.deepEqual(
        before.events,
        beforeNavigation.events,
        "Private navigation must not publish view events",
      );
      assert.deepEqual(
        before.gtm,
        beforeNavigation.gtm,
        "Private navigation must not reach GTM",
      );
      await page.getByRole("button", { name: "Add item" }).click();
      await expect
        .poll(async () => (await read()).refreshes)
        .toBe(before.refreshes + 1);
      await page.evaluate(() => window.finishRevalidation());
      const privateState = await read();
      assert.equal(
        privateState.quantity,
        before.quantity + 1,
        "Confirmed private cart data still reconciles",
      );
      assert.deepEqual(privateState.events, before.events);
      assert.deepEqual(privateState.gtm, before.gtm);
      await page.evaluate(() => window.emitAll());
      assert.deepEqual(
        (await read()).gtm,
        before.gtm,
        "Persistent destinations must ignore every event while private",
      );
      await page.evaluate(() => window.go("/products/chair"));
      await expect
        .poll(() => page.evaluate(() => window.trackerCount()))
        .toBe(1);
      const publicState = await read();
      await page.evaluate(() => window.emitPrivatePage());
      assert.deepEqual(
        (await read()).gtm,
        publicState.gtm,
        "Delayed private page events must not reach GTM after returning public",
      );
      const restored = await read();
      assert.equal(restored.registrations, 1);
      const count = (e) => e.filter((x) => x === "add_to_cart").length;
      assert.equal(
        count(restored.gtm),
        count(before.gtm),
        "Returning must not replay private cart additions",
      );
      await page.getByRole("button", { name: "Add item" }).click();
      await expect
        .poll(async () => (await read()).refreshes)
        .toBe(privateState.refreshes + 1);
      await page.evaluate(() => window.finishRevalidation());
      assert.equal(
        count((await read()).gtm),
        count(before.gtm) + 1,
        "Public cart tracking resumes once",
      );
    }
    assert.deepEqual(errors, [], "No browser errors");
  } finally {
    await browser.close();
  }
});

test("opening a private wishlist directly leaves the SDK tracker off and still reconciles cart actions", async () => {
  const browser = await chromium.launch();
  try {
    for (const path of [
      "/wishlist/shared/token",
      "/fr-fr/wishlist/join/token",
      "/es-es/wishlist/preview",
    ]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://aspen.test/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: '<div id="root"></div>',
        }),
      );
      await page.goto(`https://aspen.test${path}`);
      // Shopify analytics can be disabled entirely on a private initial load.
      await page.evaluate((disabled) => {
        window.disableAnalytics = disabled;
      }, path.endsWith("/preview"));
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await expect(page.locator("output")).toHaveText(path);
      await page.getByRole("button", { name: "Add item" }).click();
      await expect.poll(() => page.evaluate(() => window.refreshes)).toBe(1);
      await page.evaluate(() => window.finishRevalidation());
      assert.deepEqual(
        await page.evaluate(() => ({
          trackers: window.trackerCount(),
          quantity: window.cartQuantity(),
          events: window.events,
          registrations: window.registrations,
        })),
        { trackers: 0, quantity: 1, events: [], registrations: 0 },
      );
      assert.deepEqual(
        errors,
        [],
        "Private load must not require an analytics subscription",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
