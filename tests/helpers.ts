import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/** Unique per-run credentials so reruns never collide on the email column. */
export function uniqueUser(tag: string) {
  return {
    name: "E2E Tester",
    email: `e2e-${tag}-${Date.now()}@test.local`,
    password: "e2e-password-1",
  };
}

/**
 * Navigate and wait until React has hydrated. Filling a form before hydration
 * is lost work: React replaces the SSR DOM and the typed values vanish.
 * `_app` sets `data-hydrated` from a root effect, which by definition runs
 * only after the whole tree is interactive.
 */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector("html[data-hydrated=true]", { state: "attached" });
}

/**
 * Fill that survives late re-renders. Uncontrolled inputs (react-hook-form)
 * can be remounted/reset by a render that lands right after `fill()`; verify
 * the value stuck and retry once if it didn't.
 */
export async function fillStable(field: Locator, value: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await field.fill(value);
    try {
      await expect(field).toHaveValue(value, { timeout: 1000 });
      return;
    } catch {
      // re-rendered underneath us — try again
    }
  }
  await expect(field).toHaveValue(value);
}

export async function registerViaApi(
  request: APIRequestContext,
  user: { name: string; email: string; password: string },
): Promise<void> {
  const res = await request.post("/api/register", { data: user });
  expect(res.status(), "register should succeed").toBe(201);
}

/** Sign in through the real login form; resolves once redirected away. */
export async function loginViaUi(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await gotoHydrated(page, "/login");
  await fillStable(page.getByRole("textbox").first(), user.email);
  await fillStable(page.getByRole("textbox").nth(1), user.password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Submit the login form with given credentials (page must be on /login). */
export async function submitLogin(page: Page, email: string, password: string): Promise<void> {
  await gotoHydrated(page, "/login");
  await fillStable(page.getByRole("textbox").first(), email);
  await fillStable(page.getByRole("textbox").nth(1), password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
}
