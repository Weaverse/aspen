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
    contents: `import React from "react";
      import {createRoot} from "react-dom/client";
      import {FloatingHotspot} from "./app/sections/hotspots/floating-hotspot";
      function Fixture(){const [quick,setQuick]=React.useState(false);return <div style={{position:"relative",margin:100}}><FloatingHotspot product={{title:"Fixture"}} offsetX={30} offsetY={30} onQuickAdd={()=>setQuick(true)}>Marker</FloatingHotspot>{quick&&<button autoFocus>Quick View</button>}</div>}
      createRoot(document.getElementById("root")).render(<Fixture/>);`,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "presentation-only",
      setup(builder) {
        builder.onResolve(
          { filter: /^@weaverse\/hydrogen$|^\.\/product-popup$/ },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const useTranslation=()=>({t:()=>"View Fixture"});`
              : `import React from "react";export const ProductPopup=({onQuickAdd})=><div style={{width:200,height:100,background:"white"}}>Popup<button onClick={()=>onQuickAdd([])}>Select options</button><a href="#details">Details</a></div>;`,
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
const sheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = sheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

test("Hover popup fades out before unmount, can reopen, and preserves Quick View focus", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const marker = page.getByRole("button", { name: "View Fixture" });
    const popup = page.getByRole("dialog", { includeHidden: true });
    await marker.hover();
    await expect(popup).toBeVisible();
    await popup.hover();
    await page.waitForTimeout(250);
    await expect(popup).toHaveAttribute("data-state", "open");
    await page.mouse.move(0, 0);
    await expect(popup).toHaveAttribute("data-state", "closed");
    await expect(popup).toHaveCSS("animation-name", "hotspot-popup-out");
    await expect(popup).toHaveCSS("animation-duration", "0.15s");
    await expect(popup).toHaveAttribute("inert", "");
    const halfway = await popup.evaluate((el) => {
      const a = el.getAnimations()[0];
      a.pause();
      a.currentTime = 75;
      return Number(getComputedStyle(el).opacity);
    });
    assert.ok(halfway > 0 && halfway < 1);
    await marker.hover();
    await expect(popup).toHaveAttribute("data-state", "open");
    await expect(popup).not.toHaveAttribute("inert", "");
    const reopened = await popup.evaluate((element) => {
      const enter = element.getAnimations()[0];
      enter.pause();
      enter.currentTime = 0;
      return Number(getComputedStyle(element).opacity);
    });
    assert.ok(
      Math.abs(reopened - halfway) < 0.001,
      "Reopening must continue from the exit frame without a flash",
    );
    await popup.evaluate((element) => {
      for (const animation of element.getAnimations()) {
        animation.finish();
      }
    });
    await popup.getByRole("button", { name: "Select options" }).click();
    assert.equal(
      await popup.count(),
      0,
      "The old card must not remain above Quick View during handoff",
    );
    await expect(popup).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Quick View", exact: true }),
    ).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await marker.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS("animation-name", "none");
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
  } finally {
    await browser.close();
  }
});
