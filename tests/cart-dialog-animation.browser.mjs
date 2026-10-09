import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
// Keep the nested Radix dialogs, both animation components and the real forms.
const bundle = await build({
  stdin: {
    contents: `
      import React, {StrictMode, useState} from "react";
      import {createRoot} from "react-dom/client";
      import * as Dialog from "@radix-ui/react-dialog";
      import {AnimatedDrawer} from "./app/components/animate-drawer";
      import {NoteDialog, DiscountDialog, GiftCardDialog} from "./app/components/cart/cart-summary-actions";
      window.fetcherUnmounts = 0;
      window.submissions = [];
      function Action({name, Component, layout}) {
        const [open, setOpen] = useState(false);
        return <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>{name}</Dialog.Trigger>
          <Component open={open} onClose={() => setOpen(false)} layout={layout} cartNote="Existing note" discountCodes={[{code:"WELCOME", applicable:true}]} />
        </Dialog.Root>;
      }
      function Actions({layout}) {
        return <><Action name="Note" Component={NoteDialog} layout={layout}/><Action name="Discount" Component={DiscountDialog} layout={layout}/><Action name="Gift card" Component={GiftCardDialog} layout={layout}/></>;
      }
      function Fixture({layout}) {
        const [open, setOpen] = useState(true);
        if (layout === "page") return <Actions layout={layout}/>;
        return <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>Open cart</Dialog.Trigger>
          <AnimatedDrawer open={open} flush>
            <div className="flex h-full flex-col p-5">
              <Dialog.Title>Cart</Dialog.Title>
              <div id="cart-lines" className="min-h-0 flex-1 overflow-y-auto">
                {Array.from({length:30}, (_, index) => <p key={index} className="py-8">Product {index + 1}</p>)}
              </div>
              <p id="subtotal">Subtotal: $100</p>
              <Actions layout={layout}/>
            </div>
          </AnimatedDrawer>
        </Dialog.Root>;
      }
      window.start = (layout = "drawer") => createRoot(document.getElementById("root")).render(<StrictMode><Fixture layout={layout}/></StrictMode>);
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
      name: "cart-dialog-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@shopify\/hydrogen$|^@weaverse\/hydrogen$|^react-router$|^~\/hooks\/use-prefix-path-with-locale$|^\.\/cart-sync$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "@shopify/hydrogen") {
            contents = `export const CartForm = {INPUT_NAME:"cartFormInput", ACTIONS:{NoteUpdate:"NoteUpdate", DiscountCodesUpdate:"DiscountCodesUpdate", GiftCardCodesAdd:"GiftCardCodesAdd"}};`;
          } else if (path === "@weaverse/hydrogen") {
            contents = `export const useTranslation = () => ({t:(key) => key});`;
          } else if (path === "react-router") {
            contents = `import {useEffect, useState} from "react";
              export function useFetcher() {
                const [state, setState] = useState("idle");
                const [data, setData] = useState();
                useEffect(() => () => {window.fetcherUnmounts += 1;}, []);
                return {state, data, submit(payload, options) {
                  window.submissions.push({payload:JSON.parse(payload.cartFormInput), options});
                  setState("submitting");
                  window.finishSubmission = (response) => {setData(response); setState("idle");};
                }};
              }`;
          } else if (path.includes("use-prefix-path-with-locale")) {
            contents = `export const usePrefixPathWithLocale = (path) => "/en" + path;`;
          } else {
            contents = `export const useCartFetcherSync = () => {};`;
          }
          return { contents, loader: "tsx", resolveDir: root };
        });
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

async function createPage(browser, width, layout = "drawer") {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    `<style>${css}:root{--page-padding:20px}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate((value) => window.start(value), layout);
  await expect(
    page.getByRole("button", { name: "Note", exact: true }),
  ).toBeVisible();
  if (layout === "drawer") {
    await page.waitForFunction(() => {
      const cart = document.querySelector("#cart-lines");
      return (
        cart?.closest("[role=dialog]").getBoundingClientRect().right <=
        innerWidth + 0.5
      );
    });
  }
  return page;
}

async function beginCapture(page, inputId) {
  await page.evaluate((id) => {
    window.animationFrames = [];
    window.capture = true;
    function sample() {
      if (!window.capture) {
        return;
      }
      const dialog = document.getElementById(id)?.closest("[role=dialog]");
      const overlay = [...document.querySelectorAll("div")].find(
        (element) =>
          element.classList.contains("bg-black/50") &&
          getComputedStyle(element).zIndex === "60",
      );
      if (dialog && overlay) {
        const panel = dialog.className.includes("max-h-")
          ? dialog
          : dialog.querySelector("[class*='max-h-']");
        const rect = panel.getBoundingClientRect();
        window.animationFrames.push({
          opacity: Number(getComputedStyle(overlay).opacity),
          progress: Math.max(
            0,
            Math.min(1, (innerHeight - rect.top) / rect.height),
          ),
          blur: getComputedStyle(overlay).backdropFilter,
          cartScroll: document.getElementById("cart-lines").scrollTop,
        });
      }
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }, inputId);
}

async function endCapture(page) {
  return page.evaluate(() => {
    window.capture = false;
    return window.animationFrames;
  });
}

test("All cart action sheets share the cart bounds and token-based square-right corners", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [
      320,
      390,
      767,
      768,
      TABLET_MAX_PX,
      DESKTOP_MIN_PX,
      1440,
    ]) {
      const page = await createPage(browser, width);
      // Custom tokens catch hard-coded default spacing/radius as well.
      await page.addStyleTag({
        content: ":root{--page-padding:24px;--radius-md:18px}",
      });
      const cart = page
        .getByRole("dialog", { name: "Cart", exact: true })
        .locator(":scope > div");
      await expect
        .poll(async () => Math.round((await cart.boundingBox()).x))
        .toBe(Math.max(24, width - 430));
      const cartBounds = await cart.boundingBox();
      for (const [name, inputId] of [
        ["Note", "cart-note"],
        ["Discount", "cart-discount-code"],
        ["Gift card", "cart-gift-card-code"],
      ]) {
        await page.getByRole("button", { name, exact: true }).click();
        const dialog = page
          .getByRole("dialog")
          .filter({ has: page.locator(`#${inputId}`) });
        const panel = dialog.locator(":scope > div");
        await expect(panel).toBeVisible();
        await page.waitForFunction((id) => {
          const activeDialog = document
            .getElementById(id)
            ?.closest("[role=dialog]");
          const sheetPanel = activeDialog?.firstElementChild;
          return (
            activeDialog?.contains(document.activeElement) &&
            sheetPanel &&
            Math.abs(sheetPanel.getBoundingClientRect().bottom - innerHeight) <
              0.1
          );
        }, inputId);
        const bounds = await dialog.boundingBox();
        assert.equal(
          bounds.x,
          cartBounds.x,
          `${width}px ${name}: sheet must not fill the cart overlay strip`,
        );
        assert.equal(
          bounds.width,
          cartBounds.width,
          `${width}px ${name}: sheet must share cart width`,
        );
        await expect(panel).toHaveCSS("border-top-left-radius", "18px");
        await expect(panel).toHaveCSS("border-top-right-radius", "0px");
        await expect(panel).toHaveCSS("border-bottom-right-radius", "0px");
        const overlay = page
          .locator("div.bg-black\\/50")
          .filter({ hasNot: page.getByRole("dialog") });
        const overlayBounds = await overlay.evaluateAll((elements) =>
          elements
            .filter((element) => getComputedStyle(element).zIndex === "60")
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { x: rect.x, width: rect.width };
            }),
        );
        assert.deepEqual(
          overlayBounds,
          [{ x: cartBounds.x, width: cartBounds.width }],
          `${width}px ${name}: nested backdrop must stay within the cart frame`,
        );
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Cart action overlay and sheet enter/exit together without introducing another blur layer", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      const page = await createPage(browser, width);
      await page.evaluate(() => {
        document.getElementById("cart-lines").scrollTop = 500;
      });
      for (const [name, inputId, closeMethod] of [
        ["Note", "cart-note", "button"],
        ["Discount", "cart-discount-code", "escape"],
        ["Gift card", "cart-gift-card-code", "outside"],
      ]) {
        const trigger = page.getByRole("button", { name, exact: true });
        const input = page.locator(`#${inputId}`);
        await beginCapture(page, inputId);
        await trigger.click();
        await expect(input).toBeVisible();
        await page.waitForFunction(
          (id) =>
            document
              .getElementById(id)
              ?.closest("[role=dialog]")
              .contains(document.activeElement),
          inputId,
        );
        await page.waitForFunction((id) => {
          const dialog = document.getElementById(id)?.closest("[role=dialog]");
          const panel = dialog?.className.includes("max-h-")
            ? dialog
            : dialog?.querySelector("[class*='max-h-']");
          return (
            panel &&
            Math.abs(panel.getBoundingClientRect().bottom - innerHeight) < 0.1
          );
        }, inputId);
        const opening = await endCapture(page);
        await beginCapture(page, inputId);
        if (closeMethod === "button") {
          await page
            .getByRole("button", { name: "cart.close", exact: true })
            .click();
        } else if (closeMethod === "escape") {
          await page.keyboard.press("Escape");
        } else {
          const cart = await page.locator("#cart-lines").boundingBox();
          await page.mouse.click(
            cart.x + cart.width / 2,
            cart.y + cart.height / 2,
          );
        }
        await expect(input).toHaveCount(0);
        const closing = await endCapture(page);
        for (const [direction, frames] of [
          ["open", opening],
          ["close", closing],
        ]) {
          const moving = frames.filter(
            ({ progress }) => progress > 0.02 && progress < 0.98,
          );
          assert.ok(
            moving.length >= 2,
            `${width}px ${name} ${direction}: captured intermediate animation frames`,
          );
          const drift = Math.max(
            ...moving.map(({ opacity, progress }) =>
              Math.abs(opacity - progress),
            ),
          );
          assert.ok(
            drift < 0.08,
            `${width}px ${name} ${direction}: overlay/sheet drift ${drift.toFixed(3)}`,
          );
          assert.ok(
            frames.every(({ blur }) => blur === "none"),
            `${width}px ${name}: nested backdrop adds animated blur`,
          );
          assert.ok(
            frames.every(({ cartScroll }) => cartScroll === 500),
            `${width}px ${name}: cart scroll changed`,
          );
        }
        await expect(trigger).toBeFocused();
        await expect(
          page.getByRole("dialog", { name: "Cart", exact: true }),
        ).toBeVisible();
        await expect(page.locator("#subtotal")).toHaveText("Subtotal: $100");
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Closing a cart action preserves its pending fetcher and form state; cart-page modal stays usable", async () => {
  const browser = await chromium.launch();
  try {
    for (const layout of ["drawer", "page"]) {
      const page = await createPage(browser, 390, layout);
      const unmounts = await page.evaluate(() => window.fetcherUnmounts);
      await page.getByRole("button", { name: "Note", exact: true }).click();
      await page.locator("#cart-note").fill("Save this note");
      await page
        .getByRole("button", { name: "cart.addNote", exact: true })
        .click();
      await expect(
        page.locator("#cart-note").locator("..").getByRole("button"),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "cart.close", exact: true })
        .click();
      await expect(page.locator("#cart-note")).toHaveCount(0);
      assert.equal(await page.evaluate(() => window.fetcherUnmounts), unmounts);
      await page.evaluate(() =>
        window.finishSubmission({ cart: { note: "Save this note" } }),
      );
      await page.getByRole("button", { name: "Note", exact: true }).click();
      await expect(page.locator("#cart-note")).toHaveValue("Save this note");
      await expect(
        page.getByText("cart.noteSaved", { exact: true }),
      ).toBeVisible();
      assert.deepEqual(await page.evaluate(() => window.submissions[0]), {
        payload: { action: "NoteUpdate", inputs: { note: "Save this note" } },
        options: { method: "POST", action: "/en/cart" },
      });
      await page.keyboard.press("Escape");
      await expect(page.locator("#cart-note")).toHaveCount(0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
