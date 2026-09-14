import { expect, test } from "@playwright/test";

test.describe("Cart", () => {
  test("adds a product and completes the cart flow", async ({ page }) => {
    await page.goto("/products/philippe-accent-chair");

    await expect(page).toHaveURL(/\/products\/philippe-accent-chair/);
    const productTitle = (await page.locator("h1").first().innerText()).trim();
    await page.locator('[data-test="add-to-cart"]').click();

    const cart = page.getByRole("dialog", { name: "Cart" });
    await expect(cart).toBeVisible();
    await expect(cart.getByText("Subtotal", { exact: true })).toBeVisible();
    await expect(
      cart.getByRole("link", { name: productTitle }).first(),
    ).toBeVisible();

    const subtotalRow = cart
      .getByText("Subtotal", { exact: true })
      .locator("..");
    const subtotalAmount = subtotalRow.locator("span").nth(1);
    const initialSubtotal = await subtotalAmount.innerText();

    const quantitySelect = cart.getByRole("combobox", {
      name: /select quantity/i,
    });
    await quantitySelect.click();
    await page.getByRole("option", { name: "2", exact: true }).click();

    await expect(quantitySelect).toContainText("2");
    await expect(subtotalAmount).not.toHaveText(initialSubtotal);

    await Promise.all([
      page.waitForURL(/checkout|checkouts|\/cart\/c\//i),
      cart.getByRole("button", { name: "Checkout" }).click(),
    ]);
  });
});
