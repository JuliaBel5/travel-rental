-- Prevent double-booking at the database level.
--
-- The API pre-checks availability inside a transaction, but under the default
-- READ COMMITTED isolation two concurrent transactions can both pass that check
-- and both insert. An exclusion constraint makes overlap impossible regardless
-- of application code: for the same listing, half-open date ranges
-- [checkIn, checkOut) must not intersect. One of two racing inserts fails with 23P01.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "listingId" WITH =,
    daterange("checkIn", "checkOut", '[)') WITH &&
  );
