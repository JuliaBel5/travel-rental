import { test, expect } from "@playwright/test";

import { gotoHydrated, loginViaUi, registerViaApi, uniqueUser } from "./helpers";

/**
 * Full booking lifecycle against listing l10 (santorini-cave-house) on fixed
 * far-future dates. The final cancellation doubles as DB cleanup, so the
 * suite leaves no bookings behind.
 */
const LISTING_ID = "l10";
const LISTING_SLUG = "santorini-cave-house";
const CHECK_IN = "2027-05-10";
const CHECK_OUT = "2027-05-14";

test.describe("booking lifecycle", () => {
  const user = uniqueUser("booking");

  test.beforeAll(async ({ request }) => {
    await registerViaApi(request, user);
  });

  test("POST /api/bookings without a session → 401", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: { listingId: LISTING_ID, checkIn: CHECK_IN, checkOut: CHECK_OUT, guests: 2 },
    });
    expect(res.status()).toBe(401);
  });

  test("book → confirm → picker disables taken nights → overlap 409 → cancel", async ({
    page,
  }) => {
    await loginViaUi(page, user);

    // 1. Review page → reserve.
    await gotoHydrated(page, `/booking?id=${LISTING_ID}&checkIn=${CHECK_IN}&checkOut=${CHECK_OUT}&guests=2`);
    await expect(page.getByRole("heading", { name: "Подтверждение брони" })).toBeVisible();
    await expect(page.getByText("Бронирование от имени")).toBeVisible();
    await page.getByRole("button", { name: "Подтвердить бронирование" }).click();

    // 2. Confirmation page.
    await page.waitForURL((url) => url.pathname === "/booking/confirm");
    await expect(page.getByRole("heading", { name: "Бронирование подтверждено!" })).toBeVisible();

    // 3. The listing's date picker grays out booked nights; check-out day stays free.
    await gotoHydrated(page, `/listings/${LISTING_SLUG}`);
    await page.getByRole("button", { name: "Даты" }).click();
    const bookedNight = page.locator('td button[data-day="10.05.2027"]');
    for (let hop = 0; hop < 14 && !(await bookedNight.count()); hop++) {
      await page
        .getByRole("button", { name: /след|next/i })
        .first()
        .click();
    }
    await expect(bookedNight).toBeDisabled();
    await expect(page.locator('td button[data-day="12.05.2027"]')).toBeDisabled();
    await expect(page.locator('td button[data-day="14.05.2027"]')).toBeEnabled();

    // 4. Overlapping range is rejected with the friendly 409 message.
    await gotoHydrated(page, `/booking?id=${LISTING_ID}&checkIn=2027-05-12&checkOut=2027-05-16&guests=2`);
    await page.getByRole("button", { name: "Подтвердить бронирование" }).click();
    await expect(page.getByText("Эти даты уже заняты. Выберите другие.")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/booking");

    // 5. My bookings lists the stay; two-step cancel removes it (and cleans up).
    await gotoHydrated(page, "/bookings");
    await expect(page.getByRole("main")).toContainText("Пещерный дом на Санторини");
    await page.getByRole("button", { name: "Отменить", exact: true }).click();
    await page.getByRole("button", { name: "Точно отменить?" }).click();
    await expect(page.getByText("Пока нет бронирований")).toBeVisible();
  });

  test("cancelling someone else's booking id → 404, no session → 401", async ({ request }) => {
    const unauth = await request.delete("/api/bookings/does-not-exist");
    expect(unauth.status()).toBe(401);
  });
});
