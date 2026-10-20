import assert from "node:assert/strict";
import test from "node:test";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { loader as articlesLoader } from "~/sections/articles";
import { loader as collectionLoader } from "~/sections/collection-list-dynamic/collection-items";
import { loader as featuredProductsLoader } from "~/sections/featured-products/product-items";
import { loader as hotspotLoader } from "~/sections/hotspots/item";
import { loader as singleProductLoader } from "~/sections/single-product";
import { loader as videoLoader } from "~/sections/videos/video";
import { sectionImage } from "~/utils/section-placeholder";
import { components } from "~/weaverse/components";

const placeholderUrls = new Set<string>(Object.values(IMAGES_PLACEHOLDERS));
const imageFields =
  /^(?:image|imageSrc|src|backgroundImage|mobileBackgroundImage|posterImage|mobilePosterImage|beforeImage1|afterImage2)$/;

function audit(value: unknown, path: string, violations: string[]) {
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const location = `${path}.${key}`;
    if (imageFields.test(key) && child) {
      const url =
        typeof child === "string" ? child : (child as { url?: string }).url;
      if (url && !placeholderUrls.has(url)) {
        violations.push(location);
      }
    }
    if (
      (key === "video" || key === "videoURL" || key === "videoUrl") &&
      child
    ) {
      violations.push(location);
    }
    if (
      key === "icon" &&
      typeof child === "string" &&
      /^https?:/.test(child) &&
      !placeholderUrls.has(child)
    ) {
      violations.push(location);
    }
    if (
      ["product", "collection", "collections", "blogs"].includes(key) &&
      child &&
      (!Array.isArray(child) || child.length)
    ) {
      violations.push(location);
    }
    audit(child, location, violations);
  }
}

test("all registered section presets and media defaults start with official placeholders only", () => {
  const violations: string[] = [];
  for (const { schema } of components) {
    if (!schema) {
      continue;
    }
    audit(schema.presets, schema.type, violations);
    for (const group of schema.settings ?? []) {
      for (const input of group.inputs) {
        if (
          !("name" in input) ||
          typeof input.name !== "string" ||
          !("defaultValue" in input)
        ) {
          continue;
        }
        if (
          ["image", "video"].includes(input.type) ||
          imageFields.test(input.name) ||
          [
            "videoURL",
            "videoUrl",
            "product",
            "collection",
            "collections",
            "blogs",
          ].includes(input.name)
        ) {
          audit(
            { [input.name]: input.defaultValue },
            `${schema.type}.defaults`,
            violations,
          );
        }
      }
    }
  }
  assert.deepEqual(violations, []);
});

test("nested section presets contain no demo contacts or furniture marketing copy", () => {
  const types = [
    "content-information",
    "information--item",
    "featured-products",
    "featured-content-products",
    "slideshow",
    "grid-items",
  ];
  const staleCopy = [
    "support@archercommerce.com",
    "Monday - Friday, 9AM - 5PM ET",
    "1 Business day",
    "Considered materials, enduring construction",
    "TIMELESS BY DESIGN",
    "COMFORT, CONSIDERED",
    "Enduring silhouettes and honest materials",
    "Thoughtful proportions and tactile materials",
    "The finishing touches that bring warmth",
  ];
  for (const type of types) {
    const schema = components.find(
      (component) => component.schema?.type === type,
    )?.schema;
    assert.ok(schema, `Missing registered schema: ${type}`);
    const preset = JSON.stringify(schema.presets);
    for (const copy of staleCopy) {
      assert.ok(!preset.includes(copy), `${type} still seeds: ${copy}`);
    }
  }
});

test("new Single Product sections make no default delivery promise", () => {
  const schema = components.find(
    (component) => component.schema?.type === "single-product",
  )?.schema;
  assert.ok(schema);
  const input = schema.settings
    ?.flatMap((group) => group.inputs)
    .find((field) => "name" in field && field.name === "estimatedDeliveryText");
  assert.ok(input && "defaultValue" in input);
  assert.equal(input.defaultValue, "");
});

test("empty image picker values resolve to official placeholders and selected media is preserved", () => {
  for (const empty of [undefined, null, "", "  ", {}, { url: "" }]) {
    assert.equal(sectionImage(empty).url, IMAGES_PLACEHOLDERS.image);
  }
  const selected = {
    id: "merchant-image",
    url: "https://merchant.example/custom.jpg",
    altText: "Merchant alt",
    width: 1200,
    height: 800,
  };
  assert.deepEqual(sectionImage(selected), selected);
  assert.equal(sectionImage(selected.url).url, selected.url);
  assert.equal(
    sectionImage(null, IMAGES_PLACEHOLDERS.banner_1).url,
    IMAGES_PLACEHOLDERS.banner_1,
  );
});

test("unselected product and collection sections never query real store data", async () => {
  let queries = 0;
  const args = {
    data: {},
    weaverse: {
      storefront: {
        i18n: { country: "US", language: "EN" },
        query: async () => {
          queries += 1;
          throw new Error("Unselected section queried Shopify");
        },
      },
    },
  };
  for (const data of [
    {},
    { product: null, collection: null, blogs: null, collections: [] },
    { product: {}, collection: {}, blogs: {}, collections: [{}] },
    {
      product: { handle: " " },
      collection: { handle: " " },
      blogs: { handle: " " },
    },
  ]) {
    for (const loader of [
      featuredProductsLoader,
      collectionLoader,
      singleProductLoader,
      hotspotLoader,
      videoLoader,
      articlesLoader,
    ]) {
      await loader({ ...args, data } as never);
    }
  }
  assert.equal(queries, 0);
});

test("selected products, collections and blogs still load only the merchant selection", async () => {
  const queries: Record<string, unknown>[] = [];
  const product = { id: "product", handle: "selected-product" };
  const collection = {
    id: "collection",
    handle: "selected-collection",
    products: { nodes: [product] },
  };
  const weaverse = {
    storefront: {
      i18n: { country: "US", language: "EN" },
      query: async (
        _query: string,
        { variables }: { variables: Record<string, unknown> },
      ) => {
        queries.push(variables);
        return {
          product,
          collection,
          nodes: [collection],
          shop: { primaryDomain: { url: "https://merchant.example" } },
          blog: { articles: { nodes: [] } },
        };
      },
    },
  };
  for (const loader of [singleProductLoader, hotspotLoader, videoLoader]) {
    const result = await loader({
      data: { product: { handle: product.handle } },
      weaverse,
    } as never);
    assert.equal(result?.product, product);
    assert.equal(queries.at(-1)?.handle, product.handle);
  }
  const result = await featuredProductsLoader({
    data: { collection: { handle: collection.handle } },
    weaverse,
  } as never);
  assert.equal(result.products[0], product);
  assert.equal(queries.at(-1)?.handle, collection.handle);
  assert.deepEqual(
    await collectionLoader({
      data: { collections: [{ id: "123" }] },
      weaverse,
    } as never),
    [collection],
  );
  assert.deepEqual(queries.at(-1)?.ids, ["gid://shopify/Collection/123"]);
  await articlesLoader({
    data: { blogs: { handle: "selected-blog" } },
    weaverse,
  } as never);
  assert.equal(queries.at(-1)?.blogHandle, "selected-blog");
});
