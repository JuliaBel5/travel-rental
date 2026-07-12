import { test, expect } from "@playwright/test";

import { fillStable, gotoHydrated, loginViaUi, registerViaApi, submitLogin, uniqueUser } from "./helpers";

test.describe("authentication", () => {
  test("signup auto-logs in and the header shows the user", async ({ page }) => {
    const user = uniqueUser("signup");

    await gotoHydrated(page, "/signup");
    await fillStable(page.getByLabel("Имя"), user.name);
    await fillStable(page.getByLabel("Эл. почта"), user.email);
    await fillStable(page.getByLabel("Пароль"), user.password);
    await page.getByRole("button", { name: "Создать аккаунт" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/signup"));
    await expect(page.getByRole("banner")).toContainText(user.name);
    await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
  });

  test("wrong password shows an error, correct one signs in, sign-out works", async ({
    page,
    request,
  }) => {
    const user = uniqueUser("login");
    await registerViaApi(request, user);

    // Wrong password → inline error, still on /login.
    await submitLogin(page, user.email, "wrong-password-1");
    await expect(page.getByText("Неверная почта или пароль.")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/login");

    // Correct password → signed in.
    await loginViaUi(page, user);
    await expect(page.getByRole("banner")).toContainText(user.name);

    // Sign out → guest header again.
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  });

  test("guest is redirected from /booking to /login with callbackUrl", async ({ page }) => {
    await page.goto("/booking?id=l10&checkIn=2027-05-10&checkOut=2027-05-14&guests=2");
    await page.waitForURL((url) => url.pathname === "/login");
    expect(page.url()).toContain("callbackUrl=");
  });

  test("guest is redirected from /bookings to /login", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForURL((url) => url.pathname === "/login");
  });
});
