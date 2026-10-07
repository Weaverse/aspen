import { expect, type Page, test } from "@playwright/test";
import {
  DESKTOP_MIN_PX,
  MOBILE_MAX_PX,
  TABLET_MAX_PX,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";

const TABLET_TOOLBAR_CONTENT_GAP_PX = 12;
const CATALOG_VIEWPORT_WIDTHS = [
  390,
  MOBILE_MAX_PX,
  TABLET_MIN_PX,
  TABLET_MAX_PX,
  DESKTOP_MIN_PX,
  1440,
];

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
  for (const width of CATALOG_VIEWPORT_WIDTHS) {
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

for (const catalog of ["collection", "search"] as const) {
  for (const width of CATALOG_VIEWPORT_WIDTHS) {
    test(`applied filter tags on ${catalog}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await goToCatalogPage(page, catalog);

      const selectedSort = catalog === "search" ? "price-low-high" : "newest";
      const sortedUrl = new URL(page.url());
      sortedUrl.searchParams.set("sort", selectedSort);
      await page.goto(`${sortedUrl.pathname}${sortedUrl.search}`);

      const header = page.locator("header").filter({ has: page.locator("h1") });
      const toolbarContent = header.locator(":scope > div");
      await header.getByRole("button", { name: "Filter products" }).click();

      const drawer = page.getByRole("dialog", { name: "Filter" });
      const checkbox = drawer.getByRole("checkbox");
      await expect(checkbox.first()).toBeVisible();
      await checkbox.first().click();
      await expect(page).toHaveURL(/filter\./);

      const closeButton = drawer.getByRole("button", {
        name: "Close filter drawer",
      });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      const tags = page.locator("[data-applied-filter-tags]");
      await expect(tags).toBeVisible();
      await expect(tags).toHaveCSS("column-gap", "10px");
      await expect(tags).toHaveCSS("row-gap", "6px");

      const label = tags.getByText("Filtered by:", { exact: true });
      const filterTag = tags.locator("a").first();
      const clearAll = tags.getByRole("link", { name: "Clear all filters" });
      await expect(filterTag).toHaveAccessibleName(/^Remove .+ filter$/);
      expect(
        await filterTag.evaluate((element) =>
          element.previousElementSibling?.hasAttribute(
            "data-filtered-by-label",
          ),
        ),
      ).toBe(true);
      await expect(label).toHaveCSS("color", "rgb(82, 75, 70)");
      await expect(label).toHaveCSS("font-family", /DM Sans/);
      await expect(label).toHaveCSS("font-size", "14px");
      await expect(label).toHaveCSS("font-weight", "600");
      await expect(label).toHaveCSS("line-height", "22.4px");
      await expect(label).toHaveCSS("letter-spacing", "0.28px");

      await expect(filterTag).toHaveCSS("color", "rgb(82, 75, 70)");
      await expect(filterTag).toHaveCSS("font-family", /DM Sans/);
      await expect(filterTag).toHaveCSS("font-size", "14px");
      await expect(filterTag).toHaveCSS("font-weight", "400");
      await expect(filterTag).toHaveCSS("line-height", "14px");
      await expect(filterTag).toHaveCSS("padding", "6px 8px");
      await expect(filterTag).toHaveCSS("border-radius", "12px");
      await expect(filterTag).toHaveCSS("border-width", "1px");

      await expect(clearAll).toHaveText("Clear all");
      await expect(clearAll).toHaveCSS("font-weight", "400");
      await expect(clearAll).toHaveCSS("line-height", "22.4px");
      await expect(clearAll).toHaveCSS("letter-spacing", "0.14px");
      await expect(clearAll).toHaveCSS("text-decoration-line", "underline");

      const [toolbarBounds, tagsBounds, labelBounds, tagBounds, clearBounds] =
        await Promise.all([
          toolbarContent.boundingBox(),
          tags.boundingBox(),
          label.boundingBox(),
          filterTag.boundingBox(),
          clearAll.boundingBox(),
        ]);
      expect(toolbarBounds).not.toBeNull();
      expect(tagsBounds).not.toBeNull();
      expect(labelBounds).not.toBeNull();
      expect(tagBounds).not.toBeNull();
      expect(clearBounds).not.toBeNull();
      if (
        toolbarBounds &&
        tagsBounds &&
        labelBounds &&
        tagBounds &&
        clearBounds
      ) {
        expect(tagsBounds.y - (toolbarBounds.y + toolbarBounds.height)).toBe(
          12,
        );
        expect(tagBounds.x - (labelBounds.x + labelBounds.width)).toBe(18);
        expect(clearBounds.x - (tagBounds.x + tagBounds.width)).toBe(18);
      }

      await clearAll.click();
      await expect(tags).not.toBeVisible();
      expect(new URL(page.url()).searchParams.get("sort")).toBe(selectedSort);
      if (catalog === "search") {
        expect(new URL(page.url()).searchParams.get("q")).toBe("chair");
      }
    });
  }
}

test("an applied tag removes only its own filter and preserves catalog state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/search?q=chair&sort=price-low-high");
  const header = page.locator("header").filter({ has: page.locator("h1") });
  await header.getByRole("button", { name: "Filter products" }).click();

  const drawer = page.getByRole("dialog", { name: "Filter" });
  const checkbox = drawer.getByRole("checkbox").first();
  await expect(checkbox).toBeVisible();
  await checkbox.click();
  await expect(page).toHaveURL(/filter\./);

  const closeButton = drawer.getByRole("button", {
    name: "Close filter drawer",
  });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  const tags = page.locator("[data-applied-filter-tags]");
  const filterTag = tags.locator("a").first();
  const currentUrl = new URL(page.url());
  const tagHref = await filterTag.getAttribute("href");
  expect(tagHref).not.toBeNull();
  const targetUrl = new URL(tagHref ?? "", page.url());
  const currentFilters = Array.from(currentUrl.searchParams.keys()).filter(
    (key) => key.startsWith("filter."),
  );
  const targetFilters = Array.from(targetUrl.searchParams.keys()).filter(
    (key) => key.startsWith("filter."),
  );
  expect(targetFilters).toHaveLength(currentFilters.length - 1);

  await filterTag.click();
  await expect(tags).not.toBeVisible();
  const nextUrl = new URL(page.url());
  expect(nextUrl.searchParams.get("q")).toBe("chair");
  expect(nextUrl.searchParams.get("sort")).toBe("price-low-high");
});
