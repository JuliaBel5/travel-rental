import Link from "next/link";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";

import type { Listing } from "@/types";
import { authOptions } from "@/lib/auth";
import { getFavoriteListings } from "@/lib/data";
import { useTranslation } from "@/locales";
import { Button } from "@/components/ui/button";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Seo } from "@/components/Seo";

interface FavoritesPageProps {
  listings: Listing[];
}

export const getServerSideProps: GetServerSideProps<FavoritesPageProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent("/favorites")}`,
        permanent: false,
      },
    };
  }

  return { props: { listings: await getFavoriteListings(session.user.id) } };
};

export default function FavoritesPage({ listings }: FavoritesPageProps) {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={`${t.nav.favorites} — ${t.common.appName}`} description={t.common.description} />

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t.nav.favorites}
        </h1>

        {listings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t.favorites.emptyTitle}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t.favorites.emptySubtitle}</p>
            <Button render={<Link href="/listings" />}>{t.favorites.browseStays}</Button>
          </div>
        ) : (
          <ListingGrid listings={listings} className="mt-8" />
        )}
      </section>
    </>
  );
}
