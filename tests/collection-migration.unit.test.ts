import assert from "node:assert/strict";
import test from "node:test";
import type { LoaderFunctionArgs } from "react-router";
import { loader } from "../app/routes/($locale).collections.$collectionHandle";
import { getAppliedFilterLink, getFilterLink } from "../app/utils/filter";

function fixture(search: string, missing = false) {
  const request = new Request(
    "https://store.example/collections/chairs" + search,
  );
  const calls: Array<Record<string, unknown>> = [];
  const collection = {
    id: "gid://shopify/Collection/1",
    handle: "chairs",
    title: "Chairs",
    description: "",
    seo: { title: "Chairs", description: "" },
    image: null,
    products: {
      nodes: [],
      filters: [],
      pageInfo: {
        hasNextPage: search.includes("sale=true"),
        hasPreviousPage: false,
        startCursor: null,
        endCursor: search.includes("sale=true") ? "next-sale-page" : null,
      },
    },
  };
  const args = {
    request,
    params: { collectionHandle: "chairs" },
    context: {
      env: {},
      storefront: {
        i18n: { country: "US", language: "EN", currency: "USD" },
        graphql: async (
          _document: unknown,
          options: { variables: Record<string, unknown> },
        ) => {
          calls.push(options.variables);
          const result = structuredClone(collection);
          if (calls.length > 1) result.products.pageInfo.hasNextPage = false;
          return {
            data: {
              collection: missing ? null : result,
              collections: { nodes: [] },
            },
          };
        },
      },
      weaverse: { loadPage: async () => null },
    },
  } as unknown as LoaderFunctionArgs;
  return { args, calls };
}

test("default and unrecognized collection sorts always supply a valid required sort key", async () => {
  for (const query of ["", "?sort_by=unknown", "?sale=true"]) {
    const f = fixture(query);
    await loader(f.args);
    for (const call of f.calls)
      assert.equal(call.sortKey, "COLLECTION_DEFAULT");
    assert.equal(f.calls.length, query.includes("sale=true") ? 2 : 1);
  }
  const f = fixture("?sort_by=price-descending");
  await loader(f.args);
  assert.equal(f.calls[0].sortKey, "PRICE");
  assert.equal(f.calls[0].reverse, true);
});

test("missing collection clears modern and legacy cursors before the final 404", async () => {
  for (const query of [
    "after=abc",
    "before=abc",
    "cursor=abc&direction=next",
    "after=abc&before=def",
  ]) {
    const f = fixture("?sort_by=best-selling&utm_source=mail&" + query, true);
    await assert.rejects(loader(f.args), (response: unknown) => {
      assert.ok(response instanceof Response);
      assert.equal(response.status, query.startsWith("cursor=") ? 301 : 302);
      const target = new URL(
        response.headers.get("Location"),
        f.args.request.url,
      );
      assert.notEqual(target.toString(), f.args.request.url);
      for (const key of ["after", "before", "cursor", "direction"])
        assert.equal(target.searchParams.has(key), false);
      assert.equal(target.searchParams.get("utm_source"), "mail");
      assert.equal(target.searchParams.get("sort_by"), "best-selling");
      return true;
    });
  }
  const f = fixture("?sort_by=best-selling&utm_source=mail", true);
  await assert.rejects(
    loader(f.args),
    (response: unknown) =>
      response instanceof Response && response.status === 404,
  );
});

test("adding collection facets preserves all selected categories and unrelated URL state", () => {
  const categories = [
    "gid://shopify/TaxonomyCategory/sg-4",
    "gid://shopify/TaxonomyCategory/sg-5",
  ];
  for (const input of [
    { productVendor: "Aspen" },
    { variantOption: { name: "Color", value: "Blue" } },
    { price: { min: 25, max: 100 } },
  ]) {
    const params = new URLSearchParams(
      "filter.v.option.Material=Wood&sort_by=price-ascending&utm_source=mail&after=old",
    );
    for (const id of categories) params.append("filter.p.category", id);
    const next = getFilterLink(input, params, {
      pathname: "/collections/chairs",
    } as Parameters<typeof getFilterLink>[2]);
    const url = new URL(next, "https://store.example");
    assert.deepEqual(url.searchParams.getAll("filter.p.category"), categories);
    assert.equal(url.searchParams.get("filter.v.option.Material"), "Wood");
    assert.deepEqual(url.searchParams.getAll("sort_by"), ["price-ascending"]);
    assert.equal(url.searchParams.get("utm_source"), "mail");
    assert.equal(url.searchParams.has("after"), false);
    assert.equal(params.get("after"), "old");
  }
});

test("category toggles add and remove only the requested category", () => {
  const initial = new URLSearchParams(
    "filter.p.category=one&filter.v.option.Color=Red",
  );
  const location = { pathname: "/collections/chairs" } as Parameters<
    typeof getFilterLink
  >[2];
  const added = new URL(
    getFilterLink({ category: { id: "two" } }, initial, location),
    "https://store.example",
  );
  assert.deepEqual(added.searchParams.getAll("filter.p.category"), [
    "one",
    "two",
  ]);
  const removed = new URL(
    getAppliedFilterLink(
      { filter: { category: { id: "one" } }, label: "One" },
      added.searchParams,
      location,
    ),
    "https://store.example",
  );
  assert.deepEqual(removed.searchParams.getAll("filter.p.category"), ["two"]);
  assert.equal(removed.searchParams.get("filter.v.option.Color"), "Red");
});
