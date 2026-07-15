<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Universal AI Entrypoint

This file is the first document any AI agent should read before working in this repository. It is tool-agnostic: for Claude, GPT/Codex, OpenCode, and any other assistant. It is a router, not an encyclopedia. It tells you which skill or feature doc to open next.

## Project overview

Wanderstay is a full-stack, bilingual (RU / EN) travel-rental web app: browse stays, check real-time availability, and book after signing in. Bookings persist in PostgreSQL and double-booking is impossible by construction. Favorites, account management, transparent pricing, light/dark theme, and a full RU/EN dictionary round it out.

Stack: Next.js 16 **Pages Router** + React 19, TypeScript, Tailwind CSS v4 with `shadcn/ui` (style `base-nova`) on top of **Base UI**, Prisma 6 + PostgreSQL (local Docker on port 5433, Neon in production), NextAuth v4 Credentials with JWT sessions, React Hook Form + Zod v4, `lucide-react` icons, `next-themes`.

Structure is **by domain, not by feature folders**. There is no `src/features/`.

```txt
src/
  pages/        Routes (Pages Router) + api/ handlers
  components/   UI by domain: account, booking, favorites, home, layout, listings, search, ui
  lib/          auth, prisma singleton, data-access layer, pricing, rate-limit, utils, icons
  locales/      ru / en dictionaries (+ useTranslation hook)
  data/         mock seed sources
  types/        shared types + NextAuth augmentation
  styles/       Tailwind v4 globals
prisma/         schema, migrations, seed
tests/          Playwright e2e + helpers
scripts/        race-test.ts (proves the no-overlap constraint)
```

## Stack quirks (do not assume defaults)

These are the traps that catch an agent working from training-data defaults. Read the linked skill before touching the area.

| Quirk                                  | What to know                                                                                                                                                                                      | Skill                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Pages Router**, not App Router       | Data via `getServerSideProps` / `getStaticProps`; API in `src/pages/api/**`. No `app/`, no server components, no route handlers.                                                                  | see feature docs               |
| **Forms** use `standardSchemaResolver` | Import from `@hookform/resolvers/standard-schema`, not `zodResolver`. Zod v4 syntax (`z.email()`). Schemas are built from the dictionary, `makeSchema(t)`.                                        | `docs/skills/forms.md`         |
| **Base UI**, not Radix                 | Compose a primitive as another element with the `render` prop: `<Button render={<Link href="/x" />}>`. There is no `asChild`.                                                                     | `docs/skills/ui-components.md` |
| **i18n is type-synced**                | `en.ts` is typed `: Dictionary` (`typeof ru`); a missing or renamed key is a compile error. Every user-facing string comes from `useTranslation()`.                                               | `docs/skills/i18n.md`          |
| **Data-access layer**                  | Domain reads and account writes go through `src/lib/data.ts` over the Prisma singleton in `src/lib/prisma.ts`. (Booking + favorite mutations are the documented exception; see the feature docs.) | `docs/skills/data-access.md`   |
| **RU-first responsive**                | RU labels are longer than EN. The header's full nav switches at `lg` (1024px), not `sm`/`md`. Measure responsive changes in RU, the default locale.                                               | `docs/skills/ui-components.md` |
| **Avatars are base64**                 | Never put the avatar in the JWT (4KB cookie limit); it is served via `GET /api/account`. Data-URL images use a plain `<img>`, not `next/image`.                                                   | `docs/features/account.md`     |
| **Dev needs Docker Postgres**          | Start it first: `docker start wanderstay-pg` (Postgres on 5433). Otherwise every page throws `PrismaClientInitializationError`. See `README.md`.                                                  | see `README.md`                |

## Route yourself before editing

Identify the area your task touches, then read the matching doc.

| Task touches                                         | Read                              |
| ---------------------------------------------------- | --------------------------------- |
| Auth-gated page or protected API route               | `docs/skills/auth-gated-page.md`  |
| A form: validation, submit, field/server errors      | `docs/skills/forms.md`            |
| User-facing text, a new locale key, RU/EN sync       | `docs/skills/i18n.md`             |
| UI primitive, button-as-link, avatar, images         | `docs/skills/ui-components.md`    |
| Any database read or write, Prisma, transactions     | `docs/skills/data-access.md`      |
| Playwright e2e tests                                 | `docs/skills/e2e.md`              |
| Home, catalog, search, filters, listing detail       | `docs/features/catalog.md`        |
| Booking, checkout, availability, my bookings, cancel | `docs/features/booking.md`        |
| Favorites (heart toggle, saved list)                 | `docs/features/favorites.md`      |
| Login, signup, session, login/register rate limits   | `docs/features/auth.md`           |
| Account, profile, avatar upload, password, delete    | `docs/features/account.md`        |
| The documentation system itself                      | `docs/ai-documentation-system.md` |
| Setup, env vars, seeding, deploy                     | `README.md`                       |

## Hard rules for AI agents

- Do not guess. Read the skill or feature doc for the touched area, then confirm against the code.
- Do not introduce App Router patterns, `zodResolver`, or Radix `asChild`. This project uses Pages Router, `standardSchemaResolver`, and the Base UI `render` prop.
- Every user-facing string goes through the dictionary. Add the key to `src/locales/ru.ts` and `src/locales/en.ts` together or the build breaks.
- Do not add a new dependency without a clear need; prefer what is already installed.
- Do not put base64 avatars into the session/JWT, and do not route data-URL images through `next/image`.

## Documentation definition of done

Before marking a task complete, re-check whether docs need updating and update them in the same task:

- Behavior changed in a domain, update `docs/features/{feature}.md`.
- A bug or trap was fixed, add an `EC-###` entry to that feature's Edge cases section.
- A project-wide pattern changed, update the matching `docs/skills/*.md`.
- Routes or the routing table changed, update this file.

Full rules, conflict-resolution priority, and the edge-case format live in `docs/ai-documentation-system.md`.
