# Skill: Data access (data.ts layer, Prisma singleton, transactions)

Use this for any database read or write. Wanderstay talks to PostgreSQL through Prisma 6. Domain reads and account writes live behind `src/lib/data.ts`; everything shares one Prisma client from `src/lib/prisma.ts`.

## Trigger

Read this when you: fetch catalog/listing/host/review data, read or update the current user, add a Prisma query, or need a transaction.

## The Prisma singleton

Never `new PrismaClient()` in a page or route. Import the shared instance. The singleton survives dev hot-reloads and serverless reuse:

```ts
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

```ts
import { prisma } from "@/lib/prisma";
```

## `data.ts` is the domain read layer

`src/lib/data.ts` does two jobs: query Prisma, and map DB rows to the app's domain types (Prisma stores localized text and structured location as `Json`, so rows are cast to typed shapes). Prefer an existing accessor over a raw query.

Read accessors: `getAllListings(filters)`, `getListingById`, `getListingBySlug`, `getFeaturedListings`, `getFavoriteListings(userId)`, `getAllListingSlugs`, `getHost`, `getReviews`, `getCategories`, `getAmenities`, `getAllHosts`.

Account accessors and writes: `getUserProfile`, `updateUserProfile`, `changeUserPassword`, `deleteUserAccount`.

Example of a mapped read with a relation:

```ts
// src/lib/data.ts
export async function getFavoriteListings(userId: string): Promise<Listing[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toListing(row.listing));
}
```

Filtering and sorting for the catalog are done in memory after the fetch, because the dataset is small and this keeps behavior identical across filters (see `getAllListings`). Match that style rather than pushing every filter into SQL.

## Read the current user fresh, never from the JWT

The session JWT is a snapshot from sign-in time. For profile data, read the database. `getUserProfile` also returns live counts:

```ts
// src/lib/data.ts
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { bookings: true, favorites: true } },
    },
  });
  // ...
}
```

## Transactions

Multi-step writes use `prisma.$transaction`. Account deletion keeps booking history by nulling the (nullable) `userId` instead of deleting bookings, all atomically:

```ts
// src/lib/data.ts
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.booking.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
```

## The documented exception: mutations that live in their API routes

Not every write goes through `data.ts`. Some writes are tightly coupled to request handling and stay in the route:

- **Booking creation** (`src/pages/api/bookings/index.ts`) runs its overlap pre-check and insert inside a `prisma.$transaction` in the handler, and translates the exclusion-constraint violation to a `409`. It reads the listing via `data.ts` (`getListingById` / `getListingBySlug`) but writes directly.
- **Booking cancel** (`src/pages/api/bookings/[id].ts`) deletes via `prisma` after an ownership check.
- **Favorite toggle** (`src/pages/api/favorites/[listingId].ts`) does an idempotent `upsert` / `deleteMany` via `prisma`.
- **Availability** (`src/pages/api/listings/[id]/availability.ts`) queries bookings via `prisma`.

This is intentional. When you add a mutation, prefer a `data.ts` helper; keep it in the route only when it is inseparable from request logic (like the booking overlap catch), and record the reason in the feature doc.

## Related files

- `src/lib/prisma.ts`, `src/lib/data.ts`
- `prisma/schema.prisma` (models; do not copy the schema into docs)
- Booking invariant detail: `docs/features/booking.md`
