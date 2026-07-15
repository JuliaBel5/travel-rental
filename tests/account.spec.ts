import { test, expect } from "@playwright/test";

import { fillStable, gotoHydrated, loginViaUi, uniqueUser } from "./helpers";

test.describe("account", () => {
  test("guest is redirected from /account to /login", async ({ page }) => {
    await page.goto("/account");
    await page.waitForURL((url) => url.pathname === "/login");
    expect(page.url()).toContain("callbackUrl=");
  });

  test("edit display name and change password from the account page", async ({ page }) => {
    const user = uniqueUser("account");

    // Sign up (auto-logs in) so we have a fresh, signed-in account.
    await gotoHydrated(page, "/signup");
    await fillStable(page.getByLabel("Имя"), user.name);
    await fillStable(page.getByLabel("Эл. почта"), user.email);
    await fillStable(page.getByLabel("Пароль"), user.password);
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/signup"));

    // Change the display name → the header chip reflects it without a re-login.
    await gotoHydrated(page, "/account");
    const newName = "Обновлённое Имя";
    await fillStable(page.getByLabel("Отображаемое имя"), newName);
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Изменения сохранены")).toBeVisible();
    await expect(page.getByRole("banner")).toContainText(newName);

    // Change the password.
    const newPassword = "new-e2e-password-2";
    await fillStable(page.getByLabel("Текущий пароль"), user.password);
    await fillStable(page.getByLabel("Новый пароль"), newPassword);
    await page.getByRole("button", { name: "Обновить пароль" }).click();
    await expect(page.getByText("Пароль обновлён")).toBeVisible();

    // Sign out → guest header again.
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();

    // Sign in with the new password → still signed in as the renamed user.
    await loginViaUi(page, { email: user.email, password: newPassword });
    await expect(page.getByRole("banner")).toContainText(newName);
  });
});
