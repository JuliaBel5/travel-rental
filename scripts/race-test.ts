/**
 * Throwaway verification: the `booking_no_overlap` exclusion constraint must
 * reject concurrent overlapping inserts even when application checks are
 * bypassed entirely. Run: pnpm exec tsx scripts/race-test.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EMAIL = "race@test.local";

function mk(listingId: string, ci: string, co: string) {
  return prisma.booking.create({
    data: {
      listingId,
      checkIn: new Date(ci),
      checkOut: new Date(co),
      guests: 2,
      guestName: "Race Test",
      guestEmail: EMAIL,
      nights: 4,
      subtotal: 1,
      cleaningFee: 0,
      serviceFee: 0,
      total: 1,
      currency: "EUR",
    },
  });
}

const isConstraint = (e: unknown) =>
  String(e).includes("booking_no_overlap") || String(e).includes("23P01");

async function main() {
  await prisma.booking.deleteMany({ where: { guestEmail: EMAIL } });

  // 1) Two identical ranges, truly parallel → exactly one must survive.
  const r = await Promise.allSettled([
    mk("l1", "2027-03-01", "2027-03-05"),
    mk("l1", "2027-03-01", "2027-03-05"),
  ]);
  const fulfilled = r.filter((x) => x.status === "fulfilled").length;
  const rejected = r.filter((x): x is PromiseRejectedResult => x.status === "rejected");
  console.log(`1) parallel identical: fulfilled=${fulfilled} rejected=${rejected.length}`);
  if (fulfilled !== 1 || rejected.length !== 1) throw new Error("expected exactly 1/1");
  if (!isConstraint(rejected[0].reason)) {
    throw new Error("rejected, but not by our constraint: " + String(rejected[0].reason).slice(0, 200));
  }
  console.log("   rejected by booking_no_overlap ✓");

  // 2) Partial overlap must fail too.
  let partialRejected = false;
  try {
    await mk("l1", "2027-03-04", "2027-03-08");
  } catch (e) {
    partialRejected = isConstraint(e);
  }
  console.log(`2) partial overlap rejected: ${partialRejected}`);
  if (!partialRejected) throw new Error("partial overlap slipped through");

  // 3) Back-to-back is fine: '[)' means checkout day is free for the next guest.
  await mk("l1", "2027-03-05", "2027-03-09");
  console.log("3) back-to-back (checkOut == next checkIn) allowed ✓");

  // 4) Same dates on a different listing are unaffected.
  await mk("l2", "2027-03-01", "2027-03-05");
  console.log("4) different listing, same dates allowed ✓");

  const { count } = await prisma.booking.deleteMany({ where: { guestEmail: EMAIL } });
  console.log(`cleanup: removed ${count} test rows`);
  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
