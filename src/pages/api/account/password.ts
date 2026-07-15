import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { changeUserPassword } from "@/lib/data";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/** Password-change attempts per IP+account per window (anti-abuse). */
const PASSWORD_LIMIT = 10;
const PASSWORD_WINDOW_MS = 15 * 60_000;

/** POST /api/account/password — change the signed-in user's password. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const limited = consumeRateLimit(
    `password:${clientIp(req)}:${session.user.id}`,
    PASSWORD_LIMIT,
    PASSWORD_WINDOW_MS,
  );
  if (!limited.ok) {
    res.setHeader("Retry-After", String(limited.retryAfterSec));
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const result = await changeUserPassword(
    session.user.id,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (!result.ok) {
    // "not_found" can't happen for a live session; treat it like a mismatch.
    return res.status(403).json({ error: "Current password is incorrect" });
  }

  return res.status(200).json({ ok: true });
}
