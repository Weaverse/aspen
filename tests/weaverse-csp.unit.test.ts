import assert from "node:assert/strict";
import test from "node:test";
import { createContentSecurityPolicy } from "@shopify/hydrogen";
import type { AppLoadContext } from "react-router";
import { getWeaverseCsp } from "../app/weaverse/csp";
for (const source of [
  "a,b",
  "a b",
  "https://a,b.com",
  "https://a;b.com",
  "javascript:alert(1)",
  "https://studio.weaverse.io/path?q=a;b",
  "https://studio.weaverse.io",
]) {
  test(`CSP safely handles preview host ${source}`, () => {
    const url = new URL("https://store.example/");
    url.searchParams.set("weaverseHost", source);
    const directives = getWeaverseCsp(new Request(url), {
      env: {},
    } as AppLoadContext);
    assert.doesNotThrow(() => createContentSecurityPolicy({ directives }));
    const ancestors = directives.frameAncestors;
    assert.ok(Array.isArray(ancestors));
    if (source.startsWith("https://studio.weaverse.io")) {
      assert.ok(ancestors.includes("https://studio.weaverse.io"));
    } else {
      assert.equal(ancestors.includes(source), false);
    }
  });
}
