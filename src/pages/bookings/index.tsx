import Image from "next/image";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { CalendarDays, Users } from "lucide-react";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";

import type { CurrencyCode, Localized } from "@/types";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/pricing";
import { localize, useTranslation, type Locale } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

interface BookingItem {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  currency: CurrencyCode;
  listing: { slug: string; title: Localized; image: string } | null;
}

interface MyBookingsProps {
  bookings: BookingItem[];
}

/** Pick the correct plural form for the active locale (no extra deps). */
function pluralForm(
  count: number,
  locale: Locale,
  forms: { one: string; few: string; many: string },
): string {
  const category = new Intl.PluralRules(locale === "ru" ? "ru-RU" : "en-US").select(count);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few;
  return forms.many;
}

export const getServerSideProps: GetServerSideProps<MyBookingsProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent("/bookings")}`,
        permanent: false,
      },
    };
  }

  const rows = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });

  const bookings: BookingItem[] = rows.map((row) => ({
    id: row.id,
    checkIn: row.checkIn.toISOString().slice(0, 10),
    checkOut: row.checkOut.toISOString().slice(0, 10),
    guests: row.guests,
    total: row.total,
    currency: row.currency as CurrencyCode,
    listing: row.listing
      ? {
          slug: row.listing.slug,
          title: row.listing.title as unknown as Localized,
          image: row.listing.images[0] ?? "",
        }
      : null,
  }));

  return { props: { bookings } };
};

export default function MyBookingsPage({ bookings }: MyBookingsProps) {
  const { t, locale } = useTranslation();
  const dfLocale = locale === "ru" ? ruLocale : enUS;
  const formatDate = (value: string) => format(new Date(value), "d MMM", { locale: dfLocale });

  return (
    <>
      <Seo title={`${t.nav.bookings} — ${t.common.appName}`} description={t.common.description} />

      <section className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t.nav.bookings}
        </h1>

        {bookings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t.booking.myBookings.emptyTitle}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t.booking.myBookings.emptySubtitle}
            </p>
            <Button render={<Link href="/listings" />}>{t.booking.myBookings.browseStays}</Button>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {bookings.map((item) => {
              const title = item.listing ? localize(item.listing.title, locale) : "";

              const card = (
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border border-border bg-card p-3",
                    item.listing && "transition-colors hover:bg-muted/40",
                  )}
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.listing?.image && (
                      <Image
                        src={item.listing.image}
                        alt={title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate font-medium text-foreground">{title}</p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {formatDate(item.checkIn)} – {formatDate(item.checkOut)}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        <span className="tabular-nums">
                          {item.guests} {pluralForm(item.guests, locale, t.search.guests)}
                        </span>
                      </span>
                    </p>
                  </div>

                  <p className="shrink-0 font-semibold text-foreground tabular-nums">
                    {formatPrice(item.total, item.currency, locale)}
                  </p>
                </div>
              );

              return (
                <li key={item.id}>
                  {item.listing ? (
                    <Link
                      href={`/listings/${item.listing.slug}`}
                      className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
