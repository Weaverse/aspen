import { expect, test } from "@playwright/test";

test("featured products on product pages use the desktop quick shop bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1132 });
  await page.goto("/products/madison-bed", { waitUntil: "networkidle" });

  const card = page
    .locator("article")
    .filter({ has: page.getByRole("button", { name: "Select options" }) })
    .first();
  const quickShop = card.getByRole("button", { name: "Select options" });

  await card.hover();
  await expect(quickShop.getByText("Select options")).toBeVisible();
  await expect(quickShop).toHaveCSS("opacity", "1");

  const buttonBounds = await quickShop.boundingBox();
  if (!buttonBounds) {
    throw new Error("Quick shop button is missing");
  }
  expect(buttonBounds.width).toBeGreaterThan(200);
});

for (const width of [390, 768]) {
  test(`featured products keep the compact quick shop button at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/products/madison-bed", { waitUntil: "networkidle" });

    const card = page
      .locator("article")
      .filter({ has: page.getByRole("button", { name: "Select options" }) })
      .first();
    const quickShop = card.getByRole("button", { name: "Select options" });

    await card.hover();
    await expect(quickShop.getByText("Select options")).toBeHidden();
    const buttonBounds = await quickShop.boundingBox();
    if (!buttonBounds) {
      throw new Error("Quick shop button is missing");
    }
    expect(buttonBounds.width).toBe(48);
  });
}
