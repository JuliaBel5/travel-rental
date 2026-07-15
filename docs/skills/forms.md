# Skill: Forms (React Hook Form + standardSchemaResolver + Zod v4)

Use this for any form: validation, submission, field errors, and server errors. Wanderstay uses React Hook Form with the **Standard Schema** resolver over Zod v4. Do not reach for `zodResolver`; it is not the resolver this project installs.

## Trigger

Read this when you build or edit a form (login, signup, profile name, password change) or add client validation.

## The resolver import

```ts
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
```

`@hookform/resolvers/standard-schema`, not `@hookform/resolvers/zod`. Zod v4 exposes a Standard Schema interface, which this resolver consumes.

## Locale-driven schema

Validation messages are user-facing, so they come from the dictionary. Build the schema from `t` and memoize it on `t`. Canonical example, `src/pages/signup.tsx`:

```tsx
function makeSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(2, t.auth.signup.nameTooShort),
    email: z.email(t.auth.signup.emailInvalid),
    password: z.string().min(8, t.auth.signup.passwordTooShort),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

const { t } = useTranslation();
const schema = useMemo(() => makeSchema(t), [t]);
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormValues>({
  resolver: standardSchemaResolver(schema),
  defaultValues: { name: "", email: "", password: "" },
});
```

Zod v4 notes:

- Use `z.email(message)`, not the deprecated `z.string().email()`.
- Derive the value type with `z.infer<ReturnType<typeof makeSchema>>` so the form and schema never drift.
- Rebuild the schema when the locale changes so messages switch language; `useMemo(..., [t])` does this.

## Field and server error rendering

Field errors use a small destructive-colored paragraph directly under the input. Set `aria-invalid` so the primitive shows its invalid ring. From `src/pages/signup.tsx`:

```tsx
<Input
  id="email"
  type="email"
  autoComplete="email"
  aria-invalid={Boolean(errors.email)}
  {...register("email")}
/>;
{
  errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>;
}
```

Server errors (a bad response from the API, not a field problem) render in a banner. Keep the exact classes so all forms match:

```tsx
{
  serverError && (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
  );
}
```

Map status codes to dictionary strings, do not show raw server text. Signup does this per code:

```tsx
if (res.status === 409) {
  setServerError(t.auth.signup.emailTaken);
  return;
}
if (res.status === 429) {
  setServerError(t.auth.signup.tooMany);
  return;
}
if (!res.ok) {
  setServerError(t.auth.signup.error);
  return;
}
```

## Submit shape

- Use `handleSubmit(onSubmit)` and put `noValidate` on the `<form>` so the browser does not double-validate.
- Disable the submit button with `isSubmitting` and swap the label for a "submitting" string.
- On success, `reset(...)` the fields (see the password and profile forms in `src/pages/account/index.tsx`).

## Validate again on the server

The client schema is UX, not a security boundary. Every write route re-validates with its own Zod schema and `safeParse`. From `src/pages/api/register.ts`:

```ts
const schema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
});
const parsed = schema.safeParse(req.body);
if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
```

## Related files

- `src/pages/signup.tsx`, `src/pages/login.tsx` (auth forms)
- `src/pages/account/index.tsx` (profile name + password forms; two schemas in one page)
- `src/pages/api/register.ts`, `src/pages/api/account/password.ts` (server-side re-validation)
- `docs/skills/i18n.md` (where the message strings live)
