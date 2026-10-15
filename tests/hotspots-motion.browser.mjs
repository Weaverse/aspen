import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
      import {createRoot} from "react-dom/client";
      import HotspotsItem from "./app/sections/hotspots/item";
      const root = createRoot(document.getElementById("root"));
      window.start = (icon="circle", portalPopup=false) => root.render(
        <div style={{position:"relative",width:"100%",height:440}}>
          <HotspotsItem icon={icon} iconSize={34} offsetX={30} offsetY={30}
            product={{handle:"fixture",title:"Fixture"}}
            loaderData={{product:{title:"Fixture"}}}
            portalPopup={portalPopup} showPrice showViewDetailsLink viewDetailsLinkText="Details"/>
        </div>);
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
      name: "hotspots-motion-fixture",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^react-router$|^~\/components\/(product\/quick-shop|scroll-area)$|^~\/hooks\/(use-prefix-path-with-locale|use-translated-text)$|^~\/graphql\/queries$|^\.\/product-popup$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "./product-popup"
              ? `import React from "react";export const ProductPopup=({onQuickAdd})=><div style={{width:200,height:100,background:"white"}}>Popup fixture{onQuickAdd&&<button onClick={()=>onQuickAdd([])}>Quick Add fixture</button>}<a href="#details" onClick={(event)=>{event.preventDefault();window.detailsActivations=(window.detailsActivations||0)+1}}>Details fixture</a></div>;`
              : `import React from "react";
            export const useTranslation=()=>({t:(key,vars)=>key==="product.viewProduct"?"View "+vars.product:key});
            export const createSchema=data=>data;
            export const useTranslatedText=()=>text=>text;
            export const usePrefixPathWithLocale=path=>path;
            export const useFetcher=()=>({load:()=>{},data:null,state:"idle"});
            export const PRODUCT_QUERY="";
            export const ScrollArea=({children})=><div>{children}</div>;
            export const QuickShop=()=>null;
            export const QuickShopTrigger=({open})=>open?<div role="dialog"><button autoFocus>Quick Shop fixture</button></div>:null;`,
          loader: "tsx",
          resolveDir: root,
        }));
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

async function createPage(browser, width, portalPopup = false) {
  const page = await browser.newPage({ viewport: { width, height: 700 } });
  await page.setContent(`<style>${css}</style><div id="root"></div>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate((value) => window.start("circle", value), portalPopup);
  await expect(
    page.getByRole("button", { name: "View Fixture" }),
  ).toBeVisible();
  return page;
}

test("Desktop hotspot popup animates in/out and stays usable across hover, reopen and Quick Add", async () => {
  const browser = await chromium.launch();
  try {
    for (const portalPopup of [false, true]) {
      const page = await createPage(browser, 1440, portalPopup);
      const trigger = page.getByRole("button", { name: "View Fixture" });
      const popup = page
        .getByRole("dialog", { includeHidden: true })
        .filter({ hasText: "Popup fixture" });
      await trigger.hover();
      await expect(popup).toHaveCSS("animation-name", "hotspot-popup-in");
      await expect(popup).toHaveCSS("animation-duration", "0.4s");
      const halfway = await popup.evaluate((el) => {
        const a = el.getAnimations()[0];
        a.pause();
        a.currentTime = 100;
        const opacity = Number(getComputedStyle(el).opacity);
        a.play();
        return opacity;
      });
      assert.ok(halfway > 0 && halfway < 1);
      await popup.hover();
      await page.waitForTimeout(220);
      await expect(popup).toHaveAttribute("data-state", "open");
      await page.mouse.move(0, 0);
      await expect(popup).toHaveAttribute("data-state", "closed");
      await expect(popup).toHaveCSS("animation-name", "hotspot-popup-out");
      await trigger.hover();
      await expect(popup).toHaveAttribute("data-state", "open");
      await page.mouse.move(0, 0);
      await expect(popup).toHaveCount(0);
      await trigger.focus();
      await trigger.press("Enter");
      await expect(popup).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
      if (!portalPopup) {
        await trigger.hover();
        await popup.getByRole("button", { name: "Quick Add fixture" }).click();
        await expect(page.getByText("Quick Shop fixture")).toBeVisible();
        await expect(popup).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Quick Shop fixture" }),
        ).toBeFocused();
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Closed hotspot actions cannot activate from the keyboard during fade-out", async () => {
  const browser = await chromium.launch();
  try {
    for (const portalPopup of [false, true]) {
      const page = await createPage(browser, 1440, portalPopup);
      const trigger = page.getByRole("button", { name: "View Fixture" });
      const popup = page
        .getByRole("dialog", { includeHidden: true })
        .filter({ hasText: "Popup fixture" });
      await trigger.hover();
      const action = portalPopup
        ? popup.getByRole("link", { name: "Details fixture" })
        : popup.getByRole("button", { name: "Quick Add fixture" });
      await action.focus();
      await expect(action).toBeFocused();
      // Freeze the real exit animation so assertions run inside its 200ms
      // lifetime regardless of machine speed, without changing production CSS.
      await popup.evaluate((element) => {
        const observer = new MutationObserver(() => {
          if (element.dataset.state === "closed") {
            for (const animation of element.getAnimations()) {
              if (animation.animationName === "hotspot-popup-out") {
                animation.pause();
              }
            }
            observer.disconnect();
          }
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
      });
      await page.mouse.move(0, 0);
      await expect(popup).toHaveAttribute("data-state", "closed");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      await expect(page.getByText("Quick Shop fixture")).toHaveCount(0);
      assert.equal(
        await page.evaluate(() => window.detailsActivations || 0),
        0,
      );
      await expect(popup).toHaveAttribute("inert", "");
      await popup.evaluate((element) => {
        for (const animation of element.getAnimations()) {
          animation.play();
        }
      });
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Hotspot pulse uses a continuous fade cycle at every breakpoint without changing marker size or touch action", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [375, 768, 1032, 1033, 1440]) {
      const page = await createPage(browser, width);
      const trigger = page.getByRole("button", { name: "View Fixture" });
      const ring = trigger.locator(".animate-hotspot-pulse");
      await expect(ring).toHaveCSS("animation-duration", "2s");
      const frames = await ring.evaluate((el) =>
        el.getAnimations()[0].effect.getKeyframes(),
      );
      assert.equal(frames[0].opacity, "0");
      assert.equal(frames.at(-1).opacity, "0");
      assert.ok(
        !frames.some((frame) => frame.offset === 0.75 && frame.opacity === "0"),
      );
      assert.equal((await trigger.boundingBox()).width, 34);
      if (width <= 1032) {
        await trigger.click();
        await expect(page.getByText("Quick Shop fixture")).toBeVisible();
        await expect(page.getByText("Popup fixture")).toHaveCount(0);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Reduced motion disables hotspot pulse and popup animation", async () => {
  const browser = await chromium.launch();
  try {
    const page = await createPage(browser, 1440);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const trigger = page.getByRole("button", { name: "View Fixture" });
    await expect(trigger.locator(".animate-hotspot-pulse")).toHaveCSS(
      "animation-name",
      "none",
    );
    await trigger.hover();
    const popup = page.getByRole("dialog").filter({ hasText: "Popup fixture" });
    await expect(popup).toHaveCSS("animation-name", "none");
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
  } finally {
    await browser.close();
  }
});
