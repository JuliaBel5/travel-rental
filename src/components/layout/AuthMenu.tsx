import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/locales";

export function AuthMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
  }

  if (status === "loading") {
    return <div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (session?.user) {
    const label = session.user.name ?? session.user.email ?? "";
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">{label}</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut />
          <span className="hidden sm:inline">{t.auth.signOut}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" render={<Link href="/login" />}>
        {t.auth.logIn}
      </Button>
      <Button size="sm" className="hidden sm:inline-flex" render={<Link href="/signup" />}>
        {t.auth.signUp}
      </Button>
    </div>
  );
}
