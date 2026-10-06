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
      import { createRoot } from "react-dom/client";
      import Countdown, { schema as countdownSchema } from "./app/sections/countdown";
      import CountdownButton, { schema as buttonSchema } from "./app/sections/countdown/button";
      import Paragraph from "./app/components/paragraph";
      import SubHeading, { schema } from "./app/sections/countdown/subheading";
      import CountdownTimer, { schema as timerSchema } from "./app/sections/countdown/timer";

      const root = createRoot(document.getElementById("root"));
      window.schema = schema;
      window.countdownSchema = countdownSchema;
      window.buttonSchema = buttonSchema;
      window.timerSchema = timerSchema;
      window.renderCountdown = ({
        backgroundBorderRadius,
        scenario = "scenario1",
        paragraphWidth = "full",
        paragraphTextSize = "base",
        paragraphClassName,
        subheadingSize = "base",
        subheadingWeight = "normal",
        timerProps = {},
        buttonProps,
        countdownProps = {},
      } = {}) => {
        window.__countdownScenario = scenario;
        root.render(
          React.createElement(
            Countdown,
            { scenario, height: "small", ...countdownProps },
            React.createElement(SubHeading, {
              content: "Seasonal Sale",
              color: "#FEF4EB",
              backgroundColor: "#434343",
              backgroundBorderRadius,
              alignment: "left",
              size: subheadingSize,
              weight: subheadingWeight,
            }),
            React.createElement(Paragraph, {
              content: "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
              width: paragraphWidth,
              textSize: paragraphTextSize,
              className: paragraphClassName,
            }),
            React.createElement(CountdownTimer, {
              endTime: Date.now() + 86400000,
              textColor: "#FEF4EB",
              ...timerProps,
            }),
            buttonProps && React.createElement(CountdownButton, buttonProps),
          ),
        );
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
      name: "countdown-subheading-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^@weaverse\/hydrogen$/ }, () => ({
          path: "weaverse",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /use-translated-text$/ }, () => ({
          path: "translation",
          namespace: "fixture",
        }));
        builder.onResolve({ filter: /^react-router$/ }, () => ({
          path: "react-router",
          namespace: "fixture",
        }));
        builder.onResolve(
          {
            filter: /~\/components\/(background-image|overlay|section)$/,
          },
          ({ path }) => ({ path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "react-router"
              ? `import React from "react";
               export const Link = React.forwardRef(({ to, viewTransition, ...props }, ref) =>
                 React.createElement("a", { ...props, ref, href: typeof to === "string" ? to : "" }));
              export const useRouteLoaderData = () => globalThis.__rootLoaderData;`
              : path.endsWith("background-image")
                ? `export const backgroundInputs = [
                   { type: "color", name: "backgroundColor" },
                   { type: "image", name: "backgroundImage" },
                   { type: "select", name: "backgroundFit" },
                   { type: "position", name: "backgroundPosition" },
                 ];`
                : path.endsWith("overlay")
                  ? `export const overlayInputs = [
                     { type: "switch", name: "enableOverlay" },
                     { type: "color", name: "overlayColor" },
                     { type: "range", name: "overlayOpacity" },
                   ];`
                  : path.endsWith("section")
                    ? `import React from "react";
                   export const Section = React.forwardRef((props, ref) => {
                     globalThis.__lastSectionProps = props;
                     return React.createElement("section", { ref }, props.children);
                   });`
                    : path === "translation"
                      ? "export const useTranslatedText = () => (value) => value;"
                      : `export const createSchema = (value) => value;
                     export const useParentInstance = () => ({ data: { scenario: globalThis.__countdownScenario || "scenario1" } });
                     export const useThemeSettings = () => ({ enableViewTransition: false });
                     export const useTranslation = () => ({ t: (key) => key.split(".").at(-1) });`,
          loader: "js",
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

test("Countdown label uses theme typography, radius, and vertical alignment", async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.setContent(
        `<style>${css}:root { --radius-sm: 8px; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderCountdown());

      const label = page.getByText("Seasonal Sale", { exact: true });
      await expect(label).toHaveCSS("border-radius", "8px");
      assert.match(
        await label.evaluate((node) => getComputedStyle(node).fontFamily),
        /Tenor Sans/,
      );
      const centerOffset = await label.evaluate((node) => {
        const backgroundBox = node.getBoundingClientRect();
        const textRange = document.createRange();
        textRange.selectNodeContents(node);
        const textBox = textRange.getBoundingClientRect();
        return Math.abs(
          backgroundBox.y +
            backgroundBox.height / 2 -
            (textBox.y + textBox.height / 2),
        );
      });
      assert.ok(
        centerOffset < 1,
        `label text is ${centerOffset}px off-center at ${width}px`,
      );

      await page.evaluate(() =>
        window.renderCountdown({ backgroundBorderRadius: 0 }),
      );
      await expect(label).toHaveCSS("border-radius", "0px");
      await page.close();
    }

    assert.equal(
      await browser.newPage().then(async (page) => {
        await page.setContent('<div id="root"></div>');
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        return page.evaluate(
          () =>
            window.schema.settings[0].inputs.find(
              (input) => input.name === "backgroundBorderRadius",
            ).defaultValue,
        );
      }),
      8,
    );
    assert.equal(
      await browser.newPage().then(async (page) => {
        await page.setContent('<div id="root"></div>');
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        return page.evaluate(
          () =>
            window.schema.settings[0].inputs.find(
              (input) => input.name === "size",
            ).defaultValue,
        );
      }),
      "2xl",
    );
  } finally {
    await browser.close();
  }
});

test("Countdown subheading size remains independent from paragraph size", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(
      `<style>${css}:root { --body-base-size: 14px; --radius-sm: 8px; }</style><div id="root"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });

    await page.evaluate(() =>
      window.renderCountdown({
        paragraphTextSize: "base",
        subheadingSize: "base",
      }),
    );
    const label = page.getByText("Seasonal Sale", { exact: true });
    const baseFontSize = await label.evaluate(
      (node) => getComputedStyle(node).fontSize,
    );
    const baseHeight = await label.evaluate(
      (node) => node.getBoundingClientRect().height,
    );

    await page.evaluate(() =>
      window.renderCountdown({
        paragraphTextSize: "6xl",
        subheadingSize: "base",
      }),
    );
    assert.equal(
      await label.evaluate((node) => node.getBoundingClientRect().height),
      baseHeight,
    );

    await page.evaluate(() =>
      window.renderCountdown({
        paragraphTextSize: "base",
        subheadingSize: "large",
      }),
    );
    await expect(label).toHaveCSS("font-size", "18px");
    assert.notEqual(
      await label.evaluate((node) => getComputedStyle(node).fontSize),
      baseFontSize,
    );

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(label).toHaveCSS("font-size", "18px");
  } finally {
    await browser.close();
  }
});

test("Countdown subheading weight is applied to the text element", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });

    await page.evaluate(() =>
      window.renderCountdown({ subheadingWeight: "normal" }),
    );
    const label = page.getByText("Seasonal Sale", { exact: true });
    await expect(label).toHaveCSS("font-weight", "400");

    await page.evaluate(() =>
      window.renderCountdown({ subheadingWeight: "medium" }),
    );
    await expect(label).toHaveCSS("font-weight", "500");
    await expect(label).toHaveClass(/font-medium/);
  } finally {
    await browser.close();
  }
});

test("Countdown timer labels can be hidden without affecting the numbers", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });

    const showLabelsInput = await page.evaluate(() =>
      window.timerSchema.settings[0].inputs.find(
        (input) => input.name === "showLabels",
      ),
    );
    assert.equal(showLabelsInput.defaultValue, true);

    await page.evaluate(() =>
      window.renderCountdown({ timerProps: { showLabels: false } }),
    );
    await expect(page.getByText("days", { exact: true })).toHaveCount(0);
    await expect(
      page.locator(".countdown--timer > div > div").first(),
    ).toHaveText(/\d{2}/);
  } finally {
    await browser.close();
  }
});

test("Countdown button honors merchant styles, alignment, and external URLs", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => {
      window.__rootLoaderData = {
        selectedLocale: {
          language: "FR",
          country: "FR",
          pathPrefix: "/fr-fr",
        },
      };
      window.renderCountdown({
        buttonProps: {
          text: "Discover now",
          style2Text: "Shop now",
          to: "https://example.com/products",
          openInNewTab: true,
          alignment: "right",
          variant: "custom",
          backgroundColor: "#123456",
          textColor: "#ffffff",
          borderColor: "#654321",
          backgroundColorHover: "#234567",
          textColorHover: "#eeeeee",
          borderColorHover: "#765432",
        },
      });
    });

    const wrapper = page.locator(".button-countdown");
    const button = page.getByRole("link", { name: "Discover now" });
    await expect(wrapper).toHaveCSS("justify-content", "flex-end");
    await expect(button).toHaveCSS("background-color", "rgb(18, 52, 86)");
    await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(button).toHaveCSS("border-color", "rgb(101, 67, 33)");
    await expect(button).toHaveAttribute(
      "href",
      "https://example.com/products",
    );
    await expect(button).toHaveAttribute("target", "_blank");
  } finally {
    await browser.close();
  }
});

test("Countdown Style 2 button keeps its defaults and text variants stay unboxed", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });

    await page.evaluate(() =>
      window.renderCountdown({
        scenario: "scenario2",
        buttonProps: {
          text: "Discover now",
          style2Text: "Shop now",
          to: "/collections/all",
          variant: "custom",
        },
      }),
    );
    const style2Wrapper = page.locator(".button-countdown");
    const style2Button = page.getByRole("link", { name: "Shop now" });
    await expect(style2Wrapper).toHaveCSS("justify-content", "center");
    await expect(style2Button).toHaveCSS("background-color", "rgb(81, 74, 69)");
    await expect(style2Button).toHaveCSS("color", "rgb(255, 255, 255)");

    await page.evaluate(() =>
      window.renderCountdown({
        scenario: "scenario2",
        buttonProps: {
          text: "Discover now",
          style2Text: "Shop now",
          to: "/collections/all",
          alignment: "right",
          variant: "custom",
        },
      }),
    );
    await expect(style2Wrapper).toHaveCSS("justify-content", "flex-end");

    await page.evaluate(() =>
      window.renderCountdown({
        buttonProps: {
          text: "Read more",
          to: "/blogs/news",
          alignment: "left",
          variant: "decor",
          textColorDecor: "#123456",
        },
      }),
    );
    const decorButton = page.getByRole("link", { name: "Read more" });
    await expect(decorButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(decorButton).toHaveCSS("padding-left", "0px");
    await expect(decorButton).toHaveCSS("color", "rgb(18, 52, 86)");
  } finally {
    await browser.close();
  }
});

test("Countdown handles invalid end times and hides inactive Style 2 controls", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() =>
      window.renderCountdown({ timerProps: { endTime: Number.NaN } }),
    );
    await page.waitForTimeout(50);
    await expect(page.locator(".countdown--timer")).not.toContainText("NaN");
    await expect(
      page.locator(".countdown--timer > div > div").first(),
    ).toHaveText("00");

    const controlVisibility = await page.evaluate(() => {
      const background = window.countdownSchema.settings.find(
        (group) => group.group === "Background",
      ).inputs;
      const overlay = window.countdownSchema.settings.find(
        (group) => group.group === "Overlay",
      ).inputs;
      const backgroundImage = background.find(
        (input) => input.name === "backgroundImage",
      );
      const enableOverlay = overlay.find(
        (input) => input.name === "enableOverlay",
      );
      return {
        imageStyle1: backgroundImage.condition({ scenario: "scenario1" }),
        imageStyle2: backgroundImage.condition({ scenario: "scenario2" }),
        overlayStyle1: enableOverlay.condition({ scenario: "scenario1" }),
        overlayStyle2: enableOverlay.condition({ scenario: "scenario2" }),
      };
    });
    assert.deepEqual(controlVisibility, {
      imageStyle1: true,
      imageStyle2: false,
      overlayStyle1: true,
      overlayStyle2: false,
    });
  } finally {
    await browser.close();
  }
});

test("Countdown switches background, overlay, height, and padding by style", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(`<style>${css}</style><div id="root"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });

    await page.evaluate(() =>
      window.renderCountdown({
        countdownProps: {
          width: "fixed",
          height: "medium",
          backgroundImage: "countdown.webp",
          backgroundColor: "#112233",
          enableOverlay: true,
          overlayColor: "#000000",
          overlayOpacity: 40,
        },
      }),
    );
    const style1Props = await page.evaluate(() => ({
      width: window.__lastSectionProps.width,
      backgroundImage: window.__lastSectionProps.backgroundImage,
      backgroundColor: window.__lastSectionProps.backgroundColor,
      enableOverlay: window.__lastSectionProps.enableOverlay,
      overlayOpacity: window.__lastSectionProps.overlayOpacity,
    }));
    assert.deepEqual(style1Props, {
      width: "fixed",
      backgroundImage: "countdown.webp",
      backgroundColor: "#112233",
      enableOverlay: true,
      overlayOpacity: 40,
    });
    await expect(page.locator("section > div").first()).toHaveClass(
      /lg:h-\[840px\]/,
    );

    await page.evaluate(() =>
      window.renderCountdown({
        scenario: "scenario2",
        countdownProps: {
          backgroundImage: "ignored.webp",
          backgroundColor: "#445566",
          enableOverlay: true,
          style2VerticalPadding: 80,
        },
      }),
    );
    const style2Props = await page.evaluate(() => ({
      backgroundImage: window.__lastSectionProps.backgroundImage,
      backgroundColor: window.__lastSectionProps.backgroundColor,
      enableOverlay: window.__lastSectionProps.enableOverlay,
    }));
    assert.deepEqual(style2Props, {
      backgroundImage: undefined,
      backgroundColor: "#445566",
      enableOverlay: false,
    });
    await expect(page.locator("section > div").first()).toHaveCSS(
      "padding-top",
      "80px",
    );
    await expect(page.locator("section > div").first()).toHaveCSS(
      "padding-bottom",
      "80px",
    );
  } finally {
    await browser.close();
  }
});

test("Countdown preserves responsive typography and applies the reviewed desktop style", async () => {
  const browser = await chromium.launch();
  try {
    const responsiveCases = [
      {
        width: 390,
        numberSize: "48px",
        numberLineHeight: "38.4px",
        labelSize: "10px",
        labelLineHeight: "10px",
      },
      {
        width: 768,
        numberSize: "80px",
        numberLineHeight: "64px",
        labelSize: "12px",
        labelLineHeight: "12px",
      },
      {
        width: 1024,
        numberSize: "80px",
        numberLineHeight: "64px",
        labelSize: "12px",
        labelLineHeight: "12px",
      },
      {
        width: 1025,
        numberSize: "80px",
        numberLineHeight: "88px",
        labelSize: "14px",
        labelLineHeight: "22.4px",
      },
      {
        width: 1440,
        numberSize: "80px",
        numberLineHeight: "88px",
        labelSize: "14px",
        labelLineHeight: "22.4px",
      },
    ];

    for (const expected of responsiveCases) {
      const page = await browser.newPage({
        viewport: { width: expected.width, height: 900 },
      });
      await page.setContent(
        `<style>${css}:root { --body-base-size: 14px; }</style><div id="root"></div>`,
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.renderCountdown());

      const number = page.locator(".countdown--timer > div > div").first();
      await expect(number).toHaveCSS("font-size", expected.numberSize);
      await expect(number).toHaveCSS("line-height", expected.numberLineHeight);

      const unit = page.getByText("days", { exact: true });
      await expect(unit).toHaveCSS("font-size", expected.labelSize);
      await expect(unit).toHaveCSS("line-height", expected.labelLineHeight);

      if (expected.width >= 1025) {
        await expect(number).toHaveCSS("letter-spacing", "-2.4px");
        await expect(number).toHaveCSS("text-align", "center");
        await expect(unit).toHaveCSS("font-weight", "600");
        await expect(unit).toHaveCSS("letter-spacing", "0.28px");

        const paragraph = page.locator(".paragraph");
        const paragraphStyle = await paragraph.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            width: node.getBoundingClientRect().width,
            columnWidth: Number.parseFloat(
              getComputedStyle(node.parentElement).gridTemplateColumns.split(
                " ",
              )[1],
            ),
          };
        });
        assert.match(paragraphStyle.fontFamily, /Tenor Sans/);
        assert.equal(paragraphStyle.fontSize, "24px");
        assert.equal(paragraphStyle.fontWeight, "400");
        assert.equal(paragraphStyle.lineHeight, "normal");
        assert.equal(paragraphStyle.width, paragraphStyle.columnWidth);
      }
      await page.close();
    }

    const compatibilityPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await compatibilityPage.setContent(
      `<style>${css}:root { --body-base-size: 14px; }</style><div id="root"></div>`,
    );
    await compatibilityPage.addScriptTag({
      content: bundle.outputFiles[0].text,
    });
    await compatibilityPage.evaluate(() =>
      window.renderCountdown({
        paragraphWidth: "narrow",
        paragraphTextSize: "sm",
      }),
    );

    const customParagraph = compatibilityPage.locator(".paragraph");
    const customParagraphGeometry = await customParagraph.evaluate((node) => ({
      fontSize: getComputedStyle(node).fontSize,
      width: node.getBoundingClientRect().width,
      columnWidth: Number.parseFloat(
        getComputedStyle(node.parentElement).gridTemplateColumns.split(" ")[1],
      ),
    }));
    assert.equal(customParagraphGeometry.fontSize, "14px");
    assert.equal(
      customParagraphGeometry.width,
      customParagraphGeometry.columnWidth * 0.75,
    );

    await compatibilityPage.evaluate(() =>
      window.renderCountdown({ scenario: "scenario2" }),
    );
    const style2Number = compatibilityPage
      .locator(".countdown--timer > div > div")
      .first();
    await expect(style2Number).toHaveCSS("font-size", "48px");
    await expect(style2Number).toHaveCSS("line-height", "38.4px");
    const style2Unit = compatibilityPage.getByText("days", { exact: true });
    await expect(style2Unit).toHaveCSS("font-size", "12px");
    await expect(style2Unit).toHaveCSS("line-height", "12px");

    const schemaDefaults = await compatibilityPage.evaluate(() => {
      const inputs = window.timerSchema.settings[0].inputs;
      return {
        style1: inputs.find(
          (input) => input.name === "scenario1DesktopLabelSize",
        ).defaultValue,
        style2: inputs.find((input) => input.name === "desktopLabelSize")
          .defaultValue,
      };
    });
    assert.deepEqual(schemaDefaults, { style1: 14, style2: 12 });
    await compatibilityPage.close();
  } finally {
    await browser.close();
  }
});

test("Paragraph caller classes override the base text size", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(
      `<style>${css}:root { --body-base-size: 14px; }</style><div id="root"></div>`,
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() =>
      window.renderCountdown({
        paragraphTextSize: "base",
        paragraphClassName: "text-sm",
      }),
    );

    await expect(page.locator(".paragraph")).toHaveCSS("font-size", "14px");
  } finally {
    await browser.close();
  }
});
