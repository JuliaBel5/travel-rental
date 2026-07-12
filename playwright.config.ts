import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3199);
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E suite. Requires a built app (`pnpm build`) and a reachable Postgres
 * from `.env` (locally: the Docker container; in CI: the service container).
 *
 * Tests share one database and one server process (rate-limit counters live
 * in server memory), so the suite runs serially in a fixed file order:
 * auth → booking → rate-limit. The rate-limit spec intentionally runs last —
 * it exhausts attempt budgets.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
