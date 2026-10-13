import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const header = `${root}app/components/layout/header.tsx`;
const search = `${root}app/components/layout/predictive-search/search-desktop/index.tsx`;
const mobileSearch = `${root}app/components/layout/predictive-search/search-mobile/index.tsx`;
const form = `${root}app/components/layout/predictive-search/search-form.tsx`;
const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Header} from '${header}'; createRoot(document.getElementById('root')).render(<><Header/><main style={{height:2000}}>Page content</main></>);`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "search-transition-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^fixture-predictive$/ }, ({ path }) => ({
          path,
          namespace: "fixture",
        }));
        builder.onResolve(
          {
            filter:
              /^~\/|^\.\/|^\.\.\/|^@weaverse\/hydrogen$|^react-router$|^react-use\/esm\/useWindowScroll$/,
          },
          ({ path, importer }) => {
            if (
              importer !== header &&
              importer !== search &&
              importer !== mobileSearch &&
              importer !== form
            ) {
              return;
            }
            if (
              importer === header &&
              path === "./predictive-search/search-desktop"
            ) {
              return { path: search };
            }
            if (importer === search && path === "../search-form") {
              return { path: form };
            }
            if (
              importer === header &&
              path === "./predictive-search/search-mobile"
            ) {
              return { path: mobileSearch };
            }
            if (importer === mobileSearch && path === "../search-form") {
              return { path: form };
            }
            return { path, namespace: "fixture" };
          },
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => {
          let contents;
          if (path === "fixture-predictive") {
            contents = `import React,{useSyncExternalStore} from 'react';
            let value={results:[],searchState:'idle',searchTermValue:''}, version=0;
            const listeners=new Set(); const emit=()=>listeners.forEach(fn=>fn());
            export const usePredictiveSearch=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>value);
            const Form=props=>React.createElement('form',props);
            export const useFixtureFetcher=()=>{const snapshot=usePredictiveSearch();return {state:snapshot.searchState,Form,submit:data=>fetchResults(data.q)}};
            export function fetchResults(term){const request=++version;
              if(!term){value={...value,searchState:'idle',searchTermValue:''};emit();return;}
              setTimeout(()=>{if(request!==version)return;value={...value,searchState:'loading',searchTermValue:term,searchRequest:request};emit()},80);
              setTimeout(()=>{if(request!==version)return;value={...value,searchState:'idle',results:term==='zzz'?[]:['products','collections','pages'].map(type=>({type,items:Array.from({length:10},(_,i)=>({id:type+i,title:type+i,url:'/'}))}))};emit()},600);
            }`;
          } else if (path.includes("use-predictive-search")) {
            contents = `export {usePredictiveSearch} from 'fixture-predictive';`;
          } else if (path.includes("types/predictive-search")) {
            contents = `export const PREDICTIVE_SEARCH_FETCHER_KEY='fixture-search';`;
          } else if (path === "@weaverse/hydrogen") {
            contents = `export const useThemeSettings=()=>({designSystemPreset:new URLSearchParams(location.search).get('transparent')?'custom':'aspen',enableTransparentHeader:location.search.includes('transparent'),headerLayout:'inline',headerWidth:'stretch'});export const useTranslation=()=>({t:k=>({'accessibility.openSearch':'Open search','search.placeholder':'Enter a keyword','search.searching':'Searching','search.predictiveTitle':'Predictive search',...window.fixtureTranslations}[k]||k)});`;
          } else if (path === "react-router") {
            contents = `import React from 'react';export {useFixtureFetcher as useFetcher} from 'fixture-predictive';const route={pathname:'/'};export const useParams=()=>({});export const useLocation=()=>route;export const useNavigate=()=>url=>{window.fixtureNavigation=url};export const useRouteError=()=>null;export const useRouteLoaderData=()=>({});export const Await=({children,resolve})=>children(resolve);`;
          } else if (path.includes("useWindowScroll")) {
            contents = `export default ()=>({y:window.scrollY});`;
          } else if (path.includes("/cn")) {
            contents = `import {clsx} from 'clsx';export const cn=(...args)=>clsx(args);`;
          } else if (path.includes("use-prefix-path")) {
            contents = `export const usePrefixPathWithLocale=p=>p;`;
          } else if (path.includes("pinned-collections")) {
            contents = `export const withPinnedCollections=items=>items||[];`;
          } else if (path.includes("predictive-search-result")) {
            contents = `import React from 'react';export const PredictiveSearchResult=({items=[],type})=><ul>{items.map(item=><li key={item.id} style={{height:type==='products'?40:20,overflow:'hidden'}}>{item.title}</li>)}</ul>;`;
          } else if (path.includes("PopularSearch")) {
            contents = `import React from 'react';export const PopularSearch=({className})=><div className={className} style={{height:240}}>Popular searches</div>;`;
          } else {
            contents = `import React from 'react';export const Logo=()=> <a href="/">Aspen</a>;export const DEFAULT_LOCALE={};export const stripLocalePrefix=p=>p;export const MobileMenu=()=>null;export const PredictiveSearchButtonMobile=()=>null;export const CartDrawer=()=>null;export const DesktopMenu=()=>null;export default ({to,children,...props})=><a href={to} {...props}>{children}</a>;`;
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
const sources = await Promise.all(
  [header, search, mobileSearch].map((path) => readFile(path, "utf8")),
);
const css = stylesheet.build(
  sources.join(" ").match(/[A-Za-z0-9_!()[\]#%.:/,+<>*=&~-]+/g),
);

async function mount(page, transparent = false) {
  await page.goto(`about:blank${transparent ? "?transparent" : ""}`);
  await page.setContent(
    `<style>${css}:root{--height-nav:81px;--topbar-height:0px;--initial-topbar-height:0px;--body-base-size:14px;--color-header-bg:white;--color-header-text:#343231}body{margin:0}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Popular searches", { exact: true }),
  ).toBeVisible();
}

async function trace(page, action, milliseconds = 1300) {
  const [frames] = await Promise.all([
    page.evaluate(async (duration) => {
      const samples = [],
        start = performance.now();
      while (performance.now() - start < duration) {
        const dialog = document.querySelector('[role="dialog"]'),
          rect = dialog?.getBoundingClientRect();
        samples.push({
          time: performance.now() - start,
          height: rect?.height,
          scroll: scrollY,
          mainY: document.querySelector("main").getBoundingClientRect().y,
          busy: document
            .querySelector("[aria-busy]")
            ?.getAttribute("aria-busy"),
        });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return samples;
    }, milliseconds),
    action(),
  ]);
  return frames;
}

test("Editing a query during an older request keeps loading throughout the new debounce", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await mount(page);
    const input = page.getByPlaceholder("Enter a keyword");
    await input.fill("a");
    // The first request starts at 380ms and finishes at 900ms in this fixture.
    // Edit before it finishes, so its completion falls in the new debounce.
    await page.waitForTimeout(750);
    const frames = await trace(page, () => input.fill("ab"), 600);
    expect(frames.every((frame) => frame.busy === "true")).toBe(true);
    await expect(
      page.getByRole("button", {
        name: "search.collections (10)",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});

test("Resubmitting the same query does not hand loading to the older request or leave it stuck", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await mount(page);
    const input = page.getByPlaceholder("Enter a keyword");
    await input.fill("a");
    await page.waitForTimeout(750);
    const frames = await trace(
      page,
      async () => {
        await input.fill("ab");
        await input.fill("a");
      },
      600,
    );
    expect(frames.every((frame) => frame.busy === "true")).toBe(true);
    await expect(
      page.getByRole("button", {
        name: "search.collections (10)",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  } finally {
    await browser.close();
  }
});

test("Mobile Search input meets the iOS focus-zoom font floor and preserves larger theme fonts", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 768, 1032]) {
      for (const bodySize of [12, 14, 20]) {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
        });
        await mount(page);
        await page.evaluate(
          (size) =>
            document.documentElement.style.setProperty(
              "--body-base-size",
              `${size}px`,
            ),
          bodySize,
        );
        const input = page.getByPlaceholder("Enter a keyword");
        await expect(input).toHaveCSS(
          "font-size",
          `${Math.max(16, bodySize)}px`,
        );
        await expect(input).toBeFocused();
        const panel = page.getByRole("dialog").locator(":scope > div");
        await expect(panel).toHaveCSS("transform", "none");
        const bounds = await panel.boundingBox();
        expect(bounds.x).toBe(0);
        expect(bounds.width).toBe(Math.min(width, 381));
        await input.fill("chair");
        await page
          .getByRole("button", {
            name: "accessibility.clearSearch",
            exact: true,
          })
          .click();
        await expect(input).toHaveValue("");
        await expect(input).toBeFocused();
        await input.fill("table");
        await input.press("Enter");
        expect(await page.evaluate(() => window.fixtureNavigation)).toBe(
          "/search?q=table",
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Search resource tabs keep 40px gaps and align the active underline", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1032, 1279, 1280, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await mount(page);
      await page.getByPlaceholder("Enter a keyword").fill("chair");
      const labels =
        width < 1280
          ? ["search.products", "search.collections", "search.page"]
          : [
              "search.products (10)",
              "search.collections (10)",
              "search.page (10)",
            ];
      const tabs = labels.map((name) =>
        page.getByRole("button", { name, exact: true }),
      );
      const pageTab = tabs[2];
      await expect(pageTab).toBeVisible();
      await pageTab.click();

      const bounds = await Promise.all(tabs.map((tab) => tab.boundingBox()));
      expect(bounds[1].x - (bounds[0].x + bounds[0].width)).toBeCloseTo(40, 1);
      expect(bounds[2].x - (bounds[1].x + bounds[1].width)).toBeCloseTo(40, 1);

      const alignment = await pageTab.evaluate((element) => {
        const button = element.getBoundingClientRect();
        const underline = getComputedStyle(element, "::after");
        return {
          labelLeft: button.left,
          underlineLeft: button.left + Number.parseFloat(underline.left),
        };
      });

      expect(alignment.underlineLeft).toBeCloseTo(alignment.labelLeft, 1);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Mobile Search tabs isolate horizontal overflow and remain keyboard-accessible with merchant fonts and translated labels", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 375, 390, 768, 1032]) {
      for (const size of [14, 20, 22, 48]) {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
        });
        await mount(page);
        await page.evaluate((fontSize) => {
          document.documentElement.style.setProperty(
            "--body-base-size",
            `${fontSize}px`,
          );
          window.fixtureTranslations = {
            "search.products": fontSize === 48 ? "Produkte" : "Products",
            "search.collections":
              fontSize === 48 ? "Produktkollektionen" : "Collections",
            "search.page": fontSize === 48 ? "Seiten" : "Page",
            "search.viewAllProducts": "All",
          };
        }, size);
        await page.getByPlaceholder("Enter a keyword").fill("chair");
        const pageTab = page.getByRole("button", {
          name: size === 48 ? "Seiten" : "Page",
          exact: true,
        });
        await expect(pageTab).toBeVisible();
        const layout = await pageTab.evaluate((button) => {
          const row = button.parentElement;
          const scroller = row.closest("form").lastElementChild;
          return {
            rowClient: row.clientWidth,
            rowScroll: row.scrollWidth,
            contentClient: scroller.clientWidth,
            contentScroll: scroller.scrollWidth,
          };
        });
        expect(layout.contentScroll).toBe(layout.contentClient);
        await pageTab.focus();
        await pageTab.press("Enter");
        await expect(page.getByText("pages0", { exact: true })).toBeVisible();
        const bounds = await pageTab.boundingBox();
        const rowBounds = await pageTab.locator("..").boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(rowBounds.x - 1);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(
          rowBounds.x + rowBounds.width + 1,
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Search popup content width stays stable when resource tabs toggle vertical overflow", async () => {
  const browser = await chromium.launch({
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  try {
    for (const width of [1280, 1440, 1920]) {
      const page = await browser.newPage({ viewport: { width, height: 600 } });
      await mount(page);
      // Exercise persistent scrollbars as well as macOS overlay-scrollbar behavior.
      await page.addStyleTag({
        content: '[role="dialog"] > div::-webkit-scrollbar{width:16px}',
      });
      await page.getByPlaceholder("Enter a keyword").fill("a");
      await expect(
        page.getByRole("button", { name: "search.collections (10)" }),
      ).toBeVisible();
      const measure = () =>
        page.getByRole("dialog").evaluate((element) => {
          const panel = element.firstElementChild;
          const searchForm = panel.querySelector("form > div");
          return {
            content: searchForm.getBoundingClientRect().width,
            x: searchForm.getBoundingClientRect().x,
            panel: panel.getBoundingClientRect().width,
            overflow: panel.scrollHeight > panel.clientHeight,
          };
        });
      await expect.poll(async () => (await measure()).overflow).toBe(true);
      const products = await measure();
      for (const tab of [
        "search.collections (10)",
        "search.page (10)",
        "search.products (10)",
      ]) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await expect
          .poll(async () => (await measure()).overflow)
          .toBe(tab === "search.products (10)");
        expect((await measure()).content).toBe(products.content);
        expect((await measure()).x).toBe(products.x);
        expect((await measure()).panel).toBe(products.panel);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("First character retains popup height during loading and resizes smoothly for results and tabs", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await mount(page);
    const input = page.getByPlaceholder("Enter a keyword");
    const before = (await page.getByRole("dialog").boundingBox()).height;
    const frames = await trace(page, () => input.fill("a"));
    expect(
      Math.min(...frames.map((frame) => frame.height)),
    ).toBeGreaterThanOrEqual(before - 1);
    const maxStep = Math.max(
      ...frames
        .slice(1)
        .map((frame, i) => Math.abs(frame.height - frames[i].height)),
    );
    expect(maxStep).toBeLessThan(100);
    await expect(
      page.getByRole("button", { name: "search.collections (10)" }),
    ).toBeVisible();
    const tabFrames = await trace(
      page,
      () =>
        page.getByRole("button", { name: "search.collections (10)" }).click(),
      600,
    );
    expect(
      Math.max(
        ...tabFrames
          .slice(1)
          .map((frame, i) => Math.abs(frame.height - tabFrames[i].height)),
      ),
    ).toBeLessThan(100);
    await input.fill("zzz");
    await expect(
      page.getByText("search.noResults", { exact: true }),
    ).toBeVisible();
    await input.fill("");
    await expect(
      page.getByText("Popular searches", { exact: true }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});

test("Search preserves scroll and the configured transparent-header position", async () => {
  const browser = await chromium.launch();
  try {
    for (const transparent of [false, true]) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });
      await mount(page, transparent);
      await page.getByPlaceholder("Enter a keyword").press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.evaluate(() => window.scrollTo(0, 300));
      const before = await page.locator("main").boundingBox();
      const position = await page
        .locator("header")
        .evaluate((element) => getComputedStyle(element).position);
      // Locator.click scrolls sticky controls into view; use a real pointer
      // click so the harness does not create a scroll jump of its own.
      const trigger = await page
        .getByRole("button", { name: "Open search", exact: true })
        .boundingBox();
      await page.mouse.click(
        trigger.x + trigger.width / 2,
        trigger.y + trigger.height / 2,
      );
      expect((await page.locator("main").boundingBox()).y).toBe(before.y);
      await expect(page.locator("header")).toHaveCSS("position", position);
      const frames = await trace(
        page,
        () => page.getByPlaceholder("Enter a keyword").press("Escape"),
        600,
      );
      expect(
        frames.every(
          (frame) =>
            Math.abs(frame.mainY - before.y) < 1 && frame.scroll === 300,
        ),
      ).toBe(true);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Reduced motion, clearing, rapid typing and Enter retain search behavior", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await mount(page);
    const input = page.getByPlaceholder("Enter a keyword");
    await input.fill("a");
    await input.fill("ab");
    await input.fill("zzz");
    await expect(
      page.getByText("search.noResults", { exact: true }),
    ).toBeVisible();
    await input.fill("");
    await expect(
      page.getByText("Popular searches", { exact: true }),
    ).toBeVisible();
    await input.fill("a");
    await input.press("Enter");
    expect(await page.evaluate(() => window.fixtureNavigation)).toBe(
      "/search?q=a",
    );
  } finally {
    await browser.close();
  }
});

test("Reopening during the close animation starts with a fresh search input", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await mount(page);
    await page.getByPlaceholder("Enter a keyword").fill("a");
    await expect(
      page.getByRole("button", { name: "search.collections (10)" }),
    ).toBeVisible();
    await page.getByPlaceholder("Enter a keyword").press("Escape");
    const trigger = await page
      .getByRole("button", { name: "Open search", exact: true })
      .boundingBox();
    await page.mouse.click(
      trigger.x + trigger.width / 2,
      trigger.y + trigger.height / 2,
    );
    await expect(page.getByPlaceholder("Enter a keyword")).toHaveValue("");
    await expect(
      page.getByText("Popular searches", { exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Enter a keyword").fill("ab");
    await expect(
      page.getByRole("button", { name: "search.collections (10)" }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});

test("Opening and closing search keep the page in place and retain results throughout the exit", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await mount(page);
    await page.getByPlaceholder("Enter a keyword").press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const before = await page.locator("main").boundingBox();
    await page
      .getByRole("button", { name: "Open search", exact: true })
      .click();
    expect((await page.locator("main").boundingBox()).y).toBe(before.y);
    await page.getByPlaceholder("Enter a keyword").fill("a");
    await expect(
      page.getByRole("button", { name: "search.collections (10)" }),
    ).toBeVisible();
    const resultHeight = (await page.getByRole("dialog").boundingBox()).height;
    const frames = await trace(
      page,
      () => page.getByPlaceholder("Enter a keyword").press("Escape"),
      600,
    );
    expect(frames.every((frame) => Math.abs(frame.mainY - before.y) < 1)).toBe(
      true,
    );
    expect(
      frames
        .filter((frame) => frame.height !== undefined)
        .every((frame) => Math.abs(frame.height - resultHeight) < 1),
    ).toBe(true);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Open search", exact: true })
      .click();
    await expect(
      page.getByText("Popular searches", { exact: true }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});
