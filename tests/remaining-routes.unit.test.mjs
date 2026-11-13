import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { build } from "esbuild";

// Keep real route/URL/Hydrogen logic; omit presentation imports from loader tests.
const stubs = {
  "~/weaverse": "export const WeaverseContent = () => null;",
  "~/utils/seo.server":
    "export const seoPayload = {page: x => x, root: x => x, collection: x => x};",
  "~/utils/seo-translation": "export const localizedSeoMeta = () => [];",
  "~/hooks/use-predictive-search":
    "export const NO_PREDICTIVE_SEARCH_RESULTS = [];",
};
const bundle = await build({
  stdin: {
    contents: `export {loader as page} from './app/routes/($locale).pages.$pageHandle';
      export {loader as collection} from './app/routes/($locale).collections.$collectionHandle';
      export {loader as allProducts} from './app/routes/($locale).products._index';
      export {loader as contact} from './app/routes/($locale).contact';
      export {loader as sitemap} from './app/routes/($locale).sitemap.$type.$page[.xml]';
      export {loader as discount} from './app/routes/($locale).discount.$code';
      export {loader as account} from './app/routes/($locale).account.$';
      export {loader as login} from './app/routes/($locale).account_.login';
      export {loader as cartAdd} from './app/routes/($locale).cart.add.$variantId';
      export {action as predictiveSearch} from './app/routes/($locale).api.predictive-search';
      export {loadCriticalData} from './app/utils/root.server';
      export {SUPPORTED_LOCALES} from './app/utils/const';`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  define: { "import.meta.env.DEV": "true" },
  plugins: [
    {
      name: "loader-dependencies",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
          if (stubs[args.path]) {
            return { path: args.path, namespace: "stub" };
          }
          if (
            !args.path.startsWith(".") &&
            !args.path.startsWith("/") &&
            !args.path.startsWith("~")
          ) {
            return { path: import.meta.resolve(args.path), external: true };
          }
        });
        b.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({
          contents: stubs[args.path],
        }));
      },
    },
  ],
});
const {
  page,
  collection,
  allProducts,
  contact,
  sitemap,
  discount,
  account,
  login,
  cartAdd,
  predictiveSearch,
  loadCriticalData,
  SUPPORTED_LOCALES,
} = await import(
  `data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`
);

function fixture(path, locale = SUPPORTED_LOCALES[0]) {
  const calls = [];
  const context = {
    localization: {
      selectedLocale: locale,
      availableLocales: [...SUPPORTED_LOCALES],
    },
    env: { PUBLIC_STORE_DOMAIN: "shop.myshopify.com" },
    session: {
      set: (...args) => calls.push(["session", ...args]),
      commit: async () => ({"Set-Cookie": "cartId=cart-1; HttpOnly"}),
    },
    cart: {
      addLines: async (lines) => {
        calls.push(["add", lines]);
        return { cart: { id: "cart-1" } };
      },
      updateDiscountCodes: async (codes) => {
        calls.push(["discount", codes]);
        return { cart: { id: "cart-1" } };
      },
    },
    customerAccount: {
      handleAuthStatus: async () => {
        calls.push(["auth"]);
      },
      login: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://accounts.shopify.com/authorize" },
        }),
    },
    weaverse: {
      loadPage: async (options) => {
        calls.push(["cms", options]);
        return {};
      },
      loadThemeSettings: async () => ({ theme: {} }),
    },
    storefront: {
      i18n: { language: locale.language, country: locale.country },
      CacheLong: () => ({}),
      query: async () => {
        throw new Error("Unexpected Shopify query");
      },
    },
  };
  context.storefront.graphql = async (...args) => ({
    data: await context.storefront.query(args[0], {
      ...args[1],
      variables: {
        country: locale.country,
        language: locale.language,
        ...args[1]?.variables,
      },
    }),
    headers: new Headers(),
  });
  context.weaverse.storefront = context.storefront;
  return {
    request: new Request(`https://shop.example${path}`),
    params: {},
    context,
    calls,
  };
}

async function thrownRedirect(loader, args, expected) {
  await assert.rejects(
    () => loader(args),
    (error) => {
      assert.equal(error.status, 301);
      assert.equal(error.headers.get("Location"), expected);
      return true;
    },
  );
}

for (const locale of SUPPORTED_LOCALES) {
  const prefix = locale.pathPrefix;
  test(`${locale.language}: filtered/sorted all-products URLs keep the real collection query`, async () => {
    const controls = [
      [
        "sort=price-high-low&filter.productVendor=%22Acme%22",
        [{ productVendor: "Acme" }],
        "PRICE",
        true,
      ],
      ["sort=price-high-low", [], "PRICE", true],
      [
        "filter.productVendor=%22Acme%22",
        [{ productVendor: "Acme" }],
        "COLLECTION_DEFAULT",
        false,
      ],
      [
        "sort=price-low-high&filter.productVendor=%22Acme%22&filter.available=true",
        [{ productVendor: "Acme" }, { available: true }],
        "PRICE",
        false,
      ],
    ];
    for (const suffix of ["", ".data"]) {
      for (const [search, filters, sortKey, reverse] of controls) {
        const args = fixture(
          `${prefix}/collections/all${suffix}?${search}`,
          locale,
        );
        args.params.collectionHandle = "all";
        const queries = [];
        args.context.storefront.query = async (_query, { variables }) => {
          queries.push(variables);
          return {
            collection: {
              id: "all",
              title: "All",
              handle: "all",
              products: { nodes: [], filters: [] },
            },
            collections: { edges: [] },
          };
        };
        const result = await collectionFollowingLegacyRedirects(args);
        assert.equal(result.collection.handle, "all");
        assert.equal(queries.length, 1);
        assert.equal(queries[0].handle, "all");
        assert.deepEqual(queries[0].filters.map(x => JSON.stringify(x)).sort(), filters.map(x => JSON.stringify(x)).sort());
        assert.equal(queries[0].sortKey, sortKey);
        assert.equal(queries[0].reverse, reverse);
        assert.equal(queries[0].country, locale.country);
        assert.deepEqual(args.calls, [
          ["cms", { type: "COLLECTION", handle: "all" }],
        ]);
      }
    }
  });

  test(`${locale.language}: unfiltered alias redirect reaches the real all-products loader`, async () => {
    const args = fixture(`${prefix}/collections/all?utm_source=footer`, locale);
    args.params.collectionHandle = "all";
    let redirectResponse;
    try {
      await collection(args);
    } catch (response) {
      redirectResponse = response;
    }
    assert.equal(redirectResponse.status, 301);
    const destination = new URL(
      redirectResponse.headers.get("Location"),
      args.request.url,
    );
    assert.equal(destination.pathname, `${prefix}/products`);
    assert.equal(destination.searchParams.get("utm_source"), "footer");
    const queries = [];
    args.context.storefront.query = async (query, { variables }) => {
      queries.push({ query, variables });
      return {
        products: {
          nodes: [],
          edges: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      };
    };
    const result = await allProducts({
      ...args,
      request: new Request(destination),
      params: {},
    });
    assert.deepEqual(result.products.nodes, []);
    assert.equal(queries.length, 1);
    assert.match(queries[0].query, /query allProducts\(/);
    assert.equal(queries[0].variables.country, locale.country);
    assert.equal(queries[0].variables.language, locale.language);
    assert.equal(queries[0].variables.handle, undefined);
    assert.deepEqual(args.calls, [["cms", { type: "ALL_PRODUCTS" }]]);
  });

  test(`${locale.language}: Shopify contact and catalog aliases preserve query and locale`, async () => {
    const args = fixture(`${prefix}/pages/contact?from=footer`, locale);
    args.params.pageHandle = "contact";
    await thrownRedirect(page, args, `${prefix}/contact?from=footer`);
    const catalog = fixture(
      `${prefix}/collections/all?utm_source=footer`,
      locale,
    );
    catalog.params.collectionHandle = "all";
    await thrownRedirect(
      collection,
      catalog,
      `${prefix}/products?utm_source=footer`,
    );
    assert.deepEqual(args.calls, []);
    assert.deepEqual(catalog.calls, []);
  });

  test(`${locale.language}: client navigation to Shopify aliases redirects to document URLs`, async () => {
    for (const suffix of [".data", "/.data"]) {
      const args = fixture(
        `${prefix}/pages/contact${suffix}?from=footer`,
        locale,
      );
      args.params.pageHandle = "contact";
      await thrownRedirect(page, args, `${prefix}/contact?from=footer`);
      const catalog = fixture(
        `${prefix}/collections/all${suffix}?utm_source=footer`,
        locale,
      );
      catalog.params.collectionHandle = "all";
      await thrownRedirect(
        collection,
        catalog,
        `${prefix}/products?utm_source=footer`,
      );
    }
  });

  test(`${locale.language}: account/cart redirects retain the active locale and cart cookie`, async () => {
    const args = fixture(`${prefix}/account/unknown`, locale);
    const auth = await account(args);
    assert.equal(auth.headers.get("Location"), `${prefix}/account`);
    assert.deepEqual(args.calls, [["auth"]]);
    args.params.variantId = "123";
    const cart = await cartAdd(args);
    assert.equal(cart.init.status, 303);
    assert.equal(cart.init.headers.get("Location"), `${prefix}/cart`);
    assert.match(cart.init.headers.get("Set-Cookie"), /cartId=cart-1/);
    assert.deepEqual(args.calls[1], [
      "add",
      [{ merchandiseId: "gid://shopify/ProductVariant/123", quantity: 1 }],
    ]);
  });

  test(`${locale.language}: discount keeps destination query, tracking, hash and cookie`, async () => {
    const target = "/search?q=chair&filter=one&filter=two#results";
    const args = fixture(
      `${prefix}/discount/TEST?redirect=${encodeURIComponent(target)}&utm_source=email`,
      locale,
    );
    args.params.code = "TEST";
    const response = await discount(args);
    assert.equal(response.status, 303);
    const destination = new URL(
      response.headers.get("Location"),
      args.request.url,
    );
    assert.equal(destination.pathname, `${prefix}/search`);
    assert.equal(destination.searchParams.get("q"), "chair");
    assert.deepEqual(destination.searchParams.getAll("filter"), ["one", "two"]);
    assert.equal(destination.searchParams.get("utm_source"), "email");
    assert.equal(destination.searchParams.has("redirect"), false);
    assert.equal(destination.hash, "#results");
    assert.match(response.headers.get("Set-Cookie"), /cartId=cart-1/);
    assert.deepEqual(args.calls[0], ["discount", ["TEST"]]);
    const home = await discount({
      ...args,
      request: new Request(`https://shop.example${prefix}/discount/TEST`),
    });
    assert.equal(home.headers.get("Location"), prefix || "/");
  });
}

test("primary contact route and unrelated Shopify pages still load their selected content", async () => {
  for (const [path, handle, loader] of [
    ["/contact", "contact", contact],
    ["/pages/about", "about", page],
  ]) {
    const args = fixture(path);
    args.params.pageHandle = handle;
    args.context.storefront.query = async (_query, options) => {
      assert.equal(options.variables.handle, handle);
      return { page: { id: "page-1", handle } };
    };
    const result = await loader(args);
    assert.equal(result.page.handle, handle);
    assert.deepEqual(args.calls, [["cms", { type: "PAGE", handle }]]);
  }
});

test("normal collection handles still request collection content", async () => {
  const args = fixture("/collections/chairs");
  args.params.collectionHandle = "chairs";
  args.context.storefront.query = async (_query, options) => {
    assert.equal(options.variables.handle, "chairs");
    return { collection: null };
  };
  await assert.rejects(
    () => collection(args),
    (error) => error.status === 404,
  );
  assert.deepEqual(args.calls, [
    ["cms", { type: "COLLECTION", handle: "chairs" }],
  ]);
});

test("predictive search links contact directly to Aspen's primary URL with tracking", async () => {
  const args = fixture("/fr-fr/api/predictive-search", SUPPORTED_LOCALES[1]);
  args.params.locale = "fr-fr";
  args.request = new Request(args.request.url, {
    method: "POST",
    body: new URLSearchParams({ q: "contact" }),
  });
  args.context.storefront.query = async () => ({
    predictiveSearch: {
      queries: [],
      products: [],
      collections: [],
      articles: [],
      pages: ["contact", "about"].map((handle) => ({
        __typename: "Page",
        id: handle,
        title: handle,
        handle,
        trackingParameters: "source=search",
      })),
    },
  });
  const response = await predictiveSearch(args);
  assert.deepEqual(
    response.data.searchResults.results
      .find((group) => group.type === "pages")
      .items.map((item) => item.url),
    ["/fr-fr/contact?source=search", "/fr-fr/pages/about?source=search"],
  );
});

test("menu parsing preserves nested HTTP destinations, locale, query/hash and external URLs", async () => {
  const items = [
    {
      type: "HTTP",
      url: "https://shop.example/collections/chairs?sort=price#grid",
    },
    {
      type: "HTTP",
      url: "https://shop.myshopify.com/fr-fr/products/lily?Color=Blue#details",
    },
    { type: "SEARCH", url: "https://shop.example/search?q=chair" },
    {
      type: "HTTP",
      url: "https://shop.example/pages/contact?source=menu#form",
    },
    {
      type: "COLLECTION",
      url: "https://shop.example/collections/all?sort=price",
    },
    {
      type: "PAGE",
      url: "https://shop.example/fr-fr/pages/contact?source=menu",
    },
    { type: "PRODUCT", url: "https://shop.example/products/lily?Color=Blue" },
    {
      type: "CATALOG",
      url: "https://shop.example/collections/all?sort=price-high-low&filter.productVendor=%22Acme%22",
    },
    {
      type: "BLOG",
      url: "https://shop.example/fr-fr/blogs/news?blog=wrong&utm_source=menu#latest",
    },
    {
      type: "ARTICLE",
      url: "https://shop.example/fr-fr/blogs/journal/same?blog=wrong&utm_source=menu#story",
    },
    {
      type: "HTTP",
      url: "https://shop.example/fr-fr/blogs/same?blog=news&utm_source=menu#story",
    },
    { type: "HTTP", url: "https://other.example/products/chair?q=red#top" },
  ].map((item, index) => ({ ...item, id: String(index), items: [] }));
  const args = fixture("/");
  const menu = {
    id: "menu",
    items: [{ ...items[0], items: [items[1]] }, ...items.slice(1)],
  };
  args.context.storefront.query = async () => ({
    shop: {
      id: "gid://shopify/Shop/1",
      primaryDomain: { url: "https://shop.example" },
    },
    localization: {
      language: { isoCode: "EN" },
      country: { currency: { isoCode: "USD" } },
    },
    headerMenu: menu,
    footerMenu: menu,
  });
  const { layout, shop } = await loadCriticalData(args);
  await shop;
  const expected = [
    "/collections/chairs?sort=price#grid",
    "/fr-fr/products/lily?Color=Blue#details",
    "/search?q=chair",
    "/contact?source=menu#form",
    "/collections/all?sort=price",
    "/fr-fr/contact?source=menu",
    "/products/lily?Color=Blue",
    "/collections/all?sort=price-high-low&filter.productVendor=%22Acme%22",
    "/fr-fr/blogs?blog=news&utm_source=menu#latest",
    "/fr-fr/blogs/same?blog=journal&utm_source=menu#story",
    "/fr-fr/blogs/same?blog=news&utm_source=menu#story",
    "https://other.example/products/chair?q=red#top",
  ];
  for (const parsed of [layout.headerMenu, layout.footerMenu]) {
    assert.deepEqual(
      parsed.items.map((item) => item.to),
      expected,
    );
    assert.equal(parsed.items[0].items[0].to, expected[1]);
    assert.equal(parsed.items.at(-1).isExternal, true);
    assert.equal(parsed.items.at(-1).target, "_blank");
  }
});

test("internal menu URLs with repeated leading slashes cannot change browser origin", async () => {
  const cases = [
    [
      "https://shop.example//example.org/products/chair?color=blue#details",
      "/example.org/products/chair?color=blue#details",
    ],
    [
      "https://shop.example///collections/chairs?sort=price#grid",
      "/collections/chairs?sort=price#grid",
    ],
    [
      "https://shop.myshopify.com//collections/all?sort=price",
      "/collections/all?sort=price",
    ],
    [
      "https://shop.example//pages/contact?source=menu#form",
      "/contact?source=menu#form",
    ],
    [
      "https://shop.example//fr-fr/products/chair?q=blue#image",
      "/fr-fr/products/chair?q=blue#image",
    ],
    ["https://shop.example//es-es/pages/contact", "/es-es/contact"],
  ];
  const menu = {
    id: "menu",
    items: cases.map(([url], index) => ({
      id: String(index),
      type: "HTTP",
      url,
      items: [],
    })),
  };
  // Exercise recursive parsing as well as the top-level header/footer links.
  menu.items[0].items.push({ ...menu.items[1], items: [] });
  menu.items.push({
    id: "external",
    type: "HTTP",
    url: "https://other.example//products/chair?q=red#top",
    items: [],
  });
  const args = fixture("/");
  args.context.storefront.query = async () => ({
    shop: {
      id: "gid://shopify/Shop/1",
      primaryDomain: { url: "https://shop.example" },
    },
    localization: {
      language: { isoCode: "EN" },
      country: { currency: { isoCode: "USD" } },
    },
    headerMenu: menu,
    footerMenu: menu,
  });
  const { layout, shop } = await loadCriticalData(args);
  await shop;
  for (const parsed of [layout.headerMenu, layout.footerMenu]) {
    for (const [index, [, expected]] of cases.entries()) {
      const item = parsed.items[index];
      assert.equal(item.to, expected);
      assert.equal(item.isExternal, false);
      const destination = new URL(item.to, "https://shop.example");
      assert.equal(destination.origin, "https://shop.example");
      assert.equal(
        destination.pathname + destination.search + destination.hash,
        expected,
      );
    }
    assert.equal(parsed.items[0].items[0].to, cases[1][1]);
    const external = parsed.items.at(-1);
    assert.equal(
      external.to,
      "https://other.example//products/chair?q=red#top",
    );
    assert.equal(external.isExternal, true);
    assert.equal(external.target, "_blank");
  }
});

test("real Hydrogen sitemap advertises only published locales and primary contact URLs", async () => {
  const args = fixture("/sitemap/pages/1.xml");
  args.params = { type: "pages", page: "1" };
  args.context.localization.availableLocales = [
    SUPPORTED_LOCALES[0],
    SUPPORTED_LOCALES[1],
  ];
  args.context.storefront.query = async () => ({
    sitemap: {
      resources: {
        items: [
          { handle: "contact", updatedAt: "2026-11-01" },
          { handle: "about", updatedAt: "2026-11-01" },
        ],
      },
    },
  });
  const xml = await (await sitemap(args)).text();
  assert.match(xml, /<loc>https:\/\/shop.example\/contact<\/loc>/);
  assert.match(xml, /href="https:\/\/shop.example\/fr-fr\/contact"/);
  assert.match(xml, /href="https:\/\/shop.example\/fr-fr\/pages\/about"/);
  assert.doesNotMatch(xml, /pages\/contact|EN-CA|FR-CA|es-es|\/en-us\//);
  assert.match(xml, /hreflang="EN-US" href="https:\/\/shop.example\/contact"/);
});

test("product sitemap locale alternatives retain their full product paths", async () => {
  const args = fixture("/sitemap/products/1.xml");
  args.params = { type: "products", page: "1" };
  args.context.storefront.query = async () => ({
    sitemap: {
      resources: { items: [{ handle: "chair", updatedAt: "2026-11-01" }] },
    },
  });
  const xml = await (await sitemap(args)).text();
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(
      xml.includes(
        `href="https://shop.example${locale.pathPrefix}/products/chair"`,
      ),
    );
  }
  assert.doesNotMatch(xml, /EN-CA|FR-CA|\/EN-US\//);
});

test("discount redirects reject external/normalized external targets and keep localized fallback", async () => {
  for (const target of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/x/..//evil.example",
    "javascript:alert(1)",
    "https:evil.example",
  ]) {
    const args = fixture(
      `/fr-fr/discount/TEST?redirect=${encodeURIComponent(target)}`,
      SUPPORTED_LOCALES[1],
    );
    const response = await discount(args);
    assert.equal(response.headers.get("Location"), "/fr-fr");
    assert.deepEqual(args.calls, []);
  }
});

test("discount return_to preserves an explicit destination locale and canonicalizes aliases", async () => {
  for (const [target, expected] of [
    ["/es-es/products?Color=Blue#image", "/es-es/products?Color=Blue#image"],
    ["/collections/all?sort=price", "/fr-fr/collections/all?sort=price"],
    ["/collections/all", "/fr-fr/products"],
    ["/pages/contact", "/fr-fr/contact"],
  ]) {
    const args = fixture(
      `/fr-fr/discount/TEST?return_to=${encodeURIComponent(target)}`,
      SUPPORTED_LOCALES[1],
    );
    const response = await discount(args);
    assert.equal(response.headers.get("Location"), expected);
  }
});

test("discount tracking query cannot bypass collection filter/sort preservation", async () => {
  const args = fixture(
    "/fr-fr/discount/TEST?return_to=%2Fcollections%2Fall&sort=price-high-low&filter.productVendor=%22Acme%22",
    SUPPORTED_LOCALES[1],
  );
  const response = await discount(args);
  const destination = new URL(
    response.headers.get("Location"),
    args.request.url,
  );
  assert.equal(destination.pathname, "/fr-fr/collections/all");
  const queries = [];
  args.context.storefront.query = async (_query, { variables }) => {
    queries.push(variables);
    return {
      collection: { handle: "all", products: { nodes: [], filters: [] } },
      collections: { edges: [] },
    };
  };
  await collectionFollowingLegacyRedirects({
    ...args,
    request: new Request(destination),
    params: { collectionHandle: "all" },
  });
  assert.deepEqual(queries[0].filters, [{ productVendor: "Acme" }]);
  assert.equal(queries[0].sortKey, "PRICE");
  assert.equal(queries[0].reverse, true);
});

test("login preview fallback retains locale; production login reaches the SDK handler", async () => {
  const args = fixture("/fr-fr/account/login", SUPPORTED_LOCALES[1]);
  args.request = new Request("http://localhost:3456/fr-fr/account/login");
  assert.equal((await login(args)).headers.get("Location"), "/fr-fr/account");
  args.request = new Request("https://shop.example/fr-fr/account/login");
  assert.equal(
    (await login(args)).headers.get("Location"),
    "/account/login?return_to=%2Ffr-fr%2Faccount&locale=fr",
  );
});

test("section presets use the primary all-products route", () => {
  for (const file of [
    "hero-image.tsx",
    "hero-video.tsx",
    "countdown/index.tsx",
    "highlights/index.tsx",
    "highlights/badge.tsx",
  ]) {
    const source = readFileSync(
      new URL(`../app/sections/${file}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /["']\/collections\/all["']/);
  }
});

test("blog sitemap preserves merchant blog identity with published locale prefixes", async () => {
  const args = fixture("/sitemap/blogs/1.xml");
  args.params = { type: "blogs", page: "1" };
  args.context.localization.availableLocales = SUPPORTED_LOCALES.slice(0, 2);
  args.context.storefront.query = async () => ({
    sitemap: {
      resources: { items: [{ handle: "journal", updatedAt: "2026-11-01" }] },
    },
  });
  const xml = await (await sitemap(args)).text();
  assert.ok(xml.includes("<loc>https://shop.example/blogs?blog=journal</loc>"));
  assert.ok(
    xml.includes('href="https://shop.example/fr-fr/blogs?blog=journal"'),
  );
  assert.doesNotMatch(xml, /FR-CA|EN-CA|es-es|\/en-us\//);
});

async function collectionFollowingLegacyRedirects(args) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await collection(args);
    } catch (response) {
      if (!(response instanceof Response) || response.status !== 301) {
        throw response;
      }
      const destination = new URL(
        response.headers.get("Location"),
        args.request.url,
      );
      assert.equal(
        destination.pathname.replace(/\.data$/, ""),
        args.request.url.includes("/fr-fr/")
          ? "/fr-fr/collections/all"
          : args.request.url.includes("/es-es/")
            ? "/es-es/collections/all"
            : "/collections/all",
      );
      args = { ...args, request: new Request(destination) };
    }
  }
  throw new Error("Collection redirect loop");
}
