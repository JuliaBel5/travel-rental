import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { deleteUserAccount, getUserProfile, updateUserProfile } from "@/lib/data";

/** Max avatar payload in characters (~150KB binary once base64-decoded). */
const MAX_IMAGE_CHARS = 200_000;

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  image: z
    .union([
      z.null(),
      z
        .string()
        .regex(/^data:image\/(jpeg|png|webp);base64,/)
        .max(MAX_IMAGE_CHARS),
    ])
    .optional(),
});

export interface AccountResponse {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

/** /api/account — read (GET), edit (PATCH) or delete (DELETE) the caller's account. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountResponse | { ok: true } | { error: string }>,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = session.user.id;

  if (req.method === "GET") {
    const profile = await getUserProfile(userId);
    if (!profile) return res.status(404).json({ error: "Account not found" });
    return res.status(200).json({
      name: profile.name,
      email: profile.email,
      image: profile.image,
      createdAt: profile.createdAt.toISOString(),
    });
  }

  if (req.method === "PATCH") {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }
    if (parsed.data.name === undefined && parsed.data.image === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    await updateUserProfile(userId, parsed.data);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await deleteUserAccount(userId);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PATCH, DELETE");
  return res.status(405).json({ error: "Method Not Allowed" });
}
