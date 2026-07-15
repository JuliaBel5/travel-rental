# Feature: Account

## Purpose

A signed-in user's self-service area: edit display name, upload or remove an avatar, change password, see membership info and counts, and delete the account.

## Routes and files it owns

| Path                            | File                                | Notes                                               |
| ------------------------------- | ----------------------------------- | --------------------------------------------------- |
| `/account`                      | `src/pages/account/index.tsx`       | Profile, avatar, password, danger zone (auth-gated) |
| `GET/PATCH/DELETE /api/account` | `src/pages/api/account/index.ts`    | Read, edit, delete the caller                       |
| `POST /api/account/password`    | `src/pages/api/account/password.ts` | Change password (rate-limited)                      |

Data helpers: `getUserProfile`, `updateUserProfile`, `changeUserPassword`, `deleteUserAccount` in `src/lib/data.ts`. Avatar UI: `src/components/account/UserAvatar.tsx`. Header chip: `src/components/layout/AuthMenu.tsx`.

## Business rules

- **Auth-gated (SSR).** `/account` redirects to `/login?callbackUrl=/account` when there is no session.
- **Profile is read fresh from the DB**, never from the JWT (see EC-002). `getServerSideProps` calls `getUserProfile(session.user.id)`.
- **Avatars are base64 data-URLs.** The browser downscales any picked image to a 256x256 JPEG (`fileToAvatarDataUrl`) and `PATCH`es it to `/api/account`. The server validates the data-URL prefix and size (`data:image/(jpeg|png|webp);base64,`, max 200,000 chars). The avatar is served by `GET /api/account`, never placed in the session (see EC-001, EC-003).
- **Name changes refresh the header without a re-login** via the NextAuth `update` trigger (see EC-002).
- **Password change** verifies the current password (`changeUserPassword` compares the hash), is rate-limited to 10 attempts per IP+account per 15 minutes, and returns `403` for a wrong current password, `429` when over budget.
- **Account deletion keeps booking history** (see EC-004).

## Edge cases

## EC-001: Base64 avatar must never enter the JWT

- **Symptom**: With the avatar in the session, the session cookie can exceed the 4KB limit and auth silently breaks.
- **Root cause**: NextAuth copies `user.image` to `token.picture` at sign-in, and an avatar data-URL is ~100KB.
- **Fix**: The `jwt` callback sets `token.picture = null` on every pass, and the `session` callback sets `session.user.image = null`. The header fetches the avatar from `GET /api/account` instead (`src/lib/auth.ts`):

```ts
// The avatar is a base64 data-URL that can be ~100KB — far past the 4KB
// cookie limit. NextAuth copies user.image → token.picture at sign-in, so
// strip it on every pass. Avatars are served via /api/account instead.
token.picture = null;
```

- **Regression test**: `tests/account.spec.ts`; upload an avatar and confirm auth still works and the cookie stays small.
- **Related skill**: `docs/skills/ui-components.md` (the `<img>` rule for data-URLs).
- **Stay-aware**: Never route `user.image` into the token or session. Serve it from `/api/account`.

## EC-002: The JWT is a stale snapshot of name and image

- **Symptom**: After changing the display name, the account page or header still shows the old one.
- **Root cause**: JWT sessions capture `name`/`image` at sign-in and do not auto-refresh.
- **Fix**: Two parts. (1) The account page reads the profile fresh from Prisma in `getServerSideProps` (`getUserProfile`), not from the session. (2) After a name `PATCH`, the client calls `useSession().update({ name })`, and the `jwt` callback accepts the new name on the `"update"` trigger:

```tsx
// src/pages/account/index.tsx
await update({ name: values.name }); // refresh header without re-login
```

```ts
// src/lib/auth.ts
if (trigger === "update" && session && typeof session === "object") {
  const nextName = (session as { name?: unknown }).name;
  if (typeof nextName === "string") token.name = nextName;
}
```

- **Regression test**: `tests/account.spec.ts`; change the name and confirm the header updates without a reload or re-login.
- **Stay-aware**: Render profile data from a fresh DB read; only the name is trusted from the client `update` (never an image).

## EC-003: Header avatar must refetch when the name changes

- **Symptom**: The header still shows the old avatar (or initials) right after a profile save.
- **Root cause**: The avatar is intentionally not in the session, so the header must fetch it, and it needs to know when to refetch.
- **Fix**: `AuthMenu` fetches `/api/account` when authenticated and re-runs the effect when `sessionName` changes, so a name update (which flows through `useSession().update`) also refreshes the avatar chip.
- **Regression test**: Change the avatar and name; the header chip updates.
- **Stay-aware**: Keep `sessionName` in the effect's dependency list.

## EC-004: Deleting an account must not delete booking history

- **Symptom**: Removing a user could destroy past reservations that the listing side still needs.
- **Root cause**: A naive cascade would delete the user's bookings.
- **Fix**: `deleteUserAccount` runs a `prisma.$transaction` that deletes favorites, nulls `Booking.userId` (the column is nullable), then deletes the user, atomically:

```ts
await prisma.$transaction([
  prisma.favorite.deleteMany({ where: { userId } }),
  prisma.booking.updateMany({ where: { userId }, data: { userId: null } }),
  prisma.user.delete({ where: { id: userId } }),
]);
```

- **Regression test**: `tests/account.spec.ts`; delete an account and confirm its bookings survive (orphaned) while favorites are gone.
- **Related skill**: `docs/skills/data-access.md`.
- **Stay-aware**: Bookings outlive users on purpose; keep `userId` nullable and null it on delete.

## EC-005: Avatar PATCH validates format and size

- **Symptom**: A client could send an arbitrary or oversized string as `image`.
- **Root cause**: The avatar arrives as a client-built data-URL.
- **Fix**: `PATCH /api/account` validates with a Zod union: `null` or a string matching `^data:image/(jpeg|png|webp);base64,` capped at `MAX_IMAGE_CHARS` (200,000). It also rejects a body with nothing to update.
- **Regression test**: `PATCH` a non-image string and expect `400`.
- **Related skill**: `docs/skills/forms.md`.
- **Stay-aware**: Keep server-side validation on the image; the client downscale is UX, not a guarantee.
