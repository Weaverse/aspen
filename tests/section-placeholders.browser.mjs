import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    loader: "tsx",
    resolveDir: root,
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {createMemoryRouter, RouterProvider} from 'react-router';
      import Gallery from './app/sections/image-gallery/image';
      import Instagram from './app/sections/instagram/image';
      import Column from './app/sections/columns-with-images/column';
      import TextImage from './app/sections/image-with-text/image';
      import HotspotImage from './app/sections/hotspots/hotpots-image';
      import TestimonialImage from './app/sections/testimonials/hotspot-item';
      import BeforeAfter from './app/sections/before-and-after/slider';
      import Hero from './app/sections/hero-image';
      import HeroVideo from './app/sections/hero-video';
      import VideoEmbed from './app/sections/video-embed/video';
      import Video from './app/sections/videos/video';
      import Promotion from './app/sections/promotion-grid/item';
      import {MapFrame} from './app/sections/map/map';
      import CollectionList from './app/sections/collection-list-dynamic';
      import CollectionItems from './app/sections/collection-list-dynamic/collection-items';
      const root = createRoot(document.getElementById('root'));
      window.requests=[];
      window.fetch=async path=>{window.requests.push(path);return {ok:true,json:async()=>({count:12})}};
      window.renderBlock=(kind, image)=>{
        const blocks={
          gallery:<Gallery src={image}/>, instagram:<Instagram image={image}/>,
          column:<Column imageSrc={image}/>, textImage:<TextImage image={image}/>,
          hotspots:<HotspotImage image={image}/>, testimonials:<TestimonialImage image={image}/>,
          beforeAfter:<BeforeAfter beforeImage1={image} afterImage2={image}/>,
          hero:<Hero backgroundImage={image}><span>Content</span></Hero>,
          heroVideo:<HeroVideo posterImage={image} mobilePosterImage={{url:''}} height='aspen'/>,
          embed:<VideoEmbed/>, video:<Video/>, promotion:<Promotion backgroundImage={image}/>,
          map:<MapFrame address=''/>,
        };
        root.render(<RouterProvider router={createMemoryRouter([{id:'root',path:'/',element:blocks[kind]}])}/>);
      };
      window.renderCollections=(selected=false)=>{
        const data=selected?[{id:'gid://shopify/Collection/123',handle:'selected',title:'Selected collection',image:{url:'https://merchant.example/selected.jpg',width:800,height:600}}]:[];
        root.render(<RouterProvider router={createMemoryRouter([{id:'root',path:'/',element:<CollectionList layout='slider'><CollectionItems layout='slider' loaderData={data}/></CollectionList>}])}/>);
      };
      window.renderEmbed=(videoUrl)=>root.render(<VideoEmbed videoUrl={videoUrl}/>);
      window.renderMap=(address)=>root.render(<MapFrame address={address}/>);
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  outfile: "fixture.js",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "section-boundaries",
      setup(builder) {
        if (process.env.TEST_BASELINE_REF) {
          builder.onLoad(
            {
              filter:
                /sections\/collection-list-dynamic\/collection-items\.tsx$/,
            },
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
              /^@weaverse\/hydrogen$|^~\/components\/(image|section)$|^~\/hooks\/use-animation$|^react-intersection-observer$|^react-player$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          loader: "tsx",
          resolveDir: root,
          contents:
            path === "@weaverse/hydrogen"
              ? `export const IMAGES_PLACEHOLDERS=${JSON.stringify(IMAGES_PLACEHOLDERS)};export const createSchema=v=>v;export const useTranslation=()=>({t:key=>key});export const useThemeSettings=()=>({});export const useChildInstances=()=>[];export const useParentInstance=()=>null;export const useItemInstance=()=>null;export const useWeaverse=()=>({});`
              : path.endsWith("/image")
                ? `import React from 'react';export const Image=React.forwardRef(({data,alt,...props},ref)=><img ref={ref} src={data?.url} alt={alt??data?.altText??''} data-width={data?.width}/>);`
                : path.endsWith("/section")
                  ? `import React from 'react';export const layoutInputs=[];export const sectionSettings=[];export const Section=React.forwardRef(({children,backgroundImage},ref)=><section ref={ref}>{backgroundImage&&<img src={typeof backgroundImage==='string'?backgroundImage:backgroundImage.url}/>}<div>{children}</div></section>);`
                  : path.endsWith("use-animation")
                    ? `import {useRef} from 'react';export const useAnimation=()=>[useRef(null)];`
                    : path === "react-intersection-observer"
                      ? `export const useInView=()=>({ref:()=>{},inView:true});`
                      : `export default function Player(){return null;}`,
        }));
      },
    },
  ],
});

test("unselected and cleared section images render official placeholders, not demo media", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.route("**/*", (route) => route.abort());
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({
        content: bundle.outputFiles.find((f) => f.path.endsWith(".js")).text,
      });
      for (const kind of [
        "gallery",
        "instagram",
        "column",
        "textImage",
        "hotspots",
        "testimonials",
        "beforeAfter",
        "hero",
        "heroVideo",
        "embed",
        "video",
        "promotion",
        "map",
      ]) {
        for (const empty of [undefined, null, "", { url: "" }]) {
          await page.evaluate(
            ({ kind: block, empty: value }) => window.renderBlock(block, value),
            { kind, empty },
          );
          await expect(page.locator("#root img").first()).toBeAttached();
          const sources = await page
            .locator("#root img")
            .evaluateAll((nodes) =>
              nodes.map((node) => node.getAttribute("src")),
            );
          assert.ok(
            sources.length > 0 &&
              sources.every((src) =>
                Object.values(IMAGES_PLACEHOLDERS).includes(src?.split("?")[0]),
              ),
            `${kind} ${width}px: ${sources}`,
          );
          await expect(page.locator("#root iframe, #root video")).toHaveCount(
            0,
          );
        }
      }
      const image = {
        id: "custom",
        url: "https://merchant.example/custom.jpg",
        altText: "Custom alt",
        width: 1200,
        height: 800,
      };
      for (const kind of [
        "gallery",
        "instagram",
        "column",
        "textImage",
        "hotspots",
        "testimonials",
        "beforeAfter",
        "hero",
        "heroVideo",
        "promotion",
      ]) {
        await page.evaluate(
          ({ kind: block, image: value }) => window.renderBlock(block, value),
          { kind, image },
        );
        await expect
          .poll(async () =>
            (
              await page.locator("#root img").first().getAttribute("src")
            )?.startsWith(image.url),
          )
          .toBe(true);
      }
      await page.evaluate(() =>
        window.renderEmbed("https://merchant.example/video"),
      );
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        "https://merchant.example/video",
      );
      await page.evaluate(() => window.renderMap("Merchant address"));
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        /q=Merchant%20address/,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("placeholder collections do not request a real collection product count", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({
      content: bundle.outputFiles.find((f) => f.path.endsWith(".js")).text,
    });
    await page.evaluate(() => window.renderCollections());
    await expect(page.locator(".swiper-slide")).toHaveCount(4);
    await expect
      .poll(() => page.evaluate(() => window.requests.length))
      .toBe(0);
    await page.evaluate(() => window.renderCollections(true));
    await expect
      .poll(() => page.evaluate(() => window.requests.length))
      .toBe(1);
    assert.match(
      await page.evaluate(() => window.requests[0]),
      /\/api\/collection\/selected\/product-count/,
    );
  } finally {
    await browser.close();
  }
});
