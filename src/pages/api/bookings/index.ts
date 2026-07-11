import type { NextApiRequest, NextApiResponse } from "next";
import type { Booking as DbBooking } from "@prisma/client";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getListingById, getListingBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { computePrice } from "@/lib/pricing";
import type { Booking, CurrencyCode } from "@/types";

/** Serialize a DB booking row into the API/domain shape (dates as yyyy-MM-dd). */
function toBooking(row: DbBooking): Booking {
  return {
    id: row.id,
    listingId: row.listingId,
    checkIn: row.checkIn.toISOString().slice(0, 10),
    checkOut: row.checkOut.toISOString().slice(0, 10),
    guests: row.guests,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    nights: row.nights,
    subtotal: row.subtotal,
    cleaningFee: row.cleaningFee,
    serviceFee: row.serviceFee,
    total: row.total,
    currency: row.currency as CurrencyCode,
    createdAt: row.createdAt.toISOString(),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Booking | Booking[] | { error: string }>,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = session.user.id;

  // GET /api/bookings?ids=a,b,c → the caller's own requested bookings.
  if (req.method === "GET") {
    const raw = Array.isArray(req.query.ids) ? req.query.ids[0] : req.query.ids;
    const ids = raw
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (ids.length === 0) return res.status(200).json([]);
    const rows = await prisma.booking.findMany({
      where: { id: { in: ids }, userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(rows.map(toBooking));
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { listingId, checkIn, checkOut, guests } = req.body ?? {};
  if (!listingId || !checkIn || !checkOut) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  const listing = (await getListingById(listingId)) ?? (await getListingBySlug(listingId));
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const price = computePrice(listing, checkIn, checkOut);
  if (price.nights <= 0) {
    return res.status(400).json({ error: "Invalid date range" });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Availability check + insert in one transaction so overlapping dates can't
  // both slip through concurrently.
  const created = await prisma.$transaction(async (tx) => {
    const overlap = await tx.booking.findFirst({
      where: {
        listingId: listing.id,
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { id: true },
    });
    if (overlap) return null;

    return tx.booking.create({
      data: {
        listingId: listing.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: Number(guests) > 0 ? Number(guests) : 1,
        guestName: session.user.name ?? session.user.email ?? "",
        guestEmail: session.user.email ?? "",
        userId,
        nights: price.nights,
        subtotal: price.subtotal,
        cleaningFee: price.cleaningFee,
        serviceFee: price.serviceFee,
        total: price.total,
        currency: price.currency,
      },
    });
  });

  if (!created) {
    return res.status(409).json({ error: "Selected dates are not available" });
  }

  res.status(201).json(toBooking(created));
}
