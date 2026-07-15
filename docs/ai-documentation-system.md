# AI Documentation System

Wanderstay keeps its documentation in a format any coding AI agent can use, not just one vendor or one tool.

The goal is simple: before an AI changes code, it must know **which project rules, feature docs, global skills, and edge cases to read**.

## Structural adaptation (read this first)

The reference system this is modeled on uses a per-feature folder tree (`src/features/{feature}/AGENTS.md` plus `docs/feature.md` / `docs/skills.md` / `docs/edge-cases.md`). Wanderstay is organized **by domain, not by feature folders**, and there is no `src/features/`. It is also small (~40 source files), so a deep router hierarchy would cost more than it earns.

So this project flattens the reference model:

- **One router.** The root `AGENTS.md` is the only router. It points straight at skills and feature docs. There are no per-area `src/{area}/AGENTS.md` files.
- **One file per feature.** Each `docs/features/{feature}.md` merges what the reference splits across `feature.md`, `skills.md`, and `edge-cases.md`. A feature is small enough that behavior, local rules, and edge cases fit in a single page with clear sections.
- **Global skills stay global.** `docs/skills/*.md` holds implementation recipes that apply across domains (the same layer as the reference).

If Wanderstay grows a real `src/features/` layout later, re-introduce per-feature routers and split the merged files back out. Until then, keep it flat.

## File roles

| File                              | Role                                                  | Read by AI when                                  |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `/AGENTS.md`                      | Universal AI entrypoint and the only router           | Always, at the start of repository work          |
| `docs/skills/*.md`                | Global implementation skills (recipes)                | The task matches a skill trigger                 |
| `docs/features/*.md`              | Per-domain behavior, local rules, and edge cases      | The task changes behavior in that domain         |
| `docs/ai-documentation-system.md` | This meta-doc: roles, priority, reading flow          | The documentation system itself changes          |
| `README.md`                       | Human-facing setup, env, scripts, deploy              | You need to run, seed, or deploy the app         |
| `CLAUDE.md`                       | One-line pointer to `AGENTS.md` (no separate content) | Never read directly; it just imports `AGENTS.md` |

## Conflict resolution

`AGENTS.md` is a router. It decides **what to read**, not the business truth of a feature.

When documents disagree, use this priority:

1. **Code.** The ultimate source of truth for what runs. `src/**`, `prisma/**`, `next.config.ts`.
2. **Feature edge cases** (`docs/features/{feature}.md`, the Edge cases section). Known traps and bug history that explain why a rule exists.
3. **Feature rules and behavior** (the rest of `docs/features/{feature}.md`). Local implementation overrides and business rules.
4. **Global skills** (`docs/skills/*.md`). Default project-wide implementation patterns.
5. **README.md**. Operational truth (setup, env, deploy), not code behavior.

`AGENTS.md` is not in this list. It should not hold behavior or skill content. If the router disagrees with a routed doc, fix the router.

Most important rule:

> A feature-local rule overrides a global skill inside that feature.

Example: the global data-access skill says reads go through `src/lib/data.ts`, but the booking feature doc records that booking creation and cancellation query the Prisma client **directly in the API route** (they are coupled to the exclusion-constraint catch). Inside booking, the feature doc wins.

## What is AGENTS.md?

`AGENTS.md` is not a Claude-only file. Here it means:

> Universal instructions for any AI agent.

The root `AGENTS.md` is the daily entrypoint. It is a router, not an encyclopedia. It answers:

- What kind of project is this?
- Which stack quirks will bite an agent that assumes defaults?
- Which skill or feature doc should the AI read next for a given task?
- What is the documentation definition of done?

## What is a feature doc?

`docs/features/{feature}.md` describes one domain cluster. Each file has the same sections:

- **Purpose.** The user-facing job of the feature.
- **Routes and files it owns.** Pages, API routes, and components, with paths.
- **Business rules.** Flows, invariants, permissions, pricing, status logic.
- **Edge cases.** Non-obvious traps in the strict EC format below.

Do not use a feature doc for: generic project-wide patterns (those are skills), copies of the Prisma schema (read `prisma/schema.prisma`), or obvious component render structure.

## What is a skill?

A skill is an implementation recipe:

> If you are building this kind of thing, use these files, props, hooks, code shape, and checks.

Skills are not behavior descriptions and not bug history. They are practical, reusable implementation rules that apply across domains. Global skills live in `docs/skills/*.md`. The current set:

- `auth-gated-page.md`, the SSR page gate and the API route guard.
- `forms.md`, React Hook Form with `standardSchemaResolver`, Zod v4, and locale-driven schemas.
- `i18n.md`, adding keys, the compile-time type-sync, and RU-first responsive work.
- `ui-components.md`, the Base UI `render` prop, the available primitives, and the avatar / image rules.
- `data-access.md`, the `data.ts` layer, the Prisma singleton, and transactions.
- `e2e.md`, the Playwright helpers and the rate-limit constraint.

If a rule applies to only one feature, keep it in that feature doc. If a feature-local rule starts appearing in two or more features, promote it to a global skill and leave the feature docs pointing at it.

## Skill vs edge case

- **Skill** = how to implement correctly. Lives in `docs/skills/*.md`.
- **Edge case** = what once broke or was missed, and how not to repeat it. Lives in the Edge cases section of a feature doc.

Keep every edge case in this strict format:

```md
## EC-001: Short title

- **Symptom**: What the user, system, or logs saw.
- **Root cause**: Why it happened.
- **Fix**: What changed.
- **Regression test**: Test path or manual verification steps.
- **Related skill**: Link to a global skill if one applies.
- **Stay-aware**: One imperative sentence for the next agent.
```

## Required reading flow for AI agents

When working on code, follow this chain:

```txt
/AGENTS.md
  -> task-specific global skill(s) in docs/skills/
  -> the feature doc in docs/features/ that owns the touched area
  -> the code itself (src/**, prisma/**), which always wins
```

Concrete Wanderstay example:

```txt
Task: make the date picker gray out nights that are already booked

Read:
1. /AGENTS.md                       (route yourself; find the booking row)
2. docs/skills/data-access.md       (reads go through src/lib/data.ts)
3. docs/features/booking.md         (availability contract + EXCLUDE invariant)
4. src/pages/api/listings/[id]/availability.ts   (the real endpoint)
5. src/components/search/DateRangePicker.tsx     (the picker that consumes it)
```

## Documentation definition of done

Before marking any task complete, re-check whether documentation needs updating and update it in the same task.

- Behavior changed in a domain, update `docs/features/{feature}.md`.
- A bug or missed scenario was fixed, add an `EC-###` entry to that feature's Edge cases section.
- A project-wide implementation pattern changed, update the matching `docs/skills/*.md`.
- Routes, files, or the routing table changed, update `/AGENTS.md`.
- The documentation system itself changed, update this file.

Do not create empty docs to tick a box. Write a doc when there is real content, and link it from `AGENTS.md`.

## What not to document

Do not document what code already represents better:

- The Prisma schema field list (read `prisma/schema.prisma`).
- Obvious component render structure.
- Pseudo-code that does not exist in the project. Every code block in these docs is copied from a real file and labeled with its path.
- Broad advice like "be careful".
- Global skill content copied into a feature doc. Link instead.
