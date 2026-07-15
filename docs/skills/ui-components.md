# Skill: UI components (Base UI render prop, primitives, images)

Use this for UI primitives, composing a button as a link, avatars, images, and header responsive work. The `shadcn/ui` layer here (style `base-nova`) sits on **Base UI** (`@base-ui/react`), not Radix. The composition API is different.

## Trigger

Read this when you: use a `src/components/ui/*` primitive, render a button/trigger as a link, show a user avatar, place an image, or change header layout.

## `render`, not `asChild`

Radix composes with `asChild`. Base UI composes with a `render` prop that takes the element to merge into. Every primitive spreads its props onto that element. The button primitive is a thin wrapper:

```tsx
// src/components/ui/button.tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
// ...
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

Render a button as a Next `Link` (real usage, `src/pages/bookings/index.tsx`):

```tsx
<Button render={<Link href="/listings" />}>{t.booking.myBookings.browseStays}</Button>
```

Render a trigger as a button (real usage, `src/components/layout/Header.tsx`):

```tsx
<SheetTrigger
  render={
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-foreground/10 lg:hidden dark:hover:bg-foreground/10"
      aria-label={t.nav.menu}
    />
  }
>
  <Menu />
</SheetTrigger>
```

Do not add `asChild`; it does nothing here. Pass the target element to `render`.

## Available primitives

Only these exist under `src/components/ui/`:

`badge`, `button`, `calendar`, `card`, `input`, `label`, `popover`, `select`, `separator`, `sheet`.

There is **no `dialog`, `toast`, or `avatar` primitive.** If you need one:

- Dialog / confirmation: use inline two-step state (see `CancelBookingButton` in `src/pages/bookings/index.tsx` and `DangerZone` in `src/pages/account/index.tsx`), or a `Sheet`.
- Toast: components show inline status text instead (a `text-destructive` line or a muted banner).
- Avatar: use the hand-rolled `UserAvatar` below.

Button variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. Note `destructive` is a tinted style (`bg-destructive/10 text-destructive`), not a solid red fill.

## Avatars and data-URL images

`UserAvatar` (`src/components/account/UserAvatar.tsx`) shows a base64 photo when present, else initials. It uses a plain `<img>` on purpose:

```tsx
{
  image ? (
    // next/image rejects base64 data-URLs; a plain <img> is the correct tool here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={name ?? email ?? ""} className="size-full object-cover" />
  ) : (
    <span aria-hidden>{userInitials(name, email)}</span>
  );
}
```

Rules:

- `next/image` cannot render `data:` URLs. Any user-uploaded avatar is a data-URL, so it goes through `<img>` with the one-line eslint-disable. Do not try to route it through `next/image`.
- Remote photos (listings, hosts, seed reviews) do use `next/image`, but only from whitelisted hosts. `next.config.ts` allows exactly `images.unsplash.com`, `picsum.photos`, and `i.pravatar.cc`. Add a host there before using it, or the image 500s.

## Header responsive (RU-first)

The header switches its full nav at `lg` (1024px), not `sm`/`md`, because Russian labels are too wide sooner. Do not lower these breakpoints without re-measuring in RU.

- Full nav: `hidden ... lg:flex`. Mobile menu trigger: `lg:hidden` (opens a `Sheet`).
- The compact cluster between `sm` and `lg` is icon-only: the account name, sign-out label, and sign-up button are all `hidden ... lg:inline` / `lg:inline-flex` (`src/components/layout/AuthMenu.tsx`).
- The Logo wordmark is hidden below `sm` (`src/components/layout/Logo.tsx`, `hidden ... sm:inline`); the mark stays.

Ghost and outline hovers are nearly invisible on the near-white header background (`bg-muted` is about a 3% delta). Header controls override the hover to a foreground tint: `hover:bg-foreground/10 dark:hover:bg-foreground/10`. Keep that class on header buttons.

## Related files

- `src/components/ui/*` (primitives)
- `src/components/layout/Header.tsx`, `AuthMenu.tsx`, `Logo.tsx`
- `src/components/account/UserAvatar.tsx`
- `next.config.ts` (image `remotePatterns`)
- Avatar / JWT rules: `docs/features/account.md`
