# Feature: Auth (login, signup, session)

## Purpose

Email and password accounts with sign-up, sign-in, and JWT sessions. Login and registration are rate-limited to blunt credential stuffing and signup spam.

## Routes and files it owns

| Path                      | File                                  | Notes                         |
| ------------------------- | ------------------------------------- | ----------------------------- |
| `/login`                  | `src/pages/login.tsx`                 | Sign-in form                  |
| `/signup`                 | `src/pages/signup.tsx`                | Register + auto sign-in       |
| `/api/auth/[...nextauth]` | `src/pages/api/auth/[...nextauth].ts` | NextAuth handler              |
| `POST /api/register`      | `src/pages/api/register.ts`           | Create account (rate-limited) |

Core config: `src/lib/auth.ts` (`authOptions`). Rate limiter: `src/lib/rate-limit.ts`. Session type augmentation: `src/types/next-auth.d.ts`.

## Business rules

- **Credentials provider, JWT sessions** (`session: { strategy: "jwt" }`). There is no DB session table. Passwords are hashed with `bcryptjs` (cost 10).
- **`session.user.id` is always present** because the `jwt` callback stores `token.id = user.id` and the `session` callback copies it back. Gate pages and routes on it (see `docs/skills/auth-gated-page.md`).
- **Sign-in page is `/login`** (`pages: { signIn: "/login" }`). Signup registers, then calls `signIn("credentials", { redirect: false })` and routes to `callbackUrl`.
- **Registration is capped at 5 accounts per IP per 15 minutes**; login is capped per IP (20) and per IP+account (5), counting only failed attempts.

## Login rate limiting (count failures only)

`authorize` peeks the limiter first, so a request that is already over budget is rejected without spending more of the window; only real failures consume, and a success resets the account bucket (`src/lib/auth.ts`):

```ts
// Only failures are counted; peek here so a blocked try doesn't extend the window.
if (
  !isRateLimited(ipKey, LOGIN_IP_LIMIT).ok ||
  !isRateLimited(accountKey, LOGIN_ACCOUNT_LIMIT).ok
) {
  throw new Error(RATE_LIMITED_ERROR);
}
const user = await prisma.user.findUnique({ where: { email } });
const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
if (!user || !valid) {
  consumeRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
  consumeRateLimit(accountKey, LOGIN_ACCOUNT_LIMIT, LOGIN_WINDOW_MS);
  return null;
}
resetRateLimit(accountKey);
```

Registration consumes one unit up front and returns `429` with `Retry-After` when over budget (`src/pages/api/register.ts`).

## Edge cases

## EC-001: A blocked login must not extend its own lockout

- **Symptom**: Hammering login could keep resetting the window and lock a user out forever.
- **Root cause**: If every attempt (including blocked ones) counted, the window would never drain.
- **Fix**: Peek with `isRateLimited` before checking the password, and only `consumeRateLimit` on an actual failure. A success calls `resetRateLimit(accountKey)`.
- **Regression test**: `tests/rate-limit.spec.ts`.
- **Related skill**: `docs/skills/e2e.md`.
- **Stay-aware**: Keep the peek-then-consume split; do not consume on the guard path.

## EC-002: The thrown error string is the client error code

- **Symptom**: The login form needs to tell "wrong password" apart from "rate limited".
- **Root cause**: NextAuth surfaces a thrown `authorize` error message as the client-side `signIn` error code.
- **Fix**: `authorize` throws `RATE_LIMITED_ERROR` (`"RATE_LIMITED"`, exported from `src/lib/auth.ts`); the form matches that code and shows the "too many attempts" string. A plain bad credential returns `null` (generic error).
- **Regression test**: Exceed the login limit and confirm the form shows the rate-limit message, not the generic one.
- **Stay-aware**: If you rename `RATE_LIMITED_ERROR`, update the login page that reads it.

## EC-003: Duplicate email and normalization

- **Symptom**: The same email could register twice with different casing.
- **Root cause**: Emails are case-insensitive in practice but stored as given.
- **Fix**: `register` lowercases and trims the email before the uniqueness check, returns `409` when it already exists, and `User.email` is `@unique`.
- **Regression test**: `tests/auth.spec.ts`; register the same email twice and expect `409`.
- **Related skill**: `docs/skills/forms.md`.
- **Stay-aware**: Normalize email (`trim().toLowerCase()`) anywhere you look a user up by it.

## EC-004: The limiter is in-memory, per process

- **Symptom**: On serverless, each warm instance keeps its own counters, so the cap is soft.
- **Root cause**: `src/lib/rate-limit.ts` stores buckets in a module-level `Map`, scoped to one Node process.
- **Fix**: Accepted for this demo (raises the cost of abuse). For a hard global cap, swap the `Map` for a shared store (Redis/Upstash) behind the same interface.
- **Stay-aware**: Do not assume the limit is globally exact in production; the interface is the contract, the store is swappable.
