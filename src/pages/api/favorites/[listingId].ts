import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT    /api/favorites/:listingId — save a listing (idempotent).
 * DELETE /api/favorites/:listingId — unsave (idempotent).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>,
) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = session.user.id;

  const listingId = Array.isArray(req.query.listingId)
    ? req.query.listingId[0]
    : req.query.listingId;
  if (!listingId) {
    return res.status(400).json({ error: "Missing listing id" });
  }

  if (req.method === "PUT") {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
    return res.status(200).json({ ok: true });
  }

  await prisma.favorite.deleteMany({ where: { userId, listingId } });
  return res.status(200).json({ ok: true });
}
