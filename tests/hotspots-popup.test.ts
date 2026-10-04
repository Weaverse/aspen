import { expect, test } from "@playwright/test";

test("Hotspots cards escape clipped images and open the shared Quick Add", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1000 });
  await page.goto("/");
  const section = page.locator('[data-wv-type="hotspots"]').first();
  test.skip((await section.count()) === 0, "Store has no Hotspots section");
  const markers = section.locator(
    '[data-wv-type="hotspots--item"] button:visible',
  );
  test.skip((await markers.count()) === 0, "Hotspots fixture has no markers");
  await expect(markers.first()).toBeVisible();

  for (let index = 0; index < (await markers.count()); index += 1) {
    await markers.nth(index).hover();
    const popup = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popup).toBeVisible();
    expect(
      await popup.evaluate((element) =>
        Boolean(element.closest('[data-wv-type="hotspots-image"]')),
      ),
    ).toBe(false);
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    if (bounds) {
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000);
    }
    await expect(
      popup.getByRole("button", { name: "Select options", exact: true }),
    ).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
  }

  await markers.last().hover();
  await page
    .locator("[data-radix-popper-content-wrapper]")
    .getByRole("button", {
      name: "Select options",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-radix-popper-content-wrapper]")).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(markers.last()).toBeFocused();
});

test("Hotspots preserve the selected swatch when opening Quick Add", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1000 });
  await page.goto("/");
  const markers = page
    .locator('[data-wv-type="hotspots"]')
    .first()
    .locator('[data-wv-type="hotspots--item"] button:visible');
  test.skip((await markers.count()) === 0, "Store has no Hotspots markers");
  for (let index = 0; index < (await markers.count()); index += 1) {
    await markers.nth(index).hover();
    const popup = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popup).toBeVisible();
    const swatches = popup.locator("button:not([aria-label])");
    if ((await swatches.count()) > 1) {
      const color = await swatches.last().textContent();
      await swatches.last().click();
      const pendingRequest = page.waitForRequest((request) =>
        new URL(request.url()).pathname.startsWith("/api/product"),
      );
      await popup
        .getByRole("button", { name: "Select options", exact: true })
        .click();
      const params = new URL((await pendingRequest).url()).searchParams;
      expect([...params.values()]).toContain(color?.trim());
      await expect(page.getByRole("dialog")).toBeVisible();
      return;
    }
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
  }
  test.skip(true, "No hotspot product with multiple swatches in this store");
});
