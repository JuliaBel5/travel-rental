import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";
import { CalendarDays, Camera, Check, Heart, Trash2 } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getUserProfile } from "@/lib/data";
import { useTranslation, type Dictionary } from "@/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/account/UserAvatar";
import { Seo } from "@/components/Seo";

interface AccountProfile {
  name: string | null;
  email: string;
  image: string | null;
  /** ISO string — Date can't be serialized through getServerSideProps props. */
  createdAt: string;
  bookingsCount: number;
  favoritesCount: number;
}

interface AccountPageProps {
  profile: AccountProfile;
}

export const getServerSideProps: GetServerSideProps<AccountPageProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent("/account")}`,
        permanent: false,
      },
    };
  }

  // Read fresh from the DB — the JWT is a stale snapshot from sign-in time.
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent("/account")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      profile: {
        name: profile.name,
        email: profile.email,
        image: profile.image,
        createdAt: profile.createdAt.toISOString(),
        bookingsCount: profile.bookingsCount,
        favoritesCount: profile.favoritesCount,
      },
    },
  };
};

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/** Downscale any picked image to a 256×256 center-cropped JPEG data-URL. */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-2d-context");

    // Cover: scale so the shorter side fills the square, then center-crop.
    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);

    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    bitmap.close();
  }
}

function makeProfileSchema(t: Dictionary) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t.account.profile.nameTooShort)
      .max(80, t.account.profile.nameTooLong),
  });
}

function ProfileSection({ profile }: { profile: AccountProfile }) {
  const { t } = useTranslation();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(profile.image);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState(false);

  const schema = useMemo(() => makeProfileSchema(t), [t]);
  type ProfileValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: profile.name ?? "" },
  });

  async function saveImage(next: string | null) {
    setAvatarError(false);
    setAvatarPending(true);
    const previous = image;
    setImage(next); // optimistic preview
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ image: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setImage(previous);
      setAvatarError(true);
    } finally {
      setAvatarPending(false);
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = ""; // let the same file be picked again later
    if (!file) return;

    setAvatarError(false);
    setAvatarPending(true);
    let dataUrl: string;
    try {
      dataUrl = await fileToAvatarDataUrl(file);
    } catch {
      setAvatarError(true);
      setAvatarPending(false);
      return;
    }
    await saveImage(dataUrl);
  }

  async function onSubmitName(values: ProfileValues) {
    setNameSaved(false);
    setNameError(false);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: values.name }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Refresh the header name without a re-login (jwt "update" trigger).
      await update({ name: values.name });
      reset({ name: values.name });
      setNameSaved(true);
    } catch {
      setNameError(true);
    }
  }

  const nameField = register("name");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.account.profile.title}</CardTitle>
        <CardDescription>{t.account.profile.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <UserAvatar
            image={image}
            name={profile.name}
            email={profile.email}
            className="size-20 text-2xl"
          />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera />
                {image ? t.account.avatar.change : t.account.avatar.upload}
              </Button>
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={avatarPending}
                  onClick={() => saveImage(null)}
                >
                  <Trash2 />
                  {t.account.avatar.remove}
                </Button>
              )}
            </div>
            {avatarPending ? (
              <p className="text-xs text-muted-foreground">{t.account.avatar.uploading}</p>
            ) : avatarError ? (
              <p className="text-xs text-destructive">{t.account.avatar.error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t.account.avatar.hint}</p>
            )}
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit(onSubmitName)} noValidate className="flex flex-col gap-2">
          <Label htmlFor="displayName">{t.account.profile.displayName}</Label>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder={t.account.profile.displayNamePlaceholder}
            aria-invalid={Boolean(errors.name)}
            {...nameField}
            onChange={(event) => {
              setNameSaved(false);
              setNameError(false);
              return nameField.onChange(event);
            }}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.account.profile.saving : t.account.profile.save}
            </Button>
            {nameSaved && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Check className="size-4" />
                {t.account.profile.saved}
              </span>
            )}
            {nameError && (
              <span className="text-sm text-destructive">{t.account.profile.saveError}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AccountInfoSection({ profile }: { profile: AccountProfile }) {
  const { t, locale } = useTranslation();
  const dfLocale = locale === "ru" ? ruLocale : enUS;
  const memberSince = format(
    new Date(profile.createdAt),
    locale === "ru" ? "d MMMM yyyy" : "MMMM d, yyyy",
    { locale: dfLocale },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.account.info.title}</CardTitle>
        <CardDescription>{t.account.info.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.account.info.email}</Label>
          <Input id="email" type="email" value={profile.email} readOnly disabled />
          <p className="text-xs text-muted-foreground">{t.account.info.emailHint}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t.account.info.memberSince}</span>
          <span className="text-sm font-medium text-foreground tabular-nums">{memberSince}</span>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/bookings"
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {profile.bookingsCount}
              </span>
              <span className="text-sm text-muted-foreground">{t.account.info.bookings}</span>
            </span>
          </Link>
          <Link
            href="/favorites"
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Heart className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {profile.favoritesCount}
              </span>
              <span className="text-sm text-muted-foreground">{t.account.info.favorites}</span>
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function makePasswordSchema(t: Dictionary) {
  return z.object({
    currentPassword: z.string().min(1, t.account.password.currentRequired),
    newPassword: z.string().min(8, t.account.password.passwordTooShort),
  });
}

function PasswordSection() {
  const { t } = useTranslation();
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const schema = useMemo(() => makePasswordSchema(t), [t]);
  type PasswordValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: PasswordValues) {
    setServerMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(values),
      });
      if (res.status === 403) {
        setServerMessage({ type: "error", text: t.account.password.wrongCurrent });
        return;
      }
      if (res.status === 429) {
        setServerMessage({ type: "error", text: t.account.password.tooMany });
        return;
      }
      if (!res.ok) {
        setServerMessage({ type: "error", text: t.account.password.error });
        return;
      }
      reset({ currentPassword: "", newPassword: "" });
      setServerMessage({ type: "success", text: t.account.password.success });
    } catch {
      setServerMessage({ type: "error", text: t.account.password.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.account.password.title}</CardTitle>
        <CardDescription>{t.account.password.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">{t.account.password.currentPassword}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">{t.account.password.newPassword}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          {serverMessage && (
            <p
              className={
                serverMessage.type === "error"
                  ? "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  : "rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
              }
            >
              {serverMessage.text}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? t.account.password.submitting : t.account.password.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZone() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function deleteAccount() {
    setPending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setFailed(true);
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <Card className="ring-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">{t.account.danger.title}</CardTitle>
        <CardDescription>{t.account.danger.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {confirming ? (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">{t.account.danger.confirm}</p>
              <p className="text-sm text-muted-foreground">{t.account.danger.confirmHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" disabled={pending} onClick={deleteAccount}>
                {pending ? t.account.danger.deleting : t.account.danger.confirmDelete}
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
                {t.account.danger.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2 />
            {t.account.danger.delete}
          </Button>
        )}
        {failed && <p className="mt-3 text-sm text-destructive">{t.account.danger.deleteError}</p>}
      </CardContent>
    </Card>
  );
}

export default function AccountPage({ profile }: AccountPageProps) {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={`${t.account.title} — ${t.common.appName}`} description={t.account.subtitle} />

      <section className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t.account.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.account.subtitle}</p>
        </header>

        <div className="mt-8 flex flex-col gap-6">
          <ProfileSection profile={profile} />
          <AccountInfoSection profile={profile} />
          <PasswordSection />
          <DangerZone />
        </div>
      </section>
    </>
  );
}
