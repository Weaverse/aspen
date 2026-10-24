import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { generateDataFromSchema } from "@weaverse/hydrogen";
import { build } from "esbuild";

// Real parent/slider and theme CSS; CMS, outer Section and image adapters only are mocked.
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import Parent, { schema } from "./app/sections/before-and-after";
      const root = createRoot(document.getElementById("root"));
      window.sectionSchema = schema;
      window.renderCase = ({ parent = {}, legacy = null } = {}) => {
        window.legacyData = legacy;
        root.render(<Parent data-wv-id="parent" {...parent}>
          <h2>Legacy heading</h2><div data-wv-id="old-slider">Legacy slider</div>
        </Parent>);
      };
    `,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "~": `${root}app` },
  plugins: [
    {
      name: "cms-adapters",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /@weaverse\/hydrogen|@shopify\/hydrogen|components\/section$/,
          },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: path.includes("components/section")
            ? `import React from "react"; export const layoutInputs = [{name: "width", type: "select"}]; export const Section = React.forwardRef(({children, width, gap, verticalPadding, ...rest}, ref) => <section ref={ref} {...rest}>{children}</section>);`
            : path.includes("@shopify")
              ? `import React from "react"; export const Image = ({data, ...props}) => <img src={data.url} alt={data.altText} {...props} />;`
              : `export const useTranslation = () => ({t: key => key}); export const useChildInstances = () => window.legacyData ? [{data: {type: "before-after-slider", ...window.legacyData}}] : []; export const IMAGES_PLACEHOLDERS = {banner_1: {url: "/before.png"}, banner_2: {url: "/after.png"}};`,
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
const stylesheet = await compile(
  await readFile(`${root}app/styles/app.css`, "utf8"),
  {
    base: `${root}app/styles`,
    onDependency: () => undefined,
  },
);
const css = stylesheet.build(
  new Scanner({
    sources: [{ base: `${root}app`, pattern: "**/*.{ts,tsx}", negated: false }],
  }).scan(),
);
const browser = await chromium.launch();
test.after(() => browser.close());

async function render(width, data, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    ...options,
  });
  await page.setContent(`<style>${css}</style><div id="root"></div>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  // Match WeaverseHydrogenItem: schema defaults are merged before saved data.
  const schema = await page.evaluate(() => window.sectionSchema);
  await page.evaluate((config) => window.renderCase(config), {
    ...data,
    parent: { ...generateDataFromSchema(schema), ...data?.parent },
  });
  await expect(page.getByRole("slider")).toHaveCount(1);
  return page;
}

test("drag icon renders all three strokes with the same visual weight", async () => {
  for (const width of [390, 834, 1440]) {
    for (const scale of [1, 2]) {
      const page = await render(width, {}, { deviceScaleFactor: scale });
      const icon = page.getByRole("slider").locator('[aria-hidden="true"]');
      const bounds = await icon.boundingBox();
      assert.equal(bounds.width, 12);
      assert.equal(bounds.height, 15);
      await expect(icon.locator("..")).toHaveCSS("width", "40px");
      await expect(icon.locator("..")).toHaveCSS("height", "56px");
      const png = await page.screenshot({
        clip: {
          x: Math.floor(bounds.x) - 1,
          y: Math.floor(bounds.y) + 5,
          width: 16,
          height: 2,
        },
      });
      const strokes = await page.evaluate(
        async ({ data, dpr }) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          return [0, 5, 10].map((offset) =>
            Array.from(
              context.getImageData(offset * dpr, 0, 4 * dpr, canvas.height)
                .data,
            ),
          );
        },
        { data: png.toString("base64"), dpr: scale },
      );
      assert.deepEqual(
        strokes[0],
        strokes[1],
        `first and second strokes must match at ${width}px / ${scale}x`,
      );
      assert.deepEqual(
        strokes[1],
        strokes[2],
        `second and third strokes must match at ${width}px / ${scale}x`,
      );
      await page.close();
    }
  }
});

test("drag icon keeps the merchant color and remains decorative", async () => {
  const page = await render(834, {
    parent: { listColor: "#123456", separatorColor: "#ABCDEF" },
  });
  const icon = page.getByRole("slider").locator("svg");
  await expect(icon).toHaveCSS("stroke", "rgb(18, 52, 86)");
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await expect(icon).toHaveAttribute("focusable", "false");
  await expect(icon.locator("..")).toHaveCSS(
    "background-color",
    "rgb(171, 205, 239)",
  );
  await page.close();
});

test("cleared and transparent grip colors stay unpainted for parent and legacy settings", async () => {
  const cases = [
    { data: { parent: { listColor: "" } }, painted: false },
    { data: { legacy: { listColor: "" } }, painted: false },
    {
      data: { parent: { listColor: "" }, legacy: { listColor: "#123456" } },
      painted: false,
    },
    { data: { parent: { listColor: "transparent" } }, painted: false },
    { data: { parent: { listColor: "rgba(18, 52, 86, 0)" } }, painted: false },
    {
      data: { parent: { listColor: "rgba(18, 52, 86, 0.5)" } },
      painted: true,
      stroke: "rgba(18, 52, 86, 0.5)",
    },
    {
      data: { parent: { listColor: "#123456" } },
      painted: true,
      stroke: "rgb(18, 52, 86)",
    },
  ];
  for (const width of [390, 834, 1440]) {
    for (const { data, painted, stroke } of cases) {
      const page = await render(width, data);
      const icon = page.getByRole("slider").locator("svg");
      const png = await page.screenshot({ clip: await icon.boundingBox() });
      const paintedPixels = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] < 255 || pixels[i + 1] < 255 || pixels[i + 2] < 255) {
            count += 1;
          }
        }
        return count;
      }, png.toString("base64"));
      assert.equal(
        paintedPixels > 0,
        painted,
        `${JSON.stringify(data)} at ${width}px paints ${paintedPixels} pixels`,
      );
      if (stroke) {
        await expect(icon).toHaveCSS("stroke", stroke);
      }
      await page.close();
    }
  }
});

test("Before & After has no child types and all comparison settings belong to the parent", async () => {
  const page = await render(1440, {
    parent: { beforeImage1: "/new-before.png", afterImage2: "/new-after.png" },
  });
  const schema = await page.evaluate(() => window.sectionSchema);
  assert.equal(schema.childTypes, undefined);
  assert.equal(schema.presets.children, undefined);
  assert.ok(schema.presets.beforeImage1);
  assert.ok(schema.presets.afterImage2);
  const names = schema.settings.flatMap((group) =>
    group.inputs.map((input) => input.name),
  );
  for (const name of [
    "beforeImage1",
    "afterImage2",
    "separatorColor",
    "separatorWidth",
    "showList",
    "listColor",
    "heightMode",
    "sliderHeightDesktop",
    "sliderHeightMobile",
    "initialPositionDesktop",
    "initialPositionMobile",
  ]) {
    assert.ok(names.includes(name), `${name} must be editable on parent`);
  }
  await expect(page.locator('img[src="/new-before.png"]')).toHaveCount(1);
  await expect(page.locator('img[src="/new-after.png"]')).toHaveCount(1);
  await expect(page.getByRole("heading")).toHaveCount(0);
  await expect(page.locator('[data-wv-id="parent"]')).toHaveCount(1);
  await expect(page.locator('[data-wv-id="old-slider"]')).toHaveCount(0);
  await page.close();
});

test("saved child images/settings remain readable but only one internal slider renders", async () => {
  const page = await render(1440, {
    legacy: {
      beforeImage1: "/old-before.png",
      afterImage2: "/old-after.png",
      separatorWidth: 4,
      separatorColor: "#123456",
      listColor: "#654321",
      heightMode: "custom",
      sliderHeightDesktop: 700,
      sliderHeightMobile: 300,
      initialPositionDesktop: 37,
      initialPositionMobile: 27,
      showList: false,
    },
  });
  await expect(page.locator('img[src="/old-before.png"]')).toHaveCount(1);
  await expect(page.locator('img[src="/old-after.png"]')).toHaveCount(1);
  await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "37");
  await expect(page.getByRole("slider")).toHaveCSS("width", "4px");
  await expect(page.getByRole("slider")).toHaveCSS("height", "700px");
  assert.equal(
    await page
      .getByRole("slider")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--separator-color").trim(),
      ),
    "#123456",
  );
  await expect(
    page.getByRole("slider").locator('[aria-hidden="true"]'),
  ).toHaveCount(0);
  await expect(page.locator('[data-wv-id="old-slider"]')).toHaveCount(0);
  assert.equal(
    await page
      .getByRole("slider")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--list-color").trim(),
      ),
    "#654321",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.getByRole("slider")).toHaveCSS("height", "300px");
  await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "27");
  await page.close();
});

test("saved parent overrides equal to original defaults still win over legacy settings", async () => {
  const page = await render(1440, {
    parent: { showList: true, separatorWidth: 8, initialPositionDesktop: 51 },
    legacy: { showList: false, separatorWidth: 4, initialPositionDesktop: 37 },
  });
  const slider = page.getByRole("slider");
  await expect(slider).toHaveCSS("width", "8px");
  await expect(slider).toHaveAttribute("aria-valuenow", "51");
  await expect(slider.locator('[aria-hidden="true"]')).toHaveCount(1);
  await page.close();
});

test("new parent presets preserve original slider defaults without runtime schema injection", async () => {
  const page = await render(1440);
  const schema = await page.evaluate(() => window.sectionSchema);
  assert.equal(generateDataFromSchema(schema).separatorWidth, undefined);
  await page.evaluate(
    (parent) => window.renderCase({ parent }),
    schema.presets,
  );
  const slider = page.getByRole("slider");
  await expect(slider).toHaveCSS("width", "8px");
  await expect(slider).toHaveAttribute("aria-valuenow", "51");
  await expect(slider.locator('[aria-hidden="true"]')).toHaveCount(1);
  await expect(page.locator('img[src="/before.png"]')).toHaveCount(1);
  assert.equal(schema.presets.sliderHeightDesktop, 600);
  assert.equal(schema.presets.sliderHeightMobile, 200);
  await page.close();
});

test("parent edits override saved settings including false and zero without losing other values", async () => {
  const page = await render(1440, {
    parent: {
      beforeImage1: "/override.png",
      showList: false,
      initialPositionDesktop: 0,
    },
    legacy: {
      beforeImage1: "/old.png",
      afterImage2: "/retained.png",
      separatorWidth: 6,
      showList: true,
      initialPositionDesktop: 37,
    },
  });
  await expect(page.locator('img[src="/override.png"]')).toHaveCount(1);
  await expect(page.locator('img[src="/retained.png"]')).toHaveCount(1);
  await expect(page.getByRole("slider")).toHaveCSS("width", "6px");
  await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
  await expect(
    page.getByRole("slider").locator('[aria-hidden="true"]'),
  ).toHaveCount(0);
  await page.close();
});

test("internal slider preserves responsive heights/positions and keyboard/pointer interactions", async () => {
  for (const width of [390, 768, 1032, 1033, 1440]) {
    const page = await render(width, {
      parent: {
        heightMode: "custom",
        sliderHeightMobile: 200,
        sliderHeightDesktop: 600,
        initialPositionMobile: 44,
        initialPositionDesktop: 51,
      },
    });
    const slider = page.getByRole("slider");
    await expect(slider).toHaveAttribute(
      "aria-valuenow",
      width < 768 ? "44" : "51",
    );
    await expect(slider).toHaveCSS("height", width < 768 ? "200px" : "600px");
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "1");
    const bounds = await slider.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 10);
    await page.mouse.down();
    await page.mouse.move(width / 2, bounds.y + 10);
    await page.mouse.up();
    await expect(slider).toHaveAttribute("aria-valuenow", "50");
    await page.close();
  }
});
