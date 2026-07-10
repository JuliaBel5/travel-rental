import type { NextApiRequest, NextApiResponse } from "next";

import { getAllListings, type ListingFilters, type SortOption } from "@/lib/data";
import type { Listing } from "@/types";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function listParam(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : value.split(",");
  const items = raw.map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function numberParam(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value);
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Listing[] | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const filters: ListingFilters = {
    location: firstParam(req.query.location),
    category: firstParam(req.query.category),
    guests: numberParam(req.query.guests),
    minPrice: numberParam(req.query.minPrice),
    maxPrice: numberParam(req.query.maxPrice),
    types: listParam(req.query.types),
    amenities: listParam(req.query.amenities),
    sort: firstParam(req.query.sort) as SortOption | undefined,
  };

  res.status(200).json(getAllListings(filters));
}
