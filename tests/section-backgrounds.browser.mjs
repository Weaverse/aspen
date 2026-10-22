import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
    loader: "tsx",
    resolveDir: root,
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {createMemoryRouter,RouterProvider} from 'react-router';
      import Collections from './app/sections/collection-list-dynamic';
      import Products from './app/sections/featured-products';
      import Product from './app/sections/single-product';
      import Promotion from './app/sections/promotion-grid';
      import PromotionSlider from './app/sections/promotion-grid/grid-items';
      import Video from './app/sections/video-embed';
      import Stores from './app/sections/contact-stores';
      import Map from './app/sections/map/map';
      import Accordion from './app/sections/accordion';
      import Instagram from './app/sections/instagram';
      import TextImage from './app/sections/image-with-text';
      const components={collections:Collections,products:Products,product:Product,promotion:Promotion,video:Video,stores:Stores,map:Map,accordion:Accordion,instagram:Instagram,textImage:TextImage};
      const root=createRoot(document.getElementById('root'));
      window.renderSection=(kind,props={})=>{
        const Component=components[kind];
        const content=<div style={{minHeight:120}}>Merchant content</div>;
        root.render(<RouterProvider router={createMemoryRouter([{id:'root',path:'/',element:
          <Component data-testid='subject' width='fixed' verticalPadding='small' {...props}>
            {kind==='promotion'?<PromotionSlider showArrows={false} showDots={false}><div tabLabel='One' tabParagraphContent='Merchant content' style={{height:120}}>Card</div></PromotionSlider>:content}
          </Component>}])}/>);
      };
    `,
  },
  bundle: true,
  outfile: "fixture.js",
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "cms-boundaries",
      setup(builder) {
        if (process.env.TEST_BASELINE_REF) {
          // Reproduce the former opaque Style 1 shell without touching disk.
          builder.onLoad(
            { filter: /sections\/promotion-grid\/(index|grid-items)\.tsx$/ },
            ({ path }) => ({
              loader: "tsx",
              contents: execFileSync(
                "git",
                [
                  "show",
                  `${process.env.TEST_BASELINE_REF}:${path.slice(root.length)}`,
                ],
                { cwd: root, encoding: "utf8" },
              ),
            }),
          );
        }
        builder.onResolve(
          {
            filter:
              /^@weaverse\/hydrogen$|^~\/hooks\/(use-animation|use-translated-text)$|^~\/components\/image$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "tsx",
          resolveDir: root,
          contents:
            path === "@weaverse/hydrogen"
              ? `export const createSchema=v=>v;export const IMAGES_PLACEHOLDERS={};export const useTranslation=()=>({t:key=>key});export const useThemeSettings=()=>({});export const useChildInstances=()=>[];export const useParentInstance=()=>null;export const useItemInstance=()=>null;export const useWeaverse=()=>({});`
              : path.endsWith("use-animation")
                ? `import {useRef} from 'react';export const useAnimation=ref=>[useRef(null)];`
                : path.endsWith("use-translated-text")
                  ? `export const useTranslatedText=()=>value=>value;`
                  : `import React from 'react';export const Image=React.forwardRef(({data,className},ref)=><div ref={ref} className={className} />);`,
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
const cases = [
  ["collections", { layout: "grid" }],
  ["collections", { layout: "slider" }],
  ["collections", { layout: "showcase" }],
  ["products", { layout: "grid" }],
  ["products", { layout: "carousel" }],
  ["product", {}],
  ["promotion", { layout: "slider" }],
  ["promotion", { layout: "tabs" }],
  ["video", {}],
  ["stores", {}],
  ["map", { layoutMap: "list" }],
  ["map", { layoutMap: "accordion" }],
  ["accordion", { accordionLayout: "column" }],
  ["accordion", { accordionLayout: "row" }],
  ["instagram", {}],
  ["textImage", { layout: "split" }],
  ["textImage", { layout: "overlay" }],
];

test("parent backgrounds always cover the section, including legacy content-scope values", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", (route) => route.abort());
      await page.setContent(`<style>${css}</style><div id='root'></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const [kind, options] of cases) {
        for (const backgroundFor of ["section", "content"]) {
          await page.evaluate(
            ({ kind: sectionKind, props }) =>
              window.renderSection(sectionKind, props),
            {
              kind,
              props: {
                ...options,
                backgroundColor: "#123456",
                backgroundFor,
                backgroundImage: {
                  url: "https://merchant.example/background.jpg",
                  width: 1000,
                  height: 400,
                },
                backgroundFit: "contain",
                backgroundPosition: "bottom right",
              },
            },
          );
          const subject = page.getByTestId("subject");
          await expect(subject).toBeAttached();
          const target = subject;
          await expect(target).toHaveCSS("background-color", "rgb(18, 52, 86)");
          const image = target.locator(":scope > img");
          await expect(image).toHaveCount(1);
          await expect(image).toHaveCSS("object-fit", "contain");
          await expect(image).toHaveCSS("object-position", "100% 100%");
          const geometry = await target.evaluate((el) => {
            const mediaElement = el.querySelector(":scope > img");
            const box = el.getBoundingClientRect(),
              media = mediaElement.getBoundingClientRect();
            return {
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              imageLeft: media.left,
              imageTop: media.top,
              imageWidth: media.width,
              imageHeight: media.height,
            };
          });
          for (const [box, media] of [
            ["left", "imageLeft"],
            ["top", "imageTop"],
            ["width", "imageWidth"],
            ["height", "imageHeight"],
          ]) {
            assert.ok(
              Math.abs(geometry[box] - geometry[media]) < 1,
              `${kind}/${backgroundFor}/${width}: ${JSON.stringify(geometry)}`,
            );
          }
          if (kind === "promotion" && options.layout === "slider") {
            await expect(
              subject.locator(".promotion-slider").locator(".."),
            ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          }
          if (kind === "stores") {
            await expect(subject.locator("section")).toHaveCSS(
              "background-color",
              "rgba(0, 0, 0, 0)",
            );
          }
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("requested defaults apply without replacing saved colors or explicit transparency", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div id='root'></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const [kind, props, color] of [
      ["products", { layout: "grid" }, "rgb(255, 255, 255)"],
      ["products", { layout: "carousel" }, "rgb(255, 255, 255)"],
      ["stores", {}, "rgb(255, 255, 255)"],
      ["instagram", {}, "rgb(237, 237, 237)"],
      ["textImage", { layout: "split" }, "rgb(219, 219, 219)"],
      ["textImage", { layout: "overlay" }, "rgb(219, 219, 219)"],
      ["accordion", { accordionLayout: "column" }, "rgb(234, 234, 234)"],
      ["accordion", { accordionLayout: "row" }, "rgb(234, 234, 234)"],
      ["map", { layoutMap: "list" }, "rgb(249, 249, 249)"],
      ["map", { layoutMap: "accordion" }, "rgb(249, 249, 249)"],
    ]) {
      await page.evaluate(
        ({ kind: sectionKind, props: sectionProps }) =>
          window.renderSection(sectionKind, sectionProps),
        { kind, props },
      );
      await expect(page.getByTestId("subject")).toHaveCSS(
        "background-color",
        color,
      );
      await page.evaluate(
        ({ kind: sectionKind, props: sectionProps }) =>
          window.renderSection(sectionKind, {
            ...sectionProps,
            backgroundColor: "#F0F0EF",
          }),
        { kind, props },
      );
      await expect(page.getByTestId("subject")).toHaveCSS(
        "background-color",
        "rgb(240, 240, 239)",
      );
      await page.evaluate(
        ({ kind: sectionKind, props: sectionProps }) =>
          window.renderSection(sectionKind, {
            ...sectionProps,
            backgroundColor: "transparent",
          }),
        { kind, props },
      );
      await expect(page.getByTestId("subject")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    }
  } finally {
    await browser.close();
  }
});

test("Accordion and Map preserve Remove Color and saved empty backgrounds at every breakpoint", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.setContent(`<style>${css}</style><div id='root'></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const [kind, options] of cases.filter(([sectionKind]) =>
        ["accordion", "map"].includes(sectionKind),
      )) {
        // Mount an already-cleared section, then reproduce selecting and removing a color.
        for (const backgroundColor of ["", "#123456", ""]) {
          await page.evaluate(
            ({ kind: sectionKind, props }) =>
              window.renderSection(sectionKind, props),
            { kind, props: { ...options, backgroundColor } },
          );
          await expect(page.getByTestId("subject")).toHaveCSS(
            "background-color",
            backgroundColor ? "rgb(18, 52, 86)" : "rgba(0, 0, 0, 0)",
          );
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Promotion Grid image-only backgrounds show through and clearing restores its legacy shell", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(`<style>${css}</style><div id='root'></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const configured of [false, true, false]) {
      await page.evaluate(
        (value) =>
          window.renderSection("promotion", {
            layout: "slider",
            backgroundImage: value
              ? {
                  url: "https://merchant.example/section.jpg",
                  width: 1000,
                  height: 400,
                }
              : null,
          }),
        configured,
      );
      const subject = page.getByTestId("subject");
      await expect(
        subject.locator(".promotion-slider").locator(".."),
      ).toHaveCSS(
        "background-color",
        configured ? "rgba(0, 0, 0, 0)" : "rgb(240, 240, 239)",
      );
      await expect(subject.locator(":scope > img")).toHaveCount(
        configured ? 1 : 0,
      );
    }
  } finally {
    await browser.close();
  }
});
