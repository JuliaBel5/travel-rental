import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { clientIp, consumeRateLimit, isRateLimited, resetRateLimit } from "@/lib/rate-limit";

/** Failed-attempt budget per IP+account and a coarser per-IP ceiling. */
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_ACCOUNT_LIMIT = 5;
const LOGIN_IP_LIMIT = 20;

/** Thrown message doubles as the client-side error code from signIn(). */
export const RATE_LIMITED_ERROR = "RATE_LIMITED";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const ip = clientIp(req ?? {});
        const ipKey = `login:ip:${ip}`;
        const accountKey = `login:acct:${ip}:${email}`;

        // Only failures are counted; peek here so a blocked try doesn't extend the window.
        if (
          !isRateLimited(ipKey, LOGIN_IP_LIMIT).ok ||
          !isRateLimited(accountKey, LOGIN_ACCOUNT_LIMIT).ok
        ) {
          throw new Error(RATE_LIMITED_ERROR);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid) {
          consumeRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
          consumeRateLimit(accountKey, LOGIN_ACCOUNT_LIMIT, LOGIN_WINDOW_MS);
          return null;
        }

        resetRateLimit(accountKey);
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id;

      // The avatar is a base64 data-URL that can be ~100KB — far past the 4KB
      // cookie limit. NextAuth copies user.image → token.picture at sign-in, so
      // strip it on every pass. Avatars are served via /api/account instead.
      token.picture = null;

      // useSession().update({ name }) refreshes the header without re-login.
      // Only accept the name string; never trust an image from the client here.
      if (trigger === "update" && session && typeof session === "object") {
        const nextName = (session as { name?: unknown }).name;
        if (typeof nextName === "string") token.name = nextName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        // Keep the base64 avatar out of the session payload as well.
        session.user.image = null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
