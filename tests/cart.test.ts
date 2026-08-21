import { expect, test } from "@playwright/test";

test.describe("Cart", () => {
  test("browses from the homepage and adds a product to cart", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /^View / })
      .first()
      .click();

    await expect(page).toHaveURL(/\/products\//);
    await page.locator('[data-test="add-to-cart"]').click();

    const cart = page.getByRole("dialog", { name: "Cart" });
    await expect(cart).toBeVisible();
    await expect(cart.getByText("Subtotal", { exact: true })).toBeVisible();
    await expect(cart.getByRole("link", { name: "View cart" })).toBeVisible();
    await expect(cart.getByRole("button", { name: "Checkout" })).toBeVisible();
  });
});
