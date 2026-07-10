import type { NextApiRequest, NextApiResponse } from "next";

import { getListingById, getListingBySlug } from "@/lib/data";
import { computePrice } from "@/lib/pricing";
import type { Booking } from "@/types";

/** In-memory store — resets on server restart (MVP only). */
const bookings: Booking[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Booking | Booking[] | { error: string }>,
) {
  if (req.method === "GET") {
    return res.status(200).json(bookings);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { listingId, checkIn, checkOut, guests, guestName, guestEmail } = req.body ?? {};

  if (!listingId || !checkIn || !checkOut || !guestName || !guestEmail) {
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

  const booking: Booking = {
    id: `b_${Date.now()}`,
    listingId: listing.id,
    checkIn,
    checkOut,
    guests: Number(guests) > 0 ? Number(guests) : 1,
    guestName,
    guestEmail,
    nights: price.nights,
    subtotal: price.subtotal,
    cleaningFee: price.cleaningFee,
    serviceFee: price.serviceFee,
    total: price.total,
    currency: price.currency,
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  res.status(201).json(booking);
}
