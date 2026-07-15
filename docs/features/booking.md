# Feature: Booking

## Purpose

Let a signed-in guest reserve a listing for a date range, see a transparent price before confirming, review their reservations, and cancel upcoming ones. Double-booking must be impossible even under concurrent requests.

## Routes and files it owns

| Path                                 | File                                          | Notes                               |
| ------------------------------------ | --------------------------------------------- | ----------------------------------- |
| `/booking`                           | `src/pages/booking/index.tsx`                 | Checkout (listing + dates + guests) |
| `/booking/confirm`                   | `src/pages/booking/confirm.tsx`               | Confirmation screen                 |
| `/bookings`                          | `src/pages/bookings/index.tsx`                | "My bookings", auth-gated (SSR)     |
| `POST` / `GET /api/bookings`         | `src/pages/api/bookings/index.ts`             | Create booking; list own by ids     |
| `DELETE /api/bookings/:id`           | `src/pages/api/bookings/[id].ts`              | Cancel own upcoming booking         |
| `GET /api/listings/:id/availability` | `src/pages/api/listings/[id]/availability.ts` | Public booked-range feed            |

Components: `src/components/booking/BookingWidget.tsx`, `BookingForm.tsx`, `PriceBreakdown.tsx`; the picker `src/components/search/DateRangePicker.tsx`. Pricing math: `src/lib/pricing.ts`. Race proof: `scripts/race-test.ts`.

## Business rules

- **Auth.** Creating, listing, and cancelling bookings all require a session (`401` otherwise). `/bookings` redirects to `/login?callbackUrl=/bookings`. See `docs/skills/auth-gated-page.md`.
- **Price is computed server-side** from the listing and the date range (`computePrice` in `src/lib/pricing.ts`): `nights x pricePerNight + cleaningFee + round(subtotal x serviceFeeRate)`. The client shows the same breakdown but the stored numbers come from the server.
- **Dates are half-open `[checkIn, checkOut)`.** The check-out day is free for the next guest. This is consistent across the availability feed, the overlap query, and the database constraint.
- **Cancellation is limited to upcoming stays.** `canCancel` is computed on the server so SSR and hydration agree (`checkIn > todayUtc`).
- **Bookings outlive accounts.** `Booking.userId` is nullable; deleting an account nulls it rather than deleting the row (see `docs/features/account.md`).

## The no-overlap invariant (most important)

Two layers protect against double-booking. The application pre-check is friendly but not race-safe on its own; the database constraint is the real guarantee.

Layer 1, pre-check and insert inside a transaction (`src/pages/api/bookings/index.ts`):

```ts
created = await prisma.$transaction(async (tx) => {
  const overlap = await tx.booking.findFirst({
    where: {
      listingId: listing.id,
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
    select: { id: true },
  });
  if (overlap) return null; // -> 409 below
  return tx.booking.create({ data: {/* listing, dates, guests, price... */} });
});
```

Layer 2, a `btree_gist` exclusion constraint (`prisma/migrations/20260711220000_booking_no_overlap/migration.sql`). It is added by raw SQL, so it is **not** visible in `schema.prisma`:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "listingId" WITH =,
    daterange("checkIn", "checkOut", '[)') WITH &&
  );
```

When two requests race, both can pass Layer 1 under READ COMMITTED, but Postgres rejects one insert with SQLSTATE `23P01`. The handler recognizes it and returns the same `409`:

```ts
function isOverlapViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const text = error.message;
  return text.includes("booking_no_overlap") || text.includes("23P01");
}
```

`scripts/race-test.ts` fires concurrent bookings to prove exactly one wins.

## Availability feed

`GET /api/listings/:id/availability` is public (no session) and returns only booked date ranges, no guest data, so the picker can gray out taken nights. It ignores past stays (`checkOut >= today`) and emits half-open ranges.

## Edge cases

## EC-001: Concurrent bookings for the same nights

- **Symptom**: Under load, two guests could both pass the availability check and both insert a booking for overlapping dates.
- **Root cause**: The in-transaction pre-check runs under READ COMMITTED; neither transaction sees the other's uncommitted insert, so both proceed.
- **Fix**: The `booking_no_overlap` `btree_gist` exclusion constraint makes overlapping ranges physically impossible. Postgres fails one insert with `23P01`; `isOverlapViolation` maps it to a `409`.
- **Regression test**: `scripts/race-test.ts`; `tests/booking.spec.ts` covers the `409` overlap path.
- **Related skill**: `docs/skills/data-access.md`.
- **Stay-aware**: The constraint is the guarantee. Keep the pre-check for a friendly message, but never rely on it alone or remove the constraint.

## EC-002: Cancelling a stay that already started

- **Symptom**: A guest tries to cancel a booking whose check-in is today or past.
- **Root cause**: Only upcoming stays are cancellable; started/past ones must not be deletable.
- **Fix**: `DELETE /api/bookings/:id` returns `409 "Booking already started"` when `checkIn <= todayUtc`. The UI only shows the cancel button when `canCancel` (computed server-side in `getServerSideProps`).
- **Regression test**: `tests/booking.spec.ts` (cancellation path).
- **Stay-aware**: Compute `canCancel` on the server so SSR and client agree; do not gate it with `new Date()` in the browser only.

## EC-003: Cancelling someone else's booking

- **Symptom**: A crafted `DELETE /api/bookings/:id` with another user's id could reveal whether that booking exists.
- **Root cause**: Distinguishing "not found" from "not yours" leaks existence.
- **Fix**: `src/pages/api/bookings/[id].ts` returns `404` for both a missing booking and one owned by a different user (`!booking || booking.userId !== session.user.id`).
- **Regression test**: Manual: `DELETE` another account's booking id and confirm a `404`.
- **Related skill**: `docs/skills/auth-gated-page.md`.
- **Stay-aware**: For ownership checks, return `404`, not `403`.

## EC-004: `guests` must never be zero or negative

- **Symptom**: A booking created with `guests <= 0`.
- **Root cause**: Client-supplied guest count.
- **Fix**: The create handler clamps: `Number(guests) > 0 ? Number(guests) : 1`.
- **Regression test**: `POST /api/bookings` with `guests: 0` stores `1`.
- **Stay-aware**: Treat the guest count from the body as untrusted input.
