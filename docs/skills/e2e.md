# Skill: End-to-end tests (Playwright)

Use this when you add or change Playwright specs. The suite lives in `tests/`, shares `tests/helpers.ts`, and runs against a real built app plus a disposable Postgres (CI in `.github/workflows/ci.yml`).

## Trigger

Read this when you: add a spec, touch `tests/helpers.ts`, or debug a flaky auth/booking test.

## Run it

`pnpm test:e2e` runs Playwright. It needs a production build first (`pnpm build`) and a reachable database, exactly like CI. The default locale is RU, so UI-driven helpers click Russian labels (for example the login button is `Войти`).

## Wait for hydration before typing

The app is server-rendered. Typing into a form before React hydrates loses the input, because React replaces the SSR DOM. `_app.tsx` sets a hydration beacon from a root effect:

```tsx
// src/pages/_app.tsx
useEffect(() => {
  document.documentElement.dataset.hydrated = "true";
}, []);
```

Specs must navigate through `gotoHydrated`, which waits for that beacon:

```ts
// tests/helpers.ts
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector("html[data-hydrated=true]", { state: "attached" });
}
```

## Fill inputs with `fillStable`

React Hook Form uses uncontrolled inputs that a late re-render can reset right after `fill()`. Use `fillStable`, which verifies the value stuck and retries:

```ts
// tests/helpers.ts
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
```

## The rate-limit constraint (minimize signups)

Registration is capped at **5 accounts per IP per 15 minutes** (`src/pages/api/register.ts`), and login counts failed attempts (`src/lib/auth.ts`). From one test-runner IP, that budget is easy to exhaust, which makes a naive suite flake with `429`s. Two conventions keep specs under the cap:

- **Unique credentials per run**, so reruns never collide on the unique `email` column:

```ts
// tests/helpers.ts
export function uniqueUser(tag: string) {
  return {
    name: "E2E Tester",
    email: `e2e-${tag}-${Date.now()}@test.local`,
    password: "e2e-password-1",
  };
}
```

- **Register through the API, not the UI**, so setup does not spend UI form submissions and each account is created once with a `201` assertion:

```ts
// tests/helpers.ts
export async function registerViaApi(request, user): Promise<void> {
  const res = await request.post("/api/register", { data: user });
  expect(res.status(), "register should succeed").toBe(201);
}
```

When you add tests, reuse one account across assertions where possible; do not create a fresh user per `test()` unless the scenario truly needs it. `rate-limit.spec.ts` deliberately drives the limiter, so keep its account usage isolated from other specs.

## Specs and what they cover

- `tests/auth.spec.ts`, sign-up, sign-in, session.
- `tests/booking.spec.ts`, the booking lifecycle including the `409` overlap path and cancellation.
- `tests/favorites.spec.ts`, heart toggle and the saved list.
- `tests/account.spec.ts`, profile, avatar, password, delete.
- `tests/rate-limit.spec.ts`, the login/register limiter.

## Related files

- `tests/helpers.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- Rate-limit behavior: `docs/features/auth.md`, `src/lib/rate-limit.ts`
