import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  DESKTOP_MIN_PX,
  MOBILE_MAX_PX,
  TABLET_MAX_PX,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";

async function getCollectionPath(page: Page) {
  await page.goto("/collections");
  return page.locator("a").evaluateAll((links) =>
    links
      .map((link) => new URL((link as HTMLAnchorElement).href).pathname)
      .find((pathname) => {
        const segments = pathname.split("/").filter(Boolean);
        const collectionsIndex = segments.indexOf("collections");
        return (
          collectionsIndex >= 0 && segments.length === collectionsIndex + 2
        );
      }),
  );
}

async function expectProductRowAligned(section: Locator) {
  const sectionContent = section.locator(":scope > div").first();
  const imageFrames = section.locator(
    "[data-product-card-image-frame]:visible",
  );
  await expect(imageFrames.first()).toBeVisible();

  const contentBounds = await sectionContent.boundingBox();
  const firstImageBounds = await imageFrames.first().boundingBox();
  if (!contentBounds || !firstImageBounds) {
    throw new Error("Product section content or first image is missing");
  }

  const firstRowBounds = await imageFrames.evaluateAll(
    (frames, contentRight) => {
      const rects = frames.map((frame) => frame.getBoundingClientRect());
      const firstTop = rects[0]?.top;
      const firstRow = rects.filter(
        (rect) =>
          firstTop !== undefined &&
          Math.abs(rect.top - firstTop) < 1 &&
          rect.left < contentRight,
      );
      return {
        left: Math.min(...firstRow.map((rect) => rect.left)),
        right: Math.max(...firstRow.map((rect) => rect.right)),
      };
    },
    contentBounds.x + contentBounds.width,
  );

  expect(Math.abs(firstRowBounds.left - contentBounds.x)).toBeLessThan(1);
  expect(
    Math.abs(firstRowBounds.right - (contentBounds.x + contentBounds.width)),
  ).toBeLessThan(1);
}

const VIEWPORT_WIDTHS = [
  390,
  MOBILE_MAX_PX,
  TABLET_MIN_PX,
  TABLET_MAX_PX,
  DESKTOP_MIN_PX,
  1440,
];

for (const width of VIEWPORT_WIDTHS) {
  test(`product grids align to their section at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const collectionPath = await getCollectionPath(page);
    expect(collectionPath).toBeTruthy();
    if (!collectionPath) {
      throw new Error("The connected store has no collection page to test");
    }
    const routes = ["/products", "/search?q=chair"];
    routes.push(collectionPath);

    for (const route of routes) {
      await page.goto(route);
      const firstImage = page
        .locator("[data-product-card-image-frame]:visible")
        .first();
      await expect(firstImage).toBeVisible();
      await expectProductRowAligned(
        firstImage.locator("xpath=ancestor::section[1]"),
      );
    }
  });

  test(`cart recommendations align to their section at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cart");
    const firstImage = page
      .locator("main [data-product-card-image-frame]:visible")
      .first();
    await expect(firstImage).toBeVisible();
    await expectProductRowAligned(
      firstImage.locator("xpath=ancestor::section[1]"),
    );
  });
}

for (const width of [390, TABLET_MIN_PX, DESKTOP_MIN_PX, 1440]) {
  test(`cart drawer preserves its card inset at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open cart", exact: true }).click();

    const drawer = page.getByRole("dialog", { name: "Cart", exact: true });
    const imageFrame = drawer
      .locator("[data-product-card-image-frame]:visible")
      .first();
    await expect(imageFrame).toBeVisible();

    const article = imageFrame.locator("xpath=ancestor::article[1]");
    const inlinePadding = await article.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart),
    );
    if (width < DESKTOP_MIN_PX) {
      expect(inlinePadding).toBeGreaterThan(0);
    } else {
      expect(inlinePadding).toBe(0);
    }
    await expect
      .poll(async () => {
        const articleBounds = await article.boundingBox();
        const imageBounds = await imageFrame.boundingBox();
        if (!articleBounds || !imageBounds) {
          return Number.POSITIVE_INFINITY;
        }
        return Math.abs(imageBounds.x - articleBounds.x - inlinePadding);
      })
      .toBeLessThan(1);
  });
}
