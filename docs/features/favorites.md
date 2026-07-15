# Feature: Favorites

## Purpose

Let a signed-in user save stays with a heart toggle on any listing card and review them on a dedicated page. Toggling feels instant (optimistic) and is scoped per account.

## Routes and files it owns

| Path                                   | File                                     | Notes                      |
| -------------------------------------- | ---------------------------------------- | -------------------------- |
| `/favorites`                           | `src/pages/favorites/index.tsx`          | Saved list (auth-gated)    |
| `GET /api/favorites`                   | `src/pages/api/favorites/index.ts`       | Ids the user saved         |
| `PUT/DELETE /api/favorites/:listingId` | `src/pages/api/favorites/[listingId].ts` | Save / unsave (idempotent) |

Client state: `src/components/favorites/FavoritesProvider.tsx` (context, mounted in `_app.tsx`), `FavoriteButton.tsx`. Read for the page: `getFavoriteListings(userId)` in `src/lib/data.ts`.

## Business rules

- **Per account.** Favorites are keyed by `(userId, listingId)` (composite primary key, `prisma/schema.prisma`). Rows cascade-delete when the user or listing is removed.
- **Optimistic with rollback.** The provider flips local state immediately, sends the request, and rolls back if the server rejects. A `pending` ref holds one in-flight request per listing so a stale response cannot clobber newer state.
- **Guests cannot favorite.** The button routes an anonymous user to `/login` with a `callbackUrl` back to the current page.
- **Idempotent writes.** `PUT` upserts, `DELETE` uses `deleteMany`; tapping twice never errors.

The toggle (`src/components/favorites/FavoritesProvider.tsx`):

```tsx
const toggle = useCallback(
  (listingId: string) => {
    if (pending.current.has(listingId)) return;
    pending.current.add(listingId);
    const wasFavorite = ids.has(listingId);
    setIds((prev) => {
      /* optimistic flip */
    });
    fetch(`/api/favorites/${encodeURIComponent(listingId)}`, {
      method: wasFavorite ? "DELETE" : "PUT",
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
      })
      .catch(() => {
        setIds((prev) => {
          /* roll back the flip */
        });
      })
      .finally(() => {
        pending.current.delete(listingId);
      });
  },
  [ids],
);
```

The server upsert (`src/pages/api/favorites/[listingId].ts`):

```ts
await prisma.favorite.upsert({
  where: { userId_listingId: { userId, listingId } },
  create: { userId, listingId },
  update: {},
});
```

## Edge cases

## EC-001: Guest taps the heart

- **Symptom**: An anonymous visitor clicks a favorite heart.
- **Root cause**: Favoriting requires an account, but the button is visible to everyone.
- **Fix**: `FavoriteButton` checks `isAuthenticated` from the provider and, when false, pushes `/login?callbackUrl=${router.asPath}` instead of calling `toggle`.
- **Regression test**: Signed out, click a heart; land on `/login`, sign in, return to the same page.
- **Related skill**: `docs/skills/auth-gated-page.md`.
- **Stay-aware**: Do not silently no-op for guests; route them to login and back.

## EC-002: The heart must live outside the card link

- **Symptom**: Invalid HTML and broken clicks when the heart is nested inside the card's `<Link>`.
- **Root cause**: An interactive `<button>` inside an `<a>` is invalid and swallows or duplicates clicks.
- **Fix**: Render `FavoriteButton` as a sibling overlay, not a child of the card link (see the comment in `src/components/favorites/FavoriteButton.tsx`).
- **Regression test**: Click the heart on a card; it toggles without navigating to the listing.
- **Stay-aware**: Keep the heart outside any wrapping `<Link>`.

## EC-003: Rapid double-tap or a failed request

- **Symptom**: Fast toggling or a network failure leaves the heart in the wrong state.
- **Root cause**: Overlapping requests and unconfirmed optimistic updates.
- **Fix**: The `pending` ref rejects a second toggle while one is in flight, and the `catch` rolls the optimistic flip back on any non-ok response.
- **Regression test**: `tests/favorites.spec.ts`; manually toggle quickly and confirm the final state matches the server.
- **Related skill**: `docs/skills/data-access.md`.
- **Stay-aware**: Preserve both the in-flight guard and the rollback when editing the provider.
