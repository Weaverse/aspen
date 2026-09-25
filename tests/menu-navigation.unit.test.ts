import assert from "node:assert/strict";
import test from "node:test";
import { navigateToMenuItem } from "../app/utils/menu-navigation.ts";

const frFR = { language: "FR", country: "FR" } as const;

test("internal menu destinations preserve the active locale", () => {
  const internal: string[] = [];
  const external: [string, string][] = [];

  navigateToMenuItem(
    { to: "/collections", isExternal: false, target: "_self" },
    frFR,
    {
      navigateInternal: (to) => internal.push(to),
      navigateExternal: (to, target) => external.push([to, target]),
    },
  );

  assert.deepEqual(internal, ["/fr-fr/collections"]);
  assert.deepEqual(external, []);
});

test("external menu destinations keep their absolute URL and Shopify target", () => {
  const internal: string[] = [];
  const external: [string, string][] = [];

  navigateToMenuItem(
    {
      to: "https://weaverse.io/",
      isExternal: true,
      target: "_blank",
    },
    frFR,
    {
      navigateInternal: (to) => internal.push(to),
      navigateExternal: (to, target) => external.push([to, target]),
    },
  );

  assert.deepEqual(internal, []);
  assert.deepEqual(external, [["https://weaverse.io/", "_blank"]]);
});
