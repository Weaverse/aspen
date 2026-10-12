import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const menu = `${root}app/components/layout/mobile-menu.tsx`;
const drawer = `${root}app/components/animate-drawer.tsx`;
const filterSources = await Promise.all(
  [
    "app/sections/collection-filters/tools-bar.tsx",
    "app/routes/($locale).search.tsx",
  ].map((path) => readFile(`${root}${path}`, "utf8")),
);
// Compile each production drawer function without its unrelated page loader.
const filterFunctions = filterSources
  .map((source, index) => {
    const start = source.indexOf("function FiltersDrawer(");
    const next = source.indexOf("\nfunction ", start + 1);
    return source
      .slice(start, next < 0 ? undefined : next)
      .replace("function FiltersDrawer(", `function FiltersDrawer${index}(`);
  })
  .join("\n");
const bundle = await build({
  stdin: {
    contents: `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import * as Dialog from '@radix-ui/react-dialog';import {XIcon,SlidersIcon} from '@phosphor-icons/react';import {MobileMenu} from '${menu}';import {AnimatedDrawer} from '${drawer}';import {ScrollArea} from '${root}app/components/scroll-area.tsx';import {cn} from '${root}app/utils/cn';
      type ToolsBarProps={filtersPosition:'sidebar'|'drawer'};
      const useTranslation=()=>({t:key=>key==='collection.closeFilters'?'Close filter drawer':key==='collection.filterProducts'?'Filter products':'Filter'});
      const Button=({variant,animate,...props})=><button {...props}/>;
      const Filters=({className})=><div data-testid="filter-options" className={className} style={{height:1200}}>Filter options</div>;
      ${filterFunctions}
      function Drawer({filter=false}){const [open,setOpen]=useState(false);const title=filter?'Filter':'Cart';return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger>{title}</Dialog.Trigger><AnimatedDrawer open={open} filter={filter} flush={!filter}><Dialog.Title>{title}</Dialog.Title><Dialog.Close>Close {title}</Dialog.Close><p>Drawer content</p></AnimatedDrawer></Dialog.Root>}
      createRoot(document.getElementById('root')).render(<div className="flex min-h-screen flex-col"><div style={{height:44}}>Announcement</div><header className="sticky top-0 flex items-center gap-4" style={{height:56,padding:'0 16px'}}><MobileMenu showOnDesktop/><Drawer/><Drawer filter/><section data-testid="collection-filter"><FiltersDrawer0 filtersPosition="drawer" appliedFiltersCount={0} disabled={false}/></section><section data-testid="search-filter"><FiltersDrawer1 appliedFiltersCount={0} disabled={false}/></section></header><main style={{height:2000}}>Page content</main></div>);`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "menu-fixture",
      setup(builder) {
        builder.onResolve(
          { filter: /^@weaverse\/hydrogen$|^~\// },
          ({ path, importer }) =>
            importer === menu ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "@weaverse/hydrogen"
              ? `export const useTranslation=()=>({t:(key,args)=>({'accessibility.openMenu':'Open menu','accessibility.closeMenu':'Close menu','navigation.menu':'Menu','accessibility.openSubmenu':'Open '+args?.item+' submenu','accessibility.backToMainMenu':'Back to main menu'}[key]||key)});`
              : path.includes("use-header-menu")
                ? `export const useHeaderMenu=()=>[{id:'home',title:'Home',to:'/',items:[]},{id:'collections',title:'Collections',to:'/collections',items:[{id:'tables',title:'Tables',to:'/collections/tables',items:[]}]}];`
                : path.includes("/cn")
                  ? `import {clsx} from 'clsx';export const cn=(...args)=>clsx(args);`
                  : `import React from 'react';export const Image=()=>null;export default ({to,prefetch,children,...props})=><a href={to} {...props}>{children}</a>;`,
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
const sources = await Promise.all(
  [menu, drawer].map((path) => readFile(path, "utf8")),
);
const css = stylesheet.build([
  ...sources.join(" ").match(/[A-Za-z0-9_!()[\]#%.:/,+<>*=&~-]+/g),
  ...filterSources.join(" ").match(/[A-Za-z0-9_!()[\]#%.:/,+<>*=&~-]+/g),
  "flex",
  "min-h-screen",
  "flex-col",
  "sticky",
  "top-0",
  "items-center",
  "gap-4",
]);

async function mount(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(
    `<style>${css}:root{--body-base-size:14px;--color-background:white;--radius-md:12px}body{margin:0}header{flex-shrink:0}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(
    page.getByRole("button", { name: "Open menu", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 40));
}

async function geometry(page) {
  return await page.locator("main").evaluate((element) => ({
    scroll: scrollY,
    x: element.getBoundingClientRect().x,
    y: element.getBoundingClientRect().y,
    width: element.getBoundingClientRect().width,
  }));
}
async function pointerOpen(page, name) {
  const bounds = await page
    .getByRole("button", { name, exact: true })
    .boundingBox();
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
}

test("Collection and Search Filter reserve a close-button column at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1032, 1033, 1440]) {
      for (const kind of ["collection", "search"]) {
        await mount(page, width);
        await page.getByTestId(`${kind}-filter`).getByRole("button").click();
        const dialog = page.getByRole("dialog", {
          name: "Filter",
          exact: true,
        });
        await expect(dialog.locator(":scope > div")).toHaveCSS(
          "transform",
          "none",
        );
        const layout = await dialog.evaluate((element) => {
          const panel = element.firstElementChild;
          const header = panel.firstElementChild.firstElementChild;
          const options = panel.querySelector('[data-testid="filter-options"]');
          const viewport = panel.querySelector(
            "[data-radix-scroll-area-viewport]",
          );
          const closeIcon = header
            .querySelector("button svg")
            .getBoundingClientRect();
          const p = panel.getBoundingClientRect(),
            h = header.getBoundingClientRect(),
            o = options.getBoundingClientRect(),
            v = viewport.getBoundingClientRect();
          return {
            left: o.x - p.x,
            right: p.right - o.right,
            headerLeft: parseFloat(getComputedStyle(header).paddingLeft),
            top: h.y - p.y,
            gap: v.y - h.bottom,
            closeRight: p.right - closeIcon.right,
            closeGap: closeIcon.left - o.right,
            overflow: panel.scrollWidth > panel.clientWidth,
          };
        });
        expect(layout).toEqual({
          left: 20,
          right: 60,
          headerLeft: 20,
          top: 12,
          gap: 16,
          closeRight: 20,
          closeGap: 20,
          overflow: false,
        });
        await page
          .getByRole("button", { name: "Close filter drawer", exact: true })
          .click();
        await expect(dialog).toHaveCount(0);
      }
    }
  } finally {
    await browser.close();
  }
});

test("Menu closes by sliding left on mobile and tablet without replacing submenu content", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [390, 864, 1032]) {
      await mount(page, width);
      const before = await geometry(page);
      await pointerOpen(page, "Open menu");
      await page
        .getByRole("button", { name: "Open Collections submenu" })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.locator(":scope > div")).toHaveCSS(
        "transform",
        "none",
      );
      await expect(
        page.getByRole("link", { name: "Tables", exact: true }),
      ).toBeVisible();
      const panelWidth = (await dialog.boundingBox()).width;
      const [frames] = await Promise.all([
        page.evaluate(async () => {
          const samples = [];
          const start = performance.now();
          while (performance.now() - start < 1000) {
            const panel = document.querySelector('[role="dialog"] > div');
            if (panel) {
              samples.push({
                x: panel.getBoundingClientRect().x,
                text: panel.textContent,
              });
            }
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return samples;
        }),
        page.keyboard.press("Escape"),
      ]);
      expect(
        frames.some(({ x }) => x < -1 && x > -panelWidth + 1),
        `${width}px: intermediate leftward exit frames`,
      ).toBe(true);
      expect(frames.every(({ text }) => text.includes("Tables"))).toBe(true);
      await expect(dialog).toHaveCount(0);
      expect(await geometry(page)).toEqual(before);
    }
  } finally {
    await browser.close();
  }
});

test("Menu respects reduced motion and can reopen during its exit", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await mount(page, 864);
    await pointerOpen(page, "Open menu");
    await expect(page.getByRole("dialog").locator(":scope > div")).toHaveCSS(
      "transform",
      "none",
    );
    await page.keyboard.press("Escape");
    // Programmatic activation avoids clicking through the exiting overlay.
    await page
      .getByRole("button", { name: "Open menu", exact: true })
      .evaluate((button) => button.click());
    await expect(page.getByRole("dialog").locator(":scope > div")).toHaveCSS(
      "transform",
      "none",
    );
    await expect(
      page.getByRole("button", { name: "Open Collections submenu" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page, 390);
    const before = await geometry(page);
    await pointerOpen(page, "Open menu");
    await expect(page.getByRole("dialog").locator(":scope > div")).toHaveCSS(
      "transform",
      "none",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await geometry(page)).toEqual(before);
  } finally {
    await browser.close();
  }
});

test("Menu preserves page position and restores trigger focus for Esc, X and overlay dismissal", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [390, 864, 1032, 1280]) {
      for (const close of ["Escape", "X", "overlay"]) {
        await mount(page, width);
        const before = await geometry(page);
        await pointerOpen(page, "Open menu");
        const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
        await expect(dialog).toBeVisible();
        expect(await geometry(page)).toEqual(before);
        if (close === "Escape") {
          await page.keyboard.press("Escape");
        } else if (close === "X") {
          await page
            .getByRole("button", { name: "Close menu", exact: true })
            .click();
        } else {
          await expect(dialog.locator(":scope > div")).toHaveCSS(
            "transform",
            "none",
          );
          await page.mouse.click(width - 10, 400);
        }
        await expect(dialog, `${width}px / ${close}`).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Open menu", exact: true }),
        ).toBeFocused();
        expect(await geometry(page)).toEqual(before);
      }
    }
  } finally {
    await browser.close();
  }
});

test("Closing a submenu preserves scroll, and reopening returns to the main menu", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await mount(page, 864);
    const before = await geometry(page);
    await pointerOpen(page, "Open menu");
    await page
      .getByRole("button", { name: "Open Collections submenu" })
      .click();
    await expect(
      page.getByRole("link", { name: "Tables", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await geometry(page)).toEqual(before);
    await pointerOpen(page, "Open menu");
    await expect(
      page.getByRole("button", { name: "Open Collections submenu" }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});

test("Existing Cart and Filter drawers retain page position at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [390, 864, 1440]) {
      await mount(page, width);
      for (const name of ["Cart", "Filter"]) {
        const before = await geometry(page);
        await pointerOpen(page, name);
        const dialog = page.getByRole("dialog", { name, exact: true });
        await expect(dialog).toBeVisible();
        expect(await geometry(page)).toEqual(before);
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        expect(await geometry(page)).toEqual(before);
      }
    }
  } finally {
    await browser.close();
  }
});

test("Filter enters from the right, keeps a left overlay gutter, and uses left-only radius tokens", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [320, 390, 768, 1032, 1033, 1440]) {
      await mount(page, width);
      await page.evaluate(() =>
        document.documentElement.style.setProperty("--radius-md", "20px"),
      );
      const [frames] = await Promise.all([
        page.evaluate(async () => {
          const samples = [],
            start = performance.now();
          while (performance.now() - start < 700) {
            const panel = document.querySelector('[role="dialog"] > div');
            if (panel) {
              samples.push(panel.getBoundingClientRect().x);
            }
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return samples;
        }),
        pointerOpen(page, "Filter"),
      ]);
      const dialog = page.getByRole("dialog", { name: "Filter", exact: true });
      const panel = dialog.locator(":scope > div");
      await expect(panel).toHaveCSS("transform", "none");
      const bounds = await panel.boundingBox();
      expect(bounds.width).toBe(Math.min(430, width - 32));
      expect(bounds.x + bounds.width).toBeCloseTo(width);
      expect(bounds.x).toBeGreaterThan(0);
      expect(Math.max(...frames)).toBeGreaterThan(bounds.x);
      expect(Math.min(...frames)).toBeGreaterThanOrEqual(bounds.x - 1);
      await expect(panel).toHaveCSS("border-top-left-radius", "20px");
      await expect(panel).toHaveCSS("border-bottom-left-radius", "20px");
      await expect(panel).toHaveCSS("border-top-right-radius", "0px");
      await expect(panel).toHaveCSS("border-bottom-right-radius", "0px");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
    }
  } finally {
    await browser.close();
  }
});
