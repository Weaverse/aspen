import { expect, type Page, test } from "@playwright/test";

async function mountWithStorefrontStyles(page: Page, markup: string) {
  await page.goto("/");
  await page.locator("body").evaluate((body, content) => {
    body.innerHTML = content;
  }, markup);
}

test("Style 1 applies the configured effect only while the card is hovered", async ({
  page,
}) => {
  const markup = `
    <a id="effect-test-card" class="group relative block" style="display: block; height: 320px; width: 320px">
      <div
        class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[var(--collection-overlay-opacity)]"
        style="--collection-overlay-opacity: 0.7; background-color: #b44848"
      ></div>
    </a>
  `;
  await mountWithStorefrontStyles(page, markup);

  const card = page.locator("#effect-test-card");
  const overlay = card.locator("div");
  await expect(overlay).toHaveCSS("background-color", "rgb(180, 72, 72)");
  await expect(overlay).toHaveCSS("opacity", "0");

  await card.hover();
  await expect(overlay).toHaveCSS("opacity", "0.7");
});

test("Style 3 keeps the configured name background unchanged on hover", async ({
  page,
}) => {
  const markup = `
    <a id="effect-test-card" class="group relative block" style="display: block; height: 320px; width: 320px">
      <h3 class="absolute inset-x-0 bottom-0 h-16">
        <span
          class="pointer-events-none absolute inset-0 opacity-[var(--collection-overlay-opacity)]"
          style="--collection-overlay-opacity: 0.7; background-color: #b44848"
        ></span>
      </h3>
    </a>
  `;
  await mountWithStorefrontStyles(page, markup);

  const card = page.locator("#effect-test-card");
  const background = card.locator("span");
  await expect(background).toHaveCSS("background-color", "rgb(180, 72, 72)");
  await expect(background).toHaveCSS("opacity", "0.7");

  await card.hover();
  await expect(background).toHaveCSS("opacity", "0.7");
});
