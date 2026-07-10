import Image from "next/image";
import { Sparkles } from "lucide-react";

import { useTranslation } from "@/locales";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search/SearchBar";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative isolate flex overflow-hidden border-b border-border">
      {/* Full-bleed photo background */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image
          src="/hero.jpg"
          alt={t.home.hero.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Bottom-weighted legibility scrim (keeps the SearchBar + subtitle crisp) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/45 to-black/30"
      />
      {/* Soft central darkening to tame the bright sun glare behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_42%,rgba(0,0,0,0.4),transparent_72%)]"
      />

      <div className="mx-auto flex min-h-[34rem] w-full max-w-6xl flex-col items-center justify-center gap-6 px-4 py-20 text-center md:min-h-[40rem] md:py-28">
        <Badge
          variant="secondary"
          className="gap-1.5 border border-white/25 bg-white/15 px-3 py-1 text-white backdrop-blur-sm"
        >
          <Sparkles className="size-3" />
          {t.home.hero.eyebrow}
        </Badge>

        <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance text-white drop-shadow-md sm:text-5xl md:text-6xl">
          {t.home.hero.title}
        </h1>

        <p className="max-w-xl text-lg text-pretty text-white/85 drop-shadow">
          {t.home.hero.subtitle}
        </p>

        <div className="mt-4 w-full max-w-3xl">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
