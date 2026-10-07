import { expect, test } from "@playwright/test";

for (const path of ["/collections/chairs", "/search?q=chair"]) {
  for (const width of [390, 767, 768, 1024, 1025, 1440]) {
    test(`catalog toolbar at ${path}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const header = page.locator("header").filter({ has: page.locator("h1") });
      const title = header.locator("h1:visible");
      await expect(title).toBeVisible();
      if (path.startsWith("/collections/")) {
        await expect(header).toHaveCSS(
          "padding-bottom",
          width < 768 ? "24px" : width < 1025 ? "0px" : "32px",
        );
        await expect(header.locator("+ div")).toHaveCSS("padding-top", "12px");
      }
      const buttons = header.locator("button[data-layout-context]:visible");
      await expect(buttons).toHaveCount(2);
      await expect(buttons.first()).toHaveCSS("border-left-width", "0px");
      await expect(buttons.last()).toHaveCSS("border-left-width", "1px");

      if (width >= 768) {
        const headingBounds = await title.boundingBox();
        const controlsBounds = await buttons.first().boundingBox();
        expect(headingBounds).not.toBeNull();
        expect(controlsBounds).not.toBeNull();
        if (headingBounds && controlsBounds) {
          expect(
            Math.abs(
              headingBounds.y +
                headingBounds.height / 2 -
                (controlsBounds.y + controlsBounds.height / 2),
            ),
          ).toBeLessThan(1);
        }
      }

      await header.getByRole("button", { name: /^Sort by:/i }).click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(menu).toHaveCSS("width", "240px");
      await expect(menu).toHaveCSS("padding", "24px");
      await expect(menu).toHaveCSS("row-gap", "12px");
      const items = menu.getByRole("menuitem");
      await expect(items.first()).toHaveText(/Relevance/i);
      await expect(menu.locator('[aria-current="true"]')).toHaveCSS(
        "font-weight",
        "600",
      );
      for (const item of await items.all()) {
        await expect(item).toHaveCSS("text-align", "left");
        await expect(item).toHaveCSS("justify-content", "flex-start");
        await expect(item).toHaveCSS("text-transform", "uppercase");
      }
    });
  }
}

test("search clear button follows the existing subtle background token", async ({
  page,
}) => {
  await page.goto("/search?q=chair");
  const form = page
    .locator("form")
    .filter({ has: page.locator('input[name="q"]') });
  const clear = form.getByRole("button", { name: "Clear filters" });
  await expect(clear).toBeVisible();
  await form.evaluate((element) => {
    element.style.setProperty("--color-background-subtle", "rgb(12, 34, 56)");
  });
  await expect(clear).toHaveCSS("background-color", "rgb(12, 34, 56)");
  await expect(clear).toHaveCSS("width", "24px");
  await expect(clear).toHaveCSS("height", "24px");
  await clear.click();
  await expect(form.locator('input[name="q"]')).toHaveValue("");
  await expect(clear).not.toBeVisible();
});
