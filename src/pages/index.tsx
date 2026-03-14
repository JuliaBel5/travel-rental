import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { ArrowRight } from "lucide-react";

import type { Category, Listing } from "@/types";
import { getCategories, getFeaturedListings } from "@/lib/data";
import { useTranslation } from "@/locales";
import { Hero } from "@/components/home/Hero";
import { CategoryChips } from "@/components/home/CategoryChips";
import { ListingGrid } from "@/components/listings/ListingGrid";

interface HomeProps {
  featured: Listing[];
  categories: Category[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  return {
    props: {
      featured: getFeaturedListings(8),
      categories: getCategories(),
    },
  };
};

export default function Home({ featured, categories }: HomeProps) {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{`${t.common.appName} — ${t.common.tagline}`}</title>
        <meta name="description" content={t.home.metaDescription} />
      </Head>

      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="mb-5">
          <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {t.home.categories.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.home.categories.subtitle}</p>
        </div>
        <CategoryChips categories={categories} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {t.home.featured.title}
            </h2>
            <p className="mt-1 text-muted-foreground">{t.home.featured.subtitle}</p>
          </div>
          <Link
            href="/listings"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary sm:inline-flex"
          >
            {t.home.featured.viewAll}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <ListingGrid listings={featured} />
      </section>
    </>
  );
}
