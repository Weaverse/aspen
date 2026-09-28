import { expect, test } from "@playwright/test";

test.describe("Cart", () => {
  test("adds from empty-cart best sellers without losing the submitting form", async ({
    page,
  }) => {
    test.slow();
    await page.goto("/");
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const cart = page.getByRole("dialog", { name: "Cart", exact: true });
    await expect(
      cart.getByText("Shop Best Sellers", { exact: true }),
    ).toBeVisible();
    await cart
      .locator("article")
      .first()
      .getByRole("button", {
        name: /quick shop|select options/i,
      })
      .click();
    const quickShop = page.getByRole("dialog", {
      name: "Product",
      exact: true,
    });
    const addButton = quickShop.locator('[data-test="add-to-cart"]');
    await expect(addButton).toBeEnabled();
    const productTitle = (await quickShop.locator("h4").innerText()).trim();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /\/cart(?:\.data)?$/.test(new URL(request.url()).pathname)
      ) {
        requests.push(request.url());
      }
    });
    await addButton.click();
    await expect.poll(() => requests.length).toBe(1);
    await expect(quickShop).not.toBeVisible();
    await expect(
      cart.getByRole("link", { name: productTitle }).first(),
    ).toBeVisible();
    await expect(
      cart
        .getByRole("group", { name: /quantity, 1/i })
        .or(
          cart
            .getByRole("combobox", { name: "Select quantity" })
            .filter({ hasText: /^QTY\s*1$/i }),
        ),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    await expect(
      cart.getByRole("link", { name: productTitle }).first(),
    ).toBeVisible();
    await expect(
      cart
        .getByRole("group", { name: /quantity, 1/i })
        .or(
          cart
            .getByRole("combobox", { name: "Select quantity" })
            .filter({ hasText: /^QTY\s*1$/i }),
        ),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  test("adds a product and completes the cart flow", async ({ page }) => {
    test.slow();
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

    const increaseQuantity = cart.getByRole("button", {
      name: /increase quantity/i,
    });
    await expect(increaseQuantity).toBeEnabled();
    await increaseQuantity.click();
    await increaseQuantity.click();

    await expect(
      cart.getByRole("group", { name: /quantity, 3/i }),
    ).toBeVisible();
    await cart.getByRole("button", { name: "Close cart drawer" }).click();
    await expect(cart).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Open cart" })).toContainText(
      "3",
    );

    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(cart).toBeVisible();
    await expect(
      cart.getByRole("group", { name: /quantity, 3/i }),
    ).toBeVisible();
    await expect(subtotalAmount).not.toHaveText(initialSubtotal);

    await Promise.all([
      page.waitForURL(/\/cart$/),
      cart.getByRole("link", { name: "View cart" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Open cart" })).toContainText(
      "3",
    );
    await expect(
      page.getByRole("button", { name: "Discount code", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Giftcard", exact: true }),
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/checkout|checkouts|\/cart\/c\//i),
      page.getByRole("button", { name: "Checkout" }).click(),
    ]);
  });

  test("keeps the authoritative cart after an optimistic row unmounts", async ({
    page,
  }) => {
    test.slow();
    await page.goto("/products/philippe-accent-chair");
    const productTitle = (await page.locator("h1").first().innerText()).trim();
    await page.locator('[data-test="add-to-cart"]').click();

    const cart = page.getByRole("dialog", { name: "Cart" });
    const productLink = cart.getByRole("link", { name: productTitle }).first();
    await expect(productLink).toBeVisible();
    const removeButton = cart.getByRole("button", {
      name: `Remove ${productTitle} from cart`,
    });
    await expect(removeButton).toBeEnabled();
    await removeButton.click();

    await expect(productLink).not.toBeVisible();
    await expect(
      cart.getByRole("link", { name: "Start Shopping" }),
    ).toBeVisible();
    await cart.getByRole("button", { name: "Close cart drawer" }).click();
    await expect(
      page.getByRole("button", { name: "Open cart" }),
    ).not.toContainText("1");

    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(
      cart.getByRole("link", { name: "Start Shopping" }),
    ).toBeVisible();
  });

  test("keeps a quick-shop add after the modal unmounts", async ({ page }) => {
    test.slow();
    await page.goto("/collections/tables");
    const quickShopButton = page
      .getByRole("button", { name: /quick shop|select options/i })
      .first();
    await expect(quickShopButton).toBeEnabled();
    await quickShopButton.press("Enter");

    const quickShop = page.getByRole("dialog", { name: "Product" });
    await expect(quickShop).toBeVisible();
    const productTitle = (await quickShop.locator("h4").innerText()).trim();
    const addButton = quickShop.locator('[data-test="add-to-cart"]');
    await expect(addButton).toBeEnabled();
    await addButton.click();

    const cart = page.getByRole("dialog", { name: "Cart" });
    await expect(cart).toBeVisible();
    await expect(quickShop).not.toBeVisible();
    await expect(
      cart.getByRole("link", { name: productTitle }).first(),
    ).toBeVisible();
    await expect(cart.getByText("Subtotal", { exact: true })).toBeVisible();
  });
});
