import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/account/UserAvatar";
import { useTranslation } from "@/locales";

interface AccountChip {
  name: string | null;
  image: string | null;
}

export function AuthMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [account, setAccount] = useState<AccountChip | null>(null);

  const sessionName = session?.user?.name ?? null;
  const sessionEmail = session?.user?.email ?? null;

  // The avatar is intentionally kept out of the session cookie, so fetch it
  // once signed in — and again whenever the name changes (e.g. profile save).
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/account")
      .then((res): Promise<AccountChip | null> => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => {
        if (active && data) setAccount(data);
      })
      .catch(() => {
        // Non-fatal: the chip falls back to initials.
      });
    return () => {
      active = false;
    };
  }, [status, sessionName]);

  async function handleSignOut() {
    setAccount(null);
    await signOut({ redirect: false });
    router.push("/");
  }

  if (status === "loading") {
    return <div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (session?.user) {
    const label = sessionName ?? sessionEmail ?? "";
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          aria-label={t.nav.account}
          className="flex items-center gap-2 rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <UserAvatar
            image={account?.image}
            name={account?.name ?? sessionName}
            email={sessionEmail}
            className="size-8 text-xs"
          />
          <span className="hidden max-w-[9rem] truncate text-sm font-medium lg:inline">
            {label}
          </span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-foreground/10 dark:hover:bg-foreground/10"
          onClick={handleSignOut}
        >
          <LogOut />
          <span className="hidden lg:inline">{t.auth.signOut}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-foreground/10 dark:hover:bg-foreground/10"
        render={<Link href="/login" />}
      >
        {t.auth.logIn}
      </Button>
      <Button size="sm" className="hidden lg:inline-flex" render={<Link href="/signup" />}>
        {t.auth.signUp}
      </Button>
    </div>
  );
}
