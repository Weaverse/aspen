import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { generateDataFromSchema } from "@weaverse/hydrogen";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React from "react";
      import {createRoot} from "react-dom/client";
      import AccordionSection, {schema} from "./app/sections/accordion";
      import AccordionGroup from "./app/sections/accordion/accordion-group";
      import AccordionItem, {schema as itemSchema} from "./app/sections/accordion/accordion-item";
      const root = createRoot(document.getElementById("root"));
      window.accordionInputs = schema.settings.flatMap(group=>group.inputs.map(input=>input.name));
      window.accordionItemInputs = itemSchema.settings.flatMap(group=>group.inputs);
      window.accordionItemPreset = itemSchema.presets;
      window.renderAccordion = ({layout="row", color, itemSettings=[], ...settings}={}) => {
        root.render(<AccordionSection accordionLayout={layout} {...settings}>
          <h2>Customer service</h2>
          <AccordionGroup accordionBackgroundColor={color} accordionTextColor="#524B46">
            {[1,2,3,4].map(index=><AccordionItem key={index} {...window.sdkItemDefaults} title={"Question "+index} content={"Answer "+index} {...itemSettings[index-1]} />)}
          </AccordionGroup>
        </AccordionSection>);
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
      name: "accordion-boundaries",
      setup(builder) {
        const stubs = {
          "@weaverse/hydrogen":
            'export const IMAGES_PLACEHOLDERS={image:"/placeholder.svg"}; export const useTranslation=()=>({t:key=>key});',
          "@shopify/hydrogen":
            'import React from "react"; export const Image=props=><img {...props}/>;',
          "~/hooks/use-animation": "export const useAnimation=ref=>[ref];",
          "~/hooks/use-translated-text":
            "export const useTranslatedText=()=>text=>text;",
        };
        builder.onResolve({ filter: /./ }, ({ path }) =>
          path in stubs ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /./, namespace: "fixture" }, ({ path }) => ({
          contents: stubs[path],
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

async function fixture(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    `<style>${css}:root{--radius-md:12px;--body-base-size:14px;--page-width:1440px;--page-padding:40px;}</style><div id="root"></div>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const inputs = await page.evaluate(() => window.accordionItemInputs);
  const defaults = generateDataFromSchema({
    type: "accordion--item",
    settings: [{ group: "Accordion Item", inputs }],
  });
  // Match WeaverseHydrogenItem's schema-defaults-before-saved-data merge.
  await page.evaluate((value) => {
    window.sdkItemDefaults = value;
  }, defaults);
  return page;
}

test("section radius control is removed while saved background radii remain compatible", async () => {
  const browser = await chromium.launch();
  try {
    const page = await fixture(browser, 1440);
    const inputs = await page.evaluate(() => window.accordionInputs);
    expect(inputs).not.toContain("borderRadius");
    expect(inputs).toContain("width");
    expect(inputs).toContain("backgroundColor");
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const backgroundFor of ["section", "content"]) {
        for (const borderRadius of [0, 24]) {
          await page.evaluate((settings) => window.renderAccordion(settings), {
            borderRadius,
            backgroundFor,
            backgroundColor: "#cccccc",
          });
          const frame = page.locator("section");
          await expect(frame).toHaveCSS("border-radius", `${borderRadius}px`);
          await expect(frame).toHaveCSS(
            "background-color",
            "rgb(204, 204, 204)",
          );
          await expect(page.locator("section > div")).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test("style 2 question and answer surfaces follow radius-md and keep their configured color", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 834, 1440]) {
      const page = await fixture(browser, width);
      await page.evaluate(() => window.renderAccordion());
      const first = page
        .getByRole("button", { name: "Question 1", exact: true })
        .filter({ visible: true });
      const answer = page.getByRole("region").filter({ visible: true }).first();
      await expect(first).toHaveCSS("border-radius", "12px");
      await expect(first).toHaveCSS("background-color", "rgb(243, 243, 243)");
      await expect(answer).toHaveCSS("border-radius", "12px");
      await expect(first).toHaveAttribute("data-state", "open");
      await first.click();
      await expect(first).toHaveAttribute("data-state", "closed");
      await first.click();
      await expect(answer).toBeVisible();
      await page.addStyleTag({ content: ":root{--radius-md:18px;}" });
      await expect(first).toHaveCSS("border-radius", "18px");
      await expect(answer).toHaveCSS("border-radius", "18px");
      await page.evaluate(() => window.renderAccordion({ color: "#abcdef" }));
      await expect(first).toHaveCSS("background-color", "rgb(171, 205, 239)");
      await expect(answer).toHaveCSS("background-color", "rgb(171, 205, 239)");
      await page.evaluate(() => window.renderAccordion({ layout: "column" }));
      await expect(first).toHaveCSS("border-radius", "4px");
      await expect(answer).toHaveCSS("border-radius", "4px");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("each item independently configures question and answer radii, including zero and design defaults", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 834, 1440]) {
      const page = await fixture(browser, width);
      const inputs = await page.evaluate(() => window.accordionItemInputs);
      for (const name of ["questionBorderRadius", "answerBorderRadius"]) {
        const input = inputs.find((candidate) => candidate.name === name);
        expect(input.type).toBe("range");
        expect(input.defaultValue).toBeUndefined();
        expect(input.configs).toEqual({ min: 0, max: 40, step: 2, unit: "px" });
      }
      await page.evaluate(() =>
        window.renderAccordion({
          itemSettings: [
            { questionBorderRadius: 0, answerBorderRadius: 24 },
            { questionBorderRadius: 8, answerBorderRadius: 0 },
          ],
        }),
      );
      const first = page
        .getByRole("button", { name: "Question 1", exact: true })
        .filter({ visible: true });
      const second = page
        .getByRole("button", { name: "Question 2", exact: true })
        .filter({ visible: true });
      const firstAnswer = page
        .getByRole("region", { name: "Question 1", exact: true })
        .filter({ visible: true });
      await expect(first).toHaveCSS("border-radius", "0px");
      await expect(firstAnswer).toHaveCSS("border-radius", "24px");
      await expect(second).toHaveCSS("border-radius", "8px");
      await second.click();
      const secondAnswer = page
        .getByRole("region", { name: "Question 2", exact: true })
        .filter({ visible: true });
      await expect(secondAnswer).toHaveCSS("border-radius", "0px");
      await expect(firstAnswer).toHaveCSS("border-radius", "24px");
      await page.evaluate(() =>
        window.renderAccordion({
          itemSettings: [
            { questionBorderRadius: "auto", answerBorderRadius: "auto" },
            { questionBorderRadius: "8", answerBorderRadius: "0" },
          ],
        }),
      );
      await expect(first).toHaveCSS("border-radius", "12px");
      await expect(firstAnswer).toHaveCSS("border-radius", "12px");
      await expect(second).toHaveCSS("border-radius", "8px");
      await expect(secondAnswer).toHaveCSS("border-radius", "0px");
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("new item presets start at 12px without injecting defaults into existing items", async () => {
  const browser = await chromium.launch();
  try {
    const page = await fixture(browser, 1440);
    const defaults = await page.evaluate(() => window.sdkItemDefaults);
    expect(defaults).not.toHaveProperty("questionBorderRadius");
    expect(defaults).not.toHaveProperty("answerBorderRadius");
    const preset = await page.evaluate(() => window.accordionItemPreset);
    expect(preset).toMatchObject({
      questionBorderRadius: 12,
      answerBorderRadius: 12,
    });
    await page.evaluate(
      (settings) => window.renderAccordion({ itemSettings: [settings] }),
      preset,
    );
    const first = page
      .getByRole("button", { name: "Question 1", exact: true })
      .filter({ visible: true });
    const answer = page
      .getByRole("region", { name: "Question 1", exact: true })
      .filter({ visible: true });
    await expect(first).toHaveCSS("border-radius", "12px");
    await expect(answer).toHaveCSS("border-radius", "12px");
    await page.addStyleTag({ content: ":root{--radius-md:18px;}" });
    await expect(first).toHaveCSS("border-radius", "12px");
    await expect(answer).toHaveCSS("border-radius", "12px");
  } finally {
    await browser.close();
  }
});
