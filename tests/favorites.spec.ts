import { test, expect } from "@playwright/test";

import { gotoHydrated, loginViaUi, registerViaApi, uniqueUser } from "./helpers";

test.describe("favorites", () => {
  test("GET /api/favorites without a session → 401", async ({ request }) => {
    const res = await request.get("/api/favorites");
    expect(res.status()).toBe(401);
  });

  test("guest clicking the heart is sent to /login", async ({ page }) => {
    await gotoHydrated(page, "/listings");
    await page.getByRole("button", { name: "В избранное" }).first().click();
    await page.waitForURL((url) => url.pathname === "/login");
    expect(page.url()).toContain("callbackUrl=");
  });

  test("save → favorites page lists it → unsave → empty state", async ({ page, request }) => {
    const user = uniqueUser("fav");
    await registerViaApi(request, user);
    await loginViaUi(page, user);

    // Save the first catalog card (Santorini, the top-rated one). The heart
    // flips optimistically, so wait for the server write before navigating.
    await gotoHydrated(page, "/listings");
    const saved = page.waitForResponse(
      (res) =>
        res.url().includes("/api/favorites/") && res.request().method() === "PUT" && res.ok(),
    );
    await page.getByRole("button", { name: "В избранное" }).first().click();
    await expect(page.getByRole("button", { name: "Убрать из избранного" }).first()).toBeVisible();
    await saved;

    // It shows up on /favorites.
    await gotoHydrated(page, "/favorites");
    await expect(page.getByRole("main")).toContainText("Пещерный дом на Санторини");

    // Unsave right on the favorites page → empty state.
    const removed = page.waitForResponse(
      (res) =>
        res.url().includes("/api/favorites/") && res.request().method() === "DELETE" && res.ok(),
    );
    await page.getByRole("button", { name: "Убрать из избранного" }).click();
    await removed;
    await gotoHydrated(page, "/favorites");
    await expect(page.getByText("В избранном пока пусто")).toBeVisible();
  });
});
