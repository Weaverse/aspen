import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
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
      import React from "react";
      import {renderToStaticMarkup} from "react-dom/server";
      import {AddToCartButton} from "./app/components/product/add-to-cart-button";
      export function renderButton(state, props = {}) {
        const {label = "Add to bag", ...buttonProps} = props;
        globalThis.fetcherState = state;
        return renderToStaticMarkup(<AddToCartButton
          lines={[{merchandiseId:"variant",quantity:1}]}
          {...buttonProps}
        >{label}</AddToCartButton>);
      }
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "add-to-cart-loading-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^react-router$|^~\/(hooks\/use-prefix-path-with-locale|components\/cart\/(cart-sync|store)|utils\/(cart-error|const))$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: `
            import React from "react";
            export const CartForm = ({children}) => <form>{children({state:globalThis.fetcherState})}</form>;
            CartForm.ACTIONS = {LinesAdd:"LinesAdd"};
            export const AnalyticsEventName = {};
            export const getClientBrowserParameters = () => ({});
            export const sendShopifyAnalytics = () => {};
            export const useTranslation = () => ({t:key=>key === "cart.adding" ? "Adding…" : key});
            export const useMatches = () => [];
            export const usePrefixPathWithLocale = path => path;
            export const useCartFetcherSync = () => {};
            export const useCartStore = {};
            export const getCartMutationError = () => null;
            export const DEFAULT_LOCALE = {currency:"USD",language:"EN"};
          `,
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
const fixture = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(
  createRequire(import.meta.url),
  fixture,
  fixture.exports,
);
const { renderButton } = fixture.exports;

test("Add to Cart preserves its label as a layout placeholder throughout loading", () => {
  const idle = renderButton("idle");
  assert.match(idle, /<span>Add to bag<\/span>/);
  assert.doesNotMatch(idle, /animate-spin/);

  for (const state of ["submitting", "loading"]) {
    const pending = renderButton(state);
    assert.match(pending, /aria-busy="true"/);
    assert.match(pending, /absolute top-1\/2/);
    assert.match(pending, /animate-spin/);
    assert.match(pending, /<span>Add to bag<\/span>/);
    assert.doesNotMatch(pending, /cart\.adding/);
  }
  assert.equal(renderButton("idle"), idle);
});

test("Explicit overlay callers keep their existing loading behavior", () => {
  assert.equal(
    renderButton("submitting", { loadingStyle: "overlay" }),
    renderButton("submitting"),
  );
});

test("Pending Add to Cart remains named without changing its geometry at each breakpoint", async () => {
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
    const page = await browser.newPage();
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const props = {
        className: "min-h-[54px] w-full whitespace-normal",
        label: "Add to bag",
      };
      const render = (state, overrides = {}) =>
        page.setContent(
          `<!doctype html><style>${css}</style><main style="width:75%;margin:20px auto">${renderButton(state, { ...props, ...overrides })}</main>`,
        );
      await render("idle");
      const before = await page
        .getByRole("button", { name: "Add to bag", exact: true })
        .boundingBox();
      assert.ok(before);
      for (const state of ["submitting", "loading"]) {
        await render(state);
        const button = page.getByRole("button", {
          name: "Adding…",
          exact: true,
        });
        await expect(button).toBeVisible();
        await expect(button).toHaveAttribute("aria-busy", "true");
        await expect(button).toBeDisabled();
        assert.deepEqual(await button.boundingBox(), before);
      }
      await render("idle");
      assert.deepEqual(
        await page
          .getByRole("button", { name: "Add to bag", exact: true })
          .boundingBox(),
        before,
      );

      await render("loading", { "aria-label": "Add this chair" });
      await expect(
        page.getByRole("button", { name: "Add this chair", exact: true }),
      ).toBeVisible();
    }
  } finally {
    await browser.close();
  }
});
