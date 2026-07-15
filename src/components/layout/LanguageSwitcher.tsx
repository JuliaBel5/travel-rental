import { useRouter } from "next/router";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation, type Locale } from "@/locales";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useTranslation();
  const other: Locale = locale === "ru" ? "en" : "ru";

  function switchTo(next: Locale) {
    const { pathname, query, asPath } = router;
    // Change only the locale while preserving the current route and query.
    router.push({ pathname, query }, asPath, { locale: next });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="hover:bg-foreground/10 dark:hover:bg-foreground/10"
      onClick={() => switchTo(other)}
      aria-label={`Switch language to ${other.toUpperCase()}`}
    >
      <Globe />
      {other.toUpperCase()}
    </Button>
  );
}
