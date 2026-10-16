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
// Real Testimonials adapter, HotspotsItem, Radix popover and QuickShopTrigger.
// Product presentation is stubbed; routing, modal motion and focus stay real.
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {createMemoryRouter,RouterProvider} from "react-router";
      import TestimonialHotspot from "./app/sections/testimonials/item";
      import Hotspot from "./app/sections/hotspots/item";
      window.settings={};
      window.requests=[];
      window.start=(testimonial)=>{
        const Item=testimonial?TestimonialHotspot:Hotspot;
        const router=createMemoryRouter([
          {id:"root",path:"/",element:<div style={{position:"relative",height:400,overflow:"hidden"}}><Item product={{handle:"fixture",title:"Fixture"}} loaderData={{product:{handle:"fixture",title:"Fixture"}}} iconSize={34} offsetX={50} offsetY={50} showPrice showViewDetailsLink viewDetailsLinkText="Details"/></div>},
          {path:"/api/product",loader:({request})=>{window.requests.push(request.url);return new Promise(()=>{});}}
        ]);
        createRoot(document.getElementById("root")).render(<RouterProvider router={router}/>);
      };
    `,
  },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "hotspot-boundaries",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|use-translated-text$|^\.\/product-popup$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          resolveDir: root,
          loader: "tsx",
          contents:
            path === "@weaverse/hydrogen"
              ? `export const createSchema=v=>v;export const IMAGES_PLACEHOLDERS={};export const useThemeSettings=()=>window.settings;export const useParentInstance=()=>null;export const useTranslation=()=>({t:key=>key});`
              : path.endsWith("use-translated-text")
                ? `export const useTranslatedText=()=>v=>v;`
                : `import React from "react";export function ProductPopup({onQuickAdd}){return <div><button onClick={()=>onQuickAdd?.([{name:"Color",value:"Blue"}])}>Open selected product</button><span data-shared-action={Boolean(onQuickAdd)}>Fixture</span></div>;}`,
        }));
      },
    },
  ],
});
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css =
  sheet.build(
    new Scanner({
      sources: [
        { base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false },
      ],
    }).scan(),
  ) +
  (bundle.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "");

test("Testimonials and Hotspots share desktop popup actions and responsive Quick View motion/focus", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1440]) {
      let reference;
      for (const testimonial of [false, true]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        page.setDefaultTimeout(3000);
        await page.setContent(
          `<!doctype html><style>${css}</style><div id="root"></div>`,
        );
        await page.addScriptTag({
          content: bundle.outputFiles.find((file) => file.path.endsWith(".js"))
            .text,
        });
        await page.evaluate((value) => window.start(value), testimonial);
        const marker = page.locator(
          'button[aria-label="product.viewProduct"]:visible',
        );
        await marker.waitFor();
        if (width >= DESKTOP_MIN_PX) {
          await marker.hover();
          await expect(
            page.locator('[data-shared-action="true"]'),
          ).toBeVisible();
          await page
            .getByRole("button", { name: "Open selected product" })
            .click();
          await expect(
            page.locator("[data-radix-popper-content-wrapper]"),
          ).toHaveCount(0);
        } else {
          await marker.click();
        }
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect
          .poll(() => page.evaluate(() => window.requests.length))
          .toBe(1);
        const request = new URL(await page.evaluate(() => window.requests[0]));
        assert.equal(request.searchParams.get("handle"), "fixture");
        if (width >= DESKTOP_MIN_PX) {
          assert.equal(request.searchParams.get("Color"), "Blue");
        }
        const geometry = await dialog.evaluate((el) => ({
          className: el.className,
          position: getComputedStyle(el).position,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        }));
        if (testimonial) {
          assert.deepEqual(geometry, reference);
        } else {
          reference = geometry;
        }
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(marker).toBeFocused();
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
