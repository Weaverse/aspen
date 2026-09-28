import { expect, test } from "@playwright/test";

test("desktop product gallery keeps a square frame beside taller details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1132 });
  await page.goto("/products/madison-bed", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Madison Bed" }),
  ).toBeVisible();

  const gallery = page.locator(".product-media-slider").first().locator("..");
  const imageSlider = gallery.locator(".swiper").first();
  const galleryBounds = await gallery.boundingBox();
  const sliderBounds = await imageSlider.boundingBox();

  if (!galleryBounds || !sliderBounds) {
    throw new Error("Product gallery or image slider is missing");
  }

  expect(Math.abs(galleryBounds.height - galleryBounds.width)).toBeLessThan(1);
  expect(Math.abs(galleryBounds.height - sliderBounds.height)).toBeLessThan(1);
});
