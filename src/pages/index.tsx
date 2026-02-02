import Head from "next/head";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/locales";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t.common.appName}</title>
        <meta name="description" content={t.common.tagline} />
      </Head>

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.common.appName}</h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t.common.tagline}</p>
        <Button size="lg">{t.common.search}</Button>
      </section>
    </>
  );
}
