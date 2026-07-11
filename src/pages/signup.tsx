import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { signIn } from "next-auth/react";

import { useTranslation, type Dictionary } from "@/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Seo } from "@/components/Seo";

function makeSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(2, t.auth.signup.nameTooShort),
    email: z.email(t.auth.signup.emailInvalid),
    password: z.string().min(8, t.auth.signup.passwordTooShort),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => makeSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const callbackUrl = typeof router.query.callbackUrl === "string" ? router.query.callbackUrl : "/";

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.status === 409) {
        setServerError(t.auth.signup.emailTaken);
        return;
      }
      if (!res.ok) {
        setServerError(t.auth.signup.error);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      router.push(signInRes && !signInRes.error ? callbackUrl : "/login");
    } catch {
      setServerError(t.auth.signup.error);
    }
  }

  return (
    <>
      <Seo
        title={`${t.auth.signup.title} — ${t.common.appName}`}
        description={t.auth.signup.subtitle}
      />

      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-1 text-center">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {t.auth.signup.title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.auth.signup.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t.auth.signup.name}</Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t.auth.signup.email}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t.auth.signup.password}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t.auth.signup.submitting : t.auth.signup.submit}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.auth.signup.haveAccount}{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t.auth.signup.loginLink}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
