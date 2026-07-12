import type { NextApiRequest, NextApiResponse } from "next";

import { getListingById, getListingBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export interface AvailabilityResponse {
  /** Half-open ranges [checkIn, checkOut): the check-out day itself is free. */
  booked: Array<{ checkIn: string; checkOut: string }>;
}

/**
 * Public availability for a listing's date picker. Exposes only date ranges —
 * no guest or booking details — so it is safe without authentication.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AvailabilityResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const listing = id ? ((await getListingById(id)) ?? (await getListingBySlug(id))) : undefined;
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  // Past stays can't collide with new picks (past days are disabled anyway).
  const todayUtc = new Date(new Date().toISOString().slice(0, 10));

  const rows = await prisma.booking.findMany({
    where: { listingId: listing.id, checkOut: { gte: todayUtc } },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });

  res.status(200).json({
    booked: rows.map((row) => ({
      checkIn: row.checkIn.toISOString().slice(0, 10),
      checkOut: row.checkOut.toISOString().slice(0, 10),
    })),
  });
}
