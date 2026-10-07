import { expect, type Page, test } from "@playwright/test";

const TABLET_MIN_PX = 768;
const DESKTOP_MIN_PX = 1025;
const TABLET_TOOLBAR_CONTENT_GAP_PX = 12;

async function goToCatalogPage(page: Page, catalog: "collection" | "search") {
  if (catalog === "search") {
    await page.goto("/search?q=chair");
    return;
  }

  await page.goto("/collections");
  const collectionPath = await page
    .locator('a[href*="/collections/"]')
    .evaluateAll((links) =>
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

  if (!collectionPath) {
    test.skip(true, "The connected store has no collection page to test");
    return;
  }

  const response = await page.goto(collectionPath);
  if (response?.status() === 404) {
    test.skip(true, `Collection page ${collectionPath} returned 404`);
  }
}

for (const catalog of ["collection", "search"] as const) {
  for (const width of [390, 767, 768, 1024, 1025, 1440]) {
    test(`catalog toolbar on ${catalog}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await goToCatalogPage(page, catalog);
      const header = page.locator("header").filter({ has: page.locator("h1") });
      const title = header.locator("h1:visible");
      await expect(title).toBeVisible();

      if (width >= TABLET_MIN_PX && width < DESKTOP_MIN_PX) {
        const nextContent = header.locator("+ *");
        await expect(nextContent).toHaveCount(1);
        const toolbarPaddingBottom = await header.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingBottom),
        );
        const contentPaddingTop = await nextContent.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingTop),
        );
        expect(toolbarPaddingBottom + contentPaddingTop).toBe(
          TABLET_TOOLBAR_CONTENT_GAP_PX,
        );
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

      const firstItem = items.first();
      const firstItemBounds = await firstItem.boundingBox();
      expect(firstItemBounds).not.toBeNull();
      expect(firstItemBounds?.height).toBeGreaterThanOrEqual(34);

      await firstItem.hover();
      await expect
        .poll(() =>
          firstItem.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        )
        .not.toBe("rgba(0, 0, 0, 0)");

      await page.mouse.move(0, 0);
      await firstItem.focus();
      await expect
        .poll(() =>
          firstItem.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        )
        .not.toBe("rgba(0, 0, 0, 0)");

      const targetItem = items.nth(1);
      const targetHref = await targetItem.getAttribute("href");
      const targetSort = targetHref
        ? new URL(targetHref, page.url()).searchParams.get("sort")
        : null;
      const targetBounds = await targetItem.boundingBox();
      expect(targetSort).not.toBeNull();
      expect(targetBounds).not.toBeNull();
      if (targetBounds) {
        await page.mouse.click(
          targetBounds.x + targetBounds.width - 6,
          targetBounds.y + targetBounds.height / 2,
        );
      }
      await expect
        .poll(() => new URL(page.url()).searchParams.get("sort"))
        .toBe(targetSort);
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
