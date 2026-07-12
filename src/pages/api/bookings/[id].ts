import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/bookings/:id — cancel the caller's own upcoming booking. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    return res.status(400).json({ error: "Missing booking id" });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, checkIn: true },
  });

  // 404 for both "doesn't exist" and "not yours": don't leak existence.
  if (!booking || booking.userId !== session.user.id) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // Stays that already started (or passed) can't be cancelled.
  const todayUtc = new Date(new Date().toISOString().slice(0, 10));
  if (booking.checkIn <= todayUtc) {
    return res.status(409).json({ error: "Booking already started" });
  }

  await prisma.booking.delete({ where: { id: booking.id } });
  return res.status(200).json({ ok: true });
}
