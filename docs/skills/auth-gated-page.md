# Skill: Auth-gated page and protected API route

Use this when a page must require sign-in, or an API route must reject anonymous callers. Wanderstay uses NextAuth v4 Credentials with **JWT sessions** (no database session table). The provider config lives in `src/lib/auth.ts` and is exported as `authOptions`.

## Trigger

Read this when you:

- add a page that only signed-in users may open (`/booking`, `/bookings`, `/account`);
- add or change an API route that reads or writes user-scoped data;
- touch redirect-after-login behavior (`callbackUrl`).

## Page gate: `getServerSideProps`

Gate a page on the server, not the client. Call `getServerSession` with the request/response pair and `authOptions`, then redirect to `/login` with a `callbackUrl`. Canonical example, `src/pages/bookings/index.tsx`:

```tsx
export const getServerSideProps: GetServerSideProps<MyBookingsProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent("/bookings")}`,
        permanent: false,
      },
    };
  }

  const rows = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
  // ...map rows to props
  return { props: { bookings } };
};
```

Notes:

- `session.user.id` is present because `authOptions` copies it in the `jwt` and `session` callbacks (`src/lib/auth.ts`). Do not read a raw token yourself.
- `permanent: false`. The redirect is a login prompt, not a moved resource.
- `encodeURIComponent` the target path so a query-bearing URL round-trips.
- Read the user's real data fresh from Prisma here. The JWT is a stale snapshot (see `docs/skills/data-access.md` and `docs/features/account.md`).

## API guard: 401 on missing session

Every user-scoped API route starts the same way. Canonical example, `src/pages/api/favorites/index.ts`:

```ts
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
```

Rules that hold across every route:

- Method check first (`405` with an `Allow` header), then session check (`401`), then input validation (`400`), then work.
- Always filter queries by `session.user.id`. Never trust an id from the body or query for ownership.
- To hide existence of another user's resource, return `404`, not `403`. See `src/pages/api/bookings/[id].ts`, where "not found" and "not yours" both return `404`.

## Client sign-in and redirect

Login and signup call `signIn("credentials", { redirect: false })` and route manually so they can show inline errors. After a successful register, `src/pages/signup.tsx` signs the user in and pushes `callbackUrl`:

```tsx
const signInRes = await signIn("credentials", {
  email: values.email,
  password: values.password,
  redirect: false,
});
router.push(signInRes && !signInRes.error ? callbackUrl : "/login");
```

`callbackUrl` is read from the query and defaults to `/`.

## Related files

- `src/lib/auth.ts` (provider, JWT/session callbacks, login rate limit)
- `src/pages/bookings/index.tsx`, `src/pages/account/index.tsx` (page gates)
- `src/pages/api/favorites/index.ts`, `src/pages/api/bookings/index.ts` (API guards)
- `src/types/next-auth.d.ts` (`session.user.id` augmentation)
- Feature detail: `docs/features/auth.md`
