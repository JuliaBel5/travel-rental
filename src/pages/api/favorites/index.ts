import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface FavoritesResponse {
  ids: string[];
}

/** GET /api/favorites — listing ids the current user has saved. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FavoritesResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ ids: rows.map((row) => row.listingId) });
}
