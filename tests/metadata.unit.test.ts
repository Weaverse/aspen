import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalizedSeoConfig,
  getLocalizedMeta,
  getMetadataCopy,
} from "../app/utils/metadata.ts";

test("returns localized static metadata for every supported storefront language", () => {
  assert.equal(getMetadataCopy("en-us", "home").title, "Home");
  assert.equal(
    getMetadataCopy("/fr-fr/products", "products").title,
    "Tous les produits",
  );
  assert.equal(
    getMetadataCopy("/es-es/blogs", "collections").title,
    "Colecciones",
  );
});

test("falls back to English metadata for an unknown locale", () => {
  assert.equal(getMetadataCopy("de-de", "cart").title, "Cart");
});

test("preserves translated Shopify titles and uses Aspen as the suffix outside the navbar", () => {
  const seo = createLocalizedSeoConfig({
    locale: "es-es",
    page: "collection",
    seo: { title: "Sofás", description: "Asientos cómodos" },
  });

  assert.equal(seo.title, "Sofás");
  assert.equal(seo.titleTemplate, "%s | Aspen");
  assert.equal(seo.description, "Asientos cómodos");
});

test("uses Aspen first for localized navbar landing pages", () => {
  const seo = createLocalizedSeoConfig({
    locale: "es-es",
    page: "collections",
    seo: { title: "Collections", description: "Shopify description" },
  });

  assert.equal(seo.title, "Colecciones");
  assert.equal(seo.titleTemplate, "Aspen | %s");
  assert.equal(seo.description, "Shopify description");
});

test("uses the translated navbar label instead of the page heading", () => {
  const seo = createLocalizedSeoConfig({
    locale: "es-es",
    page: "products",
  });

  assert.equal(seo.title, "Productos");
  assert.equal(seo.titleTemplate, "Aspen | %s");
});

test("uses only Aspen on the homepage", () => {
  const seo = createLocalizedSeoConfig({ locale: "fr-fr", page: "home" });

  assert.equal(seo.title, "Aspen");
  assert.equal(seo.titleTemplate, undefined);
});

test("supplies localized title and description fallbacks when Shopify SEO is empty", () => {
  const seo = createLocalizedSeoConfig({
    locale: "fr-fr",
    page: "search",
    seo: { title: "", description: "" },
  });

  assert.equal(seo.title, "Recherche");
  assert.equal(seo.titleTemplate, "%s | Aspen");
  assert.match(String(seo.description), /Recherchez/);
});

test("keeps a localized title descriptor while route loader data is unavailable", () => {
  const descriptors = getLocalizedMeta({ locale: "es-es", page: "blogs" });
  const title = descriptors.find((descriptor) => "title" in descriptor);

  assert.deepEqual(title, { title: "Aspen | Blog" });
});

test("does not repeat the translated navbar label in the rendered title", () => {
  const expectedTitles = {
    collections: "Aspen | Colecciones",
    policies: "Aspen | Políticas",
  } as const;

  for (const page of Object.keys(expectedTitles) as Array<
    keyof typeof expectedTitles
  >) {
    const descriptors = getLocalizedMeta({ locale: "es-es", page });
    const title = descriptors.find((descriptor) => "title" in descriptor);

    assert.deepEqual(title, { title: expectedTitles[page] });
  }
});
