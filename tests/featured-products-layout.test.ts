import { expect, type Locator, test } from "@playwright/test";
import {
  DESKTOP_MIN_PX,
  MOBILE_MAX_PX,
  TABLET_MAX_PX,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";

async function expectFeaturedSectionAligned(section: Locator) {
  await section.scrollIntoViewIfNeeded();

  const content = section.locator('[data-wv-type="featured-content-products"]');
  const imageFrames = section.locator(
    "[data-product-card-image-frame]:visible",
  );
  await expect(imageFrames.first()).toBeVisible();

  const contentBounds = await content.boundingBox();
  const firstImageBounds = await imageFrames.first().boundingBox();
  if (!contentBounds || !firstImageBounds) {
    throw new Error("Featured Products content or card image is missing");
  }

  expect(
    Math.abs(
      firstImageBounds.y - (contentBounds.y + contentBounds.height) - 40,
    ),
  ).toBeLessThan(1);
  expect(Math.abs(firstImageBounds.x - contentBounds.x)).toBeLessThan(1);

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
        gaps: firstRow.slice(1).map((rect, index) => {
          const previous = firstRow[index];
          return rect.left - previous.right;
        }),
      };
    },
    contentBounds.x + contentBounds.width,
  );

  expect(Math.abs(firstRowBounds.left - contentBounds.x)).toBeLessThan(1);
  expect(
    Math.abs(firstRowBounds.right - (contentBounds.x + contentBounds.width)),
  ).toBeLessThan(1);
  for (const gap of firstRowBounds.gaps.slice(1)) {
    expect(Math.abs(gap - firstRowBounds.gaps[0])).toBeLessThan(1);
  }
}

const VIEWPORT_WIDTHS = [
  390,
  MOBILE_MAX_PX,
  TABLET_MIN_PX,
  TABLET_MAX_PX,
  DESKTOP_MIN_PX,
  1520,
];

for (const width of VIEWPORT_WIDTHS) {
  test(`featured product layouts align cards at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });

    for (const route of ["/products/madison-bed", "/"]) {
      await page.goto(route);
      const sections = page.locator(
        'section[data-wv-type="featured-products"]',
      );
      await expect(sections.first()).toBeVisible();
      for (const section of await sections.all()) {
        await expectFeaturedSectionAligned(section);
      }
    }
  });
}
