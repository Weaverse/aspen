import { expect, test } from "@playwright/test";

for (const width of [390, 768, 1520]) {
  test(`featured products align cards 40px below content at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/products/madison-bed", { waitUntil: "networkidle" });

    const section = page
      .locator('section[data-wv-type="featured-products"]')
      .first();
    await section.scrollIntoViewIfNeeded();
    await section.locator(".swiper.swiper-initialized").first().waitFor();

    const content = section.locator(
      '[data-wv-type="featured-content-products"]',
    );
    const heading = content.locator(".heading").first();
    const cards = section.locator(".swiper-slide article");
    const contentBounds = await content.boundingBox();
    const headingBounds = await heading.boundingBox();
    const imageBounds = await cards
      .first()
      .locator("img")
      .first()
      .boundingBox();
    if (!contentBounds || !headingBounds || !imageBounds) {
      throw new Error("Featured Products content or card image is missing");
    }

    expect(
      Math.abs(imageBounds.y - (contentBounds.y + contentBounds.height) - 40),
    ).toBeLessThan(1);

    if (width >= 768) {
      expect(Math.abs(imageBounds.x - headingBounds.x)).toBeLessThan(1);

      const secondImage = await cards
        .nth(1)
        .locator("img")
        .first()
        .boundingBox();
      const thirdImage = await cards
        .nth(2)
        .locator("img")
        .first()
        .boundingBox();
      if (!secondImage || !thirdImage) {
        throw new Error("Featured Products row has fewer than three images");
      }
      const firstGap = secondImage.x - (imageBounds.x + imageBounds.width);
      const secondGap = thirdImage.x - (secondImage.x + secondImage.width);
      expect(Math.abs(firstGap - secondGap)).toBeLessThan(1);
      expect(
        Math.abs(
          contentBounds.x +
            contentBounds.width -
            (thirdImage.x + thirdImage.width),
        ),
      ).toBeLessThan(1);
    }
  });
}
