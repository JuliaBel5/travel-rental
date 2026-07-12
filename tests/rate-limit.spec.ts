import { test, expect } from "@playwright/test";

import { submitLogin, uniqueUser } from "./helpers";

/**
 * Runs LAST (file order is alphabetical, the suite is serial): these tests
 * deliberately exhaust in-memory attempt budgets on the shared server.
 */
test.describe("rate limiting", () => {
  test("6th failed login for one account is blocked with a dedicated message", async ({
    page,
  }) => {
    const email = uniqueUser("rl-login").email; // never registered → all attempts fail

    for (let attempt = 1; attempt <= 5; attempt++) {
      await submitLogin(page, email, `wrong-${attempt}`);
      await expect(page.getByText("Неверная почта или пароль.")).toBeVisible();
    }

    await submitLogin(page, email, "wrong-6");
    await expect(page.getByText("Слишком много попыток входа. Попробуйте позже.")).toBeVisible();
  });

  test("registration is capped per IP with 429 + Retry-After", async ({ request }) => {
    let sawTooMany = false;

    // Budget is 5 per window; earlier specs already consumed part of it.
    for (let attempt = 1; attempt <= 8; attempt++) {
      const res = await request.post("/api/register", {
        data: { name: "x", email: "not-an-email", password: "short" },
      });
      if (res.status() === 429) {
        expect(Number(res.headers()["retry-after"])).toBeGreaterThan(0);
        sawTooMany = true;
        break;
      }
      expect(res.status()).toBe(400); // invalid payload, but the attempt still counts
    }

    expect(sawTooMany, "expected a 429 within 8 attempts").toBe(true);
  });
});
