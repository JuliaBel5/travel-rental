import Link from "next/link";
import { Compass } from "lucide-react";

import { useTranslation } from "@/locales";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={`${t.notFound.title} — ${t.common.appName}`} description={t.notFound.subtitle} />

      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-8" />
        </div>

        <p className="font-heading text-6xl font-semibold tracking-tight text-foreground">404</p>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {t.notFound.title}
          </h1>
          <p className="text-muted-foreground">{t.notFound.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/" />}>{t.notFound.backHome}</Button>
          <Button variant="outline" render={<Link href="/listings" />}>
            {t.notFound.browseStays}
          </Button>
        </div>
      </section>
    </>
  );
}
