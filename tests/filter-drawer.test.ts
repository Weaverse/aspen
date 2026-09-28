import { expect, test } from "@playwright/test";

for (const width of [390, 768, 1440]) {
  test(`filter drawer is flush with the viewport at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/collections/chairs");
    await page.getByRole("button", { name: "Filter products" }).click();

    const drawer = page.getByRole("dialog", { name: "Filter" });
    const panel = drawer.locator(":scope > div");
    await expect(panel).toHaveCSS("transform", "none");

    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.y).toBe(0);
    expect(bounds?.height).toBe(900);
    expect(bounds?.x).toBe(width < 768 ? 0 : width - 430);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBe(width);

    const corners = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        left: [style.borderTopLeftRadius, style.borderBottomLeftRadius],
        right: [style.borderTopRightRadius, style.borderBottomRightRadius],
      };
    });
    const flatCorners = width < 768 ? corners.left : corners.right;
    const roundCorners = width < 768 ? corners.right : corners.left;
    expect(flatCorners).toEqual(["0px", "0px"]);
    expect(roundCorners.every((radius) => Number.parseFloat(radius) > 0)).toBe(
      true,
    );

    if (width === 390) {
      await drawer.getByRole("checkbox").first().click();
      await expect(page).toHaveURL(/filter\.variantOption=/);
    }

    await drawer.getByRole("button", { name: "Close filter drawer" }).click();
    await expect(drawer).not.toBeVisible();
  });
}

test("search filters use the same flush drawer", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/search?q=chair");
  await page.getByRole("button", { name: "Filter products" }).click();

  const drawer = page.getByRole("dialog", { name: "Filter" });
  const panel = drawer.locator(":scope > div");
  await expect(panel).toHaveCSS("transform", "none");

  const bounds = await panel.boundingBox();
  expect(bounds).toMatchObject({ x: 338, y: 0, width: 430, height: 900 });
  await drawer.getByRole("button", { name: "Close filter drawer" }).click();
  await expect(drawer).not.toBeVisible();
});
