import type { NextApiRequest, NextApiResponse } from "next";

import { getHost, getListingById, getListingBySlug, getReviews } from "@/lib/data";
import type { Host, Listing, Review } from "@/types";

export interface ListingDetailResponse {
  listing: Listing;
  host: Host | null;
  reviews: Review[];
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListingDetailResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const listing = id ? (getListingById(id) ?? getListingBySlug(id)) : undefined;

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.status(200).json({
    listing,
    host: getHost(listing.hostId) ?? null,
    reviews: getReviews(listing.id),
  });
}
