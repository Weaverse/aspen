import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";
import { DESKTOP_MIN_PX, TABLET_MAX_PX } from "./responsive-test-widths.mjs";

// Layout tests stub media; fit regressions use the real Image and Hydrogen img.
const root = fileURLToPath(new URL("../", import.meta.url));
const buildFixture = (realImage = false) =>
  build({
    stdin: {
      contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import ImageWithText, { schema } from "./app/sections/image-with-text";
      import ImageWithTextImage, {schema as imageSchema} from "./app/sections/image-with-text/image";
      import ImageWithTextImages, {schema as imagesSchema} from "./app/sections/image-with-text/images";
      import ImageWithTextContent from "./app/sections/image-with-text/content";
      import Heading from "./app/components/heading";
      import Paragraph from "./app/components/paragraph";
      import Link from "./app/components/link";
      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.imagesSchema = imagesSchema;
      window.imageSchema = imageSchema;
      window.renderSection = ({reverseChildren=false,imageCount=1,legacyImages,contentPosition="top left",buttonAlignment,headingAlignment="left",paragraphAlignment="left",paragraphWidth="full",...props}) => {
        window.legacyImages = legacyImages ?? Array.from({length:imageCount},()=>({image:{url:"fixture.jpg"},borderRadius:20}));
        const content=React.createElement(ImageWithTextContent,{key:"content",contentPosition,buttonAlignment},
          React.createElement(Heading,{as:"h2",content:"Fixture heading",alignment:headingAlignment}),
          React.createElement(Paragraph,{content:"Fixture paragraph with enough content to demonstrate width and alignment settings.",alignment:paragraphAlignment,width:paragraphWidth}),
          React.createElement(Link,{text:"Explore now",variant:"decor",to:"/collections"}));
        const media=React.createElement(ImageWithTextImages,{key:"media",imageAspectRatio:"1/1"},
          window.legacyImages.map((image,i)=>React.createElement(ImageWithTextImage,{key:i,...image})));
        root.render(React.createElement(ImageWithText,props,...(reverseChildren?[media,content]:[content,media])));
      };
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
        name: "section-fixture",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(@weaverse\/hydrogen|react-router|~\/components\/(section|background-image|image)|~\/hooks\/use-translated-text)$/,
            },
            ({ path, importer }) =>
              importer.includes("/node_modules/") ||
              (realImage && path === "~/components/image")
                ? undefined
                : { path, namespace: "fixture" },
          );
          builder.onLoad(
            { filter: /.*/, namespace: "fixture" },
            ({ path }) => ({
              contents:
                path === "@weaverse/hydrogen"
                  ? "export const createSchema = (schema) => schema;export const IMAGES_PLACEHOLDERS={image:'/placeholder.svg'};export const useTranslation=()=>({t:key=>key});export const useThemeSettings=()=>({});"
                  : path === "react-router"
                    ? `import React from "react";export const useRouteLoaderData=()=>({});export const Link=React.forwardRef(({to,viewTransition,...props},ref)=><a ref={ref} href={to} {...props}/>);`
                    : path.endsWith("use-translated-text")
                      ? "export const useTranslatedText=()=>value=>value;"
                      : path.endsWith("background-image")
                        ? "export const backgroundInputs = [];export const sectionBackgroundInputs = () => [];"
                        : path.endsWith("/image")
                          ? `import React from "react";export const Image=React.forwardRef(({className,data},ref)=><div ref={ref} data-image-url={data.url} className={className} style={{height:100}}/>);`
                          : `import React from "react";
               export const Section = React.forwardRef(({children, containerClassName, className, style, "data-media-position": position}, ref) =>
                 React.createElement("section", {ref, className, style, "data-media-position": position},
                   React.createElement("div", {className: containerClassName}, children)));`,
              loader: "tsx",
              resolveDir: root,
            }),
          );
        },
      },
    ],
  });
const bundle = await buildFixture();
const realImageBundle = await buildFixture(true);

const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  { base: `${root}app/styles`, onDependency: () => undefined },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);

const arrangements = ["left", "right"].flatMap((mediaPosition) =>
  ["top", "bottom"].flatMap((mobileMediaPosition) =>
    [false, true].map((reverseChildren) => ({
      mediaPosition,
      mobileMediaPosition,
      reverseChildren,
    })),
  ),
);

async function mountRealImages(page) {
  await page.route("https://cdn.shopify.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="tan"/></svg>',
    }),
  );
  await page.setContent(
    `<!doctype html><style>${css}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: realImageBundle.outputFiles[0].text });
}

const imageFixture = {
  url: "https://cdn.shopify.com/s/files/1/0000/0001/files/fit-fixture.png",
  width: 800,
  height: 400,
  altText: "Fit fixture",
};

test("Parent fit controls reach the real nested img in both styles at mobile, tablet and desktop widths", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await mountRealImages(page);
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const layout of ["overlay", "split"]) {
        let coverBounds;
        for (const fit of ["cover", "contain", "cover"]) {
          await page.evaluate((props) => window.renderSection(props), {
            layout,
            imageCount: 0,
            image1: imageFixture,
            image2: imageFixture,
            image1ObjectFit: fit,
            image2ObjectFit: fit,
          });
          const images = page.locator('img[data-motion="slide-in"]');
          await expect(images).toHaveCount(layout === "overlay" ? 2 : 1);
          const bounds = [];
          for (const image of await images.all()) {
            await expect(image).toHaveCSS("object-fit", fit);
            await expect(image).toHaveAttribute("alt", "Fit fixture");
            bounds.push(
              await image.evaluate((img) => {
                const box = img.parentElement.getBoundingClientRect();
                return { width: box.width, height: box.height };
              }),
            );
          }
          if (coverBounds) {
            expect(bounds).toEqual(coverBounds);
          } else {
            coverBounds = bounds;
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test("Real image fit preserves legacy fallback, parent precedence, other inline styles and the default cover", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await mountRealImages(page);
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const layout of ["overlay", "split"]) {
        const legacyImages = [
          {
            image: imageFixture,
            objectFit: "contain",
            style: { objectPosition: "left top", opacity: 0.75 },
          },
        ];
        await page.evaluate((props) => window.renderSection(props), {
          layout,
          legacyImages,
        });
        const image = page.locator('img[data-motion="slide-in"]').first();
        await expect(image).toHaveCSS("object-fit", "contain");
        await expect(image).toHaveCSS("object-position", "0% 0%");
        await expect(image).toHaveCSS("opacity", "0.75");
        await page.evaluate((props) => window.renderSection(props), {
          layout,
          legacyImages,
          image1ObjectFit: "cover",
        });
        await expect(image).toHaveCSS("object-fit", "cover");
        await expect(image).toHaveCSS("object-position", "0% 0%");
        await expect(image).toHaveCSS("opacity", "0.75");
        await page.evaluate((props) => window.renderSection(props), {
          layout,
          legacyImages: [
            { image: imageFixture, style: { objectFit: "contain" } },
          ],
        });
        await expect(image).toHaveCSS("object-fit", "contain");
        await page.evaluate((props) => window.renderSection(props), {
          layout,
          legacyImages: [{ image: imageFixture }],
        });
        await expect(image).toHaveCSS("object-fit", "cover");
      }
    }
  } finally {
    await browser.close();
  }
});

test("legacy image controls explain parent precedence without warning on new controls", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const help = await page.evaluate(() => ({
      legacy: window.imageSchema.settings
        .flatMap((group) => group.inputs)
        .map((input) => input.helpText),
      parent: window.schema.settings
        .flatMap((group) => group.inputs)
        .filter((input) => /^image[12]/.test(input.name))
        .map((input) => input.helpText ?? ""),
    }));
    for (const text of help.legacy) {
      assert.match(
        text ?? "",
        /parent section's Images settings take priority/,
      );
      assert.match(text, /Style 2 only displays the first image/);
    }
    assert.ok(help.parent.every((text) => !text.includes("take priority")));
  } finally {
    await browser.close();
  }
});

test("image controls replace new child images and hide the second slot in Style 2", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const settings = await page.evaluate(() => ({
      childTypes: window.imagesSchema.childTypes ?? [],
      children: window.imagesSchema.presets.children ?? [],
      legacyEnabled: window.imageSchema.enabled,
      secondControls: window.schema.settings
        .flatMap((group) => group.inputs)
        .filter((input) => input.name.startsWith("image2"))
        .map((input) => ({
          name: input.name,
          split: input.condition({ layout: "split" }),
          overlay: input.condition({ layout: "overlay" }),
        })),
    }));
    assert.deepEqual(settings.childTypes, []);
    assert.deepEqual(settings.children, []);
    assert.equal(settings.legacyEnabled, false);
    assert.equal(settings.secondControls.length, 3);
    for (const control of settings.secondControls) {
      assert.equal(control.split, false);
      assert.equal(control.overlay, true);
    }
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const config = {
        imageCount: 0,
        image1: { url: "/first.jpg" },
        image2: { url: "/second.jpg" },
        image1BorderRadius: 12,
        image2BorderRadius: 20,
        image1ObjectFit: "contain",
        image2ObjectFit: "cover",
      };
      for (const layout of ["overlay", "split", "overlay"]) {
        await page.evaluate((props) => window.renderSection(props), {
          ...config,
          layout,
        });
        await expect(page.locator("[data-image-url]")).toHaveCount(
          layout === "split" ? 1 : 2,
        );
        await expect(page.locator("[data-image-url]").first()).toHaveAttribute(
          "data-image-url",
          "/first.jpg",
        );
        if (layout === "overlay") {
          await expect(page.locator("[data-image-url]").nth(1)).toHaveAttribute(
            "data-image-url",
            "/second.jpg",
          );
        }
      }
      await page.evaluate(() =>
        window.renderSection({ layout: "split", imageCount: 0, image1: null }),
      );
      await expect(page.locator("[data-image-url]")).toHaveAttribute(
        "data-image-url",
        "/placeholder.svg",
      );
    }
  } finally {
    await browser.close();
  }
});

test("parent image controls preserve legacy data and override saved defaults, zero and clears", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const legacyImages = [
      {
        image: { url: "/legacy-1.jpg" },
        borderRadius: 20,
        objectFit: "contain",
      },
      { image: { url: "/legacy-2.jpg" }, borderRadius: 12, objectFit: "cover" },
    ];
    await page.evaluate((props) => window.renderSection(props), {
      layout: "overlay",
      legacyImages,
    });
    await expect(page.locator("[data-image-url]").first()).toHaveAttribute(
      "data-image-url",
      "/legacy-1.jpg",
    );
    await expect(page.locator("[data-image-url]").nth(1)).toHaveAttribute(
      "data-image-url",
      "/legacy-2.jpg",
    );
    await page.evaluate((props) => window.renderSection(props), {
      layout: "overlay",
      legacyImages: [
        legacyImages[0],
        { ...legacyImages[1], image: { url: "/edited-legacy-2.jpg" } },
      ],
      image1: { url: "/parent-1.jpg" },
    });
    await expect(page.locator("[data-image-url]").first()).toHaveAttribute(
      "data-image-url",
      "/parent-1.jpg",
    );
    await expect(page.locator("[data-image-url]").nth(1)).toHaveAttribute(
      "data-image-url",
      "/edited-legacy-2.jpg",
    );
    await page.evaluate((props) => window.renderSection(props), {
      layout: "overlay",
      legacyImages,
      image1: null,
      image1BorderRadius: 0,
      image1ObjectFit: "cover",
    });
    const first = page.locator("[data-image-url]").first();
    await expect(first).toHaveAttribute("data-image-url", "/placeholder.svg");
    await expect(first).toHaveCSS("border-radius", "0px");
    await expect(page.locator("[data-image-url]").nth(1)).toHaveAttribute(
      "data-image-url",
      "/legacy-2.jpg",
    );
    const defaults = await page.evaluate(() =>
      window.schema.settings
        .flatMap((group) => group.inputs)
        .filter((input) => /^image[12]/.test(input.name))
        .map((input) => input.defaultValue),
    );
    assert.ok(defaults.every((value) => value === undefined));
  } finally {
    await browser.close();
  }
});

test("Image with text honors heading and paragraph alignment independently of content position", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const layout of ["split", "overlay"]) {
        for (const alignment of ["left", "center", "right"]) {
          const paragraphAlignment = alignment === "left" ? "right" : "left";
          await page.evaluate((props) => window.renderSection(props), {
            layout,
            contentPosition: "bottom center",
            headingAlignment: alignment,
            paragraphAlignment,
          });
          const heading = page.locator(".heading");
          const paragraph = page.locator(".paragraph");
          await expect(heading).toHaveCSS("text-align", alignment);
          await expect(paragraph).toHaveCSS("text-align", paragraphAlignment);
          const content = page.locator("[data-content-layout]");
          const innerWidth = await content.evaluate(
            (el) =>
              el.clientWidth -
              parseFloat(getComputedStyle(el).paddingLeft) -
              parseFloat(getComputedStyle(el).paddingRight),
          );
          assert.ok(
            Math.abs((await heading.boundingBox()).width - innerWidth) < 1,
            "Heading needs full content width for its alignment to be visible",
          );
          await expect(content).toHaveCSS("justify-content", "flex-end");
          await expect(content).toHaveCSS("align-items", "center");
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Image with text honors Full and Narrow paragraph widths", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const layout of ["split", "overlay"]) {
        await page.evaluate(
          (value) =>
            window.renderSection({ layout: value, paragraphWidth: "full" }),
          layout,
        );
        const full = (await page.locator(".paragraph").boundingBox()).width;
        await page.evaluate(
          (value) =>
            window.renderSection({ layout: value, paragraphWidth: "narrow" }),
          layout,
        );
        const narrow = (await page.locator(".paragraph").boundingBox()).width;
        const maxWidth = await page
          .locator(".paragraph")
          .evaluate((el) => Number.parseFloat(getComputedStyle(el).maxWidth));
        const expectedRatio =
          width < 768 ? 1 : width < DESKTOP_MIN_PX ? 0.5 : 0.75;
        const expectedWidth = Math.min(full * expectedRatio, maxWidth);
        assert.ok(
          Math.abs(narrow - expectedWidth) < 1,
          `${layout} ${width}px: Narrow width ${narrow} must honor its responsive width and max-width (${expectedWidth})`,
        );
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("Image with text button alignment is independent and defaults to content position", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const layout of ["split", "overlay"]) {
        for (const buttonAlignment of ["left", "center", "right", "auto"]) {
          await page.evaluate((props) => window.renderSection(props), {
            layout,
            buttonAlignment,
            contentPosition: "bottom right",
            headingAlignment: "left",
            paragraphAlignment: "center",
          });
          const button = page.getByRole("link", { name: "Explore now" });
          const expected = {
            left: "flex-start",
            center: "center",
            right: "flex-end",
            auto: "flex-end",
          }[buttonAlignment];
          await expect(button).toHaveCSS("align-self", expected);
          await expect(page.locator(".heading")).toHaveCSS(
            "text-align",
            "left",
          );
          await expect(page.locator(".paragraph")).toHaveCSS(
            "text-align",
            "center",
          );
          const content = page.locator("[data-content-layout]");
          const area = await content.evaluate((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              left: r.left + parseFloat(s.paddingLeft),
              right: r.right - parseFloat(s.paddingRight),
            };
          });
          const bounds = await button.boundingBox();
          const expectedX =
            buttonAlignment === "left"
              ? area.left
              : buttonAlignment === "center"
                ? (area.left + area.right - bounds.width) / 2
                : area.right - bounds.width;
          assert.ok(
            Math.abs(bounds.x - expectedX) < 1,
            `${layout} ${width}px ${buttonAlignment}: button must move to the selected position`,
          );
          await expect(button).toHaveAttribute("href", "/collections");
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("parent controls responsive image order and mobile radius", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const {
        mediaPosition,
        mobileMediaPosition,
        reverseChildren,
      } of arrangements) {
        await page.evaluate((props) => window.renderSection(props), {
          layout: "split",
          mediaPosition,
          mobileMediaPosition,
          mobileImageRadius: 14,
          reverseChildren,
        });
        const media = page.locator(".iwt-split-media");
        const content = page.locator('[data-content-layout="split"]');
        const expectedOrder =
          width < 768
            ? mobileMediaPosition === "top"
              ? "-1"
              : "1"
            : mediaPosition === "left"
              ? "-1"
              : "1";
        await expect(media).toHaveCSS("order", expectedOrder);
        const mediaBounds = await media.boundingBox();
        const contentBounds = await content.boundingBox();
        assert.ok(mediaBounds && contentBounds);
        if (width < 768) {
          assert.equal(
            mediaBounds.y < contentBounds.y,
            mobileMediaPosition === "top",
          );
        } else {
          assert.equal(
            mediaBounds.x < contentBounds.x,
            mediaPosition === "left",
          );
          const section = await page.locator("section").boundingBox();
          assert.ok(
            Math.abs(
              mediaPosition === "left"
                ? mediaBounds.x - section.x
                : mediaBounds.x + mediaBounds.width - section.x - section.width,
            ) < 1,
          );
        }
        const image = media.locator(":scope > div");
        const leftRadius =
          width < 768 ? "14px" : mediaPosition === "left" ? "0px" : "20px";
        const rightRadius =
          width < 768 ? "14px" : mediaPosition === "right" ? "0px" : "20px";
        await expect(image).toHaveCSS("border-top-left-radius", leftRadius);
        await expect(image).toHaveCSS("border-bottom-left-radius", leftRadius);
        await expect(image).toHaveCSS("border-top-right-radius", rightRadius);
        await expect(image).toHaveCSS(
          "border-bottom-right-radius",
          rightRadius,
        );
      }
      await page.evaluate(() =>
        window.renderSection({
          layout: "overlay",
          imageCount: 2,
          mobileImageRadius: 14,
        }),
      );
      await expect(
        page.locator('[data-content-layout="overlay"]'),
      ).toBeVisible();
      await expect(page.locator(".iwt-split-row")).toHaveCount(0);
      const images = page.locator(
        "section > div > div:not([data-content-layout]) > div",
      );
      await expect(images).toHaveCount(2);
      for (const image of await images.all()) {
        await expect(image).toHaveCSS(
          "border-radius",
          width < 768 ? "14px" : "20px",
        );
      }
      const controls = await page.evaluate(() => {
        const inputs = window.schema.settings.flatMap((group) => group.inputs);
        const position = inputs.find(
          (input) => input.name === "mobileMediaPosition",
        );
        return {
          defaultPosition: position.defaultValue,
          split: position.condition({ layout: "split" }),
          overlay: position.condition({ layout: "overlay" }),
          radius: inputs.find((input) => input.name === "mobileImageRadius")
            .defaultValue,
        };
      });
      assert.deepEqual(controls, {
        defaultPosition: "top",
        split: true,
        overlay: false,
        radius: 0,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
test("split spacing toggle and right corners preserve other layouts and breakpoints", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 767, 768, TABLET_MAX_PX, DESKTOP_MIN_PX, 1520]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      for (const mediaPosition of ["right", "left"]) {
        await page.evaluate(
          (position) =>
            window.renderSection({ layout: "split", mediaPosition: position }),
          mediaPosition,
        );
        const row = page.locator(".iwt-split-row");
        await expect(row).toHaveCSS(
          "padding-top",
          width < 768 ? "0px" : "40px",
        );
        await expect(row).toHaveCSS(
          "padding-bottom",
          width < 768 ? "0px" : "40px",
        );
        const image = page.locator(".iwt-split-media > div");
        await expect(image).toHaveCSS(
          "border-top-left-radius",
          width < 768 || mediaPosition === "left" ? "0px" : "20px",
        );
        await expect(image).toHaveCSS(
          "border-bottom-left-radius",
          width < 768 || mediaPosition === "left" ? "0px" : "20px",
        );
        const rightRadius =
          width < 768 || mediaPosition === "right" ? "0px" : "20px";
        await expect(image).toHaveCSS("border-top-right-radius", rightRadius);
        await expect(image).toHaveCSS(
          "border-bottom-right-radius",
          rightRadius,
        );
        await page.evaluate(
          (position) =>
            window.renderSection({
              layout: "split",
              mediaPosition: position,
              showVerticalSpacing: false,
            }),
          mediaPosition,
        );
        await expect(row).toHaveCSS("padding-top", "0px");
        await expect(row).toHaveCSS("padding-bottom", "0px");
      }
      await page.evaluate(() =>
        window.renderSection({ layout: "overlay", showVerticalSpacing: false }),
      );
      await expect(page.locator(".iwt-split-row")).toHaveCount(0);
      await expect(
        page.locator("section > div > div:not([data-content-layout]) > div"),
      ).toHaveCSS("border-top-right-radius", width < 768 ? "0px" : "20px");
      assert.equal(
        await page.evaluate(() => {
          const input = window.schema.settings[0].inputs.find(
            (setting) => setting.name === "showVerticalSpacing",
          );
          return (
            input.defaultValue === true &&
            input.condition({ layout: "split" }) &&
            !input.condition({ layout: "overlay" }) &&
            !input.condition({})
          );
        }),
        true,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("saved sections without new settings retain default order, radius, and legacy layouts", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 820]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<style>${css}</style><div id="root"></div>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderSection({ imageCount: 1 }));
      const media = page.locator(".iwt-split-media");
      const content = page.locator('[data-content-layout="split"]');
      await expect(media).toBeVisible();
      await expect(media).toHaveCSS("order", width < 768 ? "-1" : "1");
      const image = media.locator(":scope > div");
      await expect(image).toHaveCSS(
        "border-top-left-radius",
        width < 768 ? "0px" : "20px",
      );
      await expect(image).toHaveCSS("border-top-right-radius", "0px");
      const mediaBounds = await media.boundingBox();
      const contentBounds = await content.boundingBox();
      assert.ok(mediaBounds && contentBounds);
      assert.ok(
        width < 768
          ? mediaBounds.y < contentBounds.y
          : mediaBounds.x > contentBounds.x,
      );

      await page.evaluate(() => window.renderSection({ imageCount: 2 }));
      await expect(
        page.locator('[data-content-layout="overlay"]'),
      ).toBeVisible();
      await expect(page.locator(".iwt-split-row")).toHaveCount(0);
      await expect(
        page.locator("section > div > div:not([data-content-layout]) > div"),
      ).toHaveCount(2);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
