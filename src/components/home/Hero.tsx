import { Sparkles } from "lucide-react";

import { useTranslation } from "@/locales";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search/SearchBar";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* Layered gradient mesh built from theme tokens for depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-32 -z-10 h-72 w-96 rounded-full bg-secondary/70 blur-3xl"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <Sparkles className="size-3" />
          {t.home.hero.eyebrow}
        </Badge>

        <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          {t.home.hero.title}
        </h1>

        <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t.home.hero.subtitle}</p>

        <div className="mt-4 w-full max-w-3xl">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
