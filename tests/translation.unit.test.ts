import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultTranslation,
  type Translate,
  translateGlobalThemeText,
  translateThemeText,
} from "~/utils/translation";

const translated: Record<string, string> = {
  "themeContent.componentsLayoutFooter.newsletterTitle": "RESTEZ EN CONTACT",
  "themeContent.componentsLayoutFooter.copyright": "© Boutique 2026",
};

const aspenCopyright =
  '<p>© 2026 Aspen Theme. <a href="https://www.shopify.com/?utm_campaign=poweredby&utm_medium=shopify&utm_source=onlinestore" target="_blank" rel="noopener noreferrer">Powered by Shopify</a></p>';

const t: Translate = (key) => translated[key] ?? `translated:${key}`;

test("a live Studio translation wins over custom footer source copy", () => {
  const key = "themeContent.componentsLayoutFooter.newsletterTitle";

  assert.equal(
    translateGlobalThemeText(t, "Merchant newsletter", key, {
      designOverrides: { [key]: "RESTEZ EN CONTACT" },
    }),
    "RESTEZ EN CONTACT",
  );
});

test("a published translation wins over custom footer source copy", () => {
  const key = "themeContent.componentsLayoutFooter.copyright";

  assert.equal(
    translateGlobalThemeText(t, "© Merchant 2025", key, {
      merchantOverrides: {
        themeContent: {
          componentsLayoutFooter: { copyright: "© Boutique 2026" },
        },
      },
    }),
    "© Boutique 2026",
  );
});

test("custom merchant copy wins when no translation override exists", () => {
  const key = "themeContent.componentsLayoutFooter.newsletterTitle";

  assert.equal(
    translateGlobalThemeText(t, "Merchant newsletter", key),
    "Merchant newsletter",
  );
});

test("the bundled default falls through to the locale translation", () => {
  const key = "themeContent.componentsLayoutFooter.newsletterTitle";
  const bundledDefault = defaultTranslation(key);

  assert.equal(bundledDefault, "STAY IN TOUCH");
  assert.equal(
    translateGlobalThemeText(t, bundledDefault, key),
    "RESTEZ EN CONTACT",
  );
});

test("the Aspen copyright schema default matches the canonical locale value", () => {
  const key = "themeContent.componentsLayoutFooter.copyright";

  assert.equal(defaultTranslation(key), aspenCopyright);
  assert.equal(
    translateGlobalThemeText(t, aspenCopyright, key),
    "© Boutique 2026",
  );
});

test("a live Studio translation wins when a published translation also exists", () => {
  const key = "themeContent.componentsLayoutFooter.newsletterTitle";
  const liveT: Translate = () => "LIVE STUDIO TITLE";

  assert.equal(
    translateGlobalThemeText(liveT, "Merchant newsletter", key, {
      designOverrides: { [key]: "LIVE STUDIO TITLE" },
      merchantOverrides: {
        themeContent: {
          componentsLayoutFooter: { newsletterTitle: "PUBLISHED TITLE" },
        },
      },
    }),
    "LIVE STUDIO TITLE",
  );
});

test("a published empty string remains authoritative", () => {
  const key = "themeContent.componentsLayoutFooter.newsletterTitle";
  const emptyT: Translate = () => "";

  assert.equal(
    translateGlobalThemeText(emptyT, "Merchant newsletter", key, {
      merchantOverrides: {
        themeContent: { componentsLayoutFooter: { newsletterTitle: "" } },
      },
    }),
    "",
  );
});

test("an Aspen preset remains the default page content despite a shared override", () => {
  const key = "themeContent.sectionsSlideshowSlide.headingContent";
  const preset = "THE CRAFTED COMFORT";
  const staticT: Translate = (translationKey) =>
    defaultTranslation(translationKey) ?? `translated:${translationKey}`;

  assert.equal(
    translateThemeText(staticT, preset, key, {
      designOverrides: { [key]: "Slide with text overlay" },
    }),
    preset,
  );
});

test("a shared published key does not replace custom page content", () => {
  const key = "themeContent.sectionsSlideshowSlide.headingContent";

  assert.equal(
    translateThemeText(t, "Autumn Collection", key, {
      merchantOverrides: {
        themeContent: {
          sectionsSlideshowSlide: {
            headingContent: "Generic translated heading",
          },
        },
      },
    }),
    "Autumn Collection",
  );
});
