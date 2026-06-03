import Head from "next/head";
import Image from "next/image";
import type { GetServerSideProps } from "next";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";

import type { Listing } from "@/types";
import { getListingById, getListingBySlug } from "@/lib/data";
import { nightsBetween } from "@/lib/pricing";
import { localize, useTranslation, type Locale } from "@/locales";
import { Separator } from "@/components/ui/separator";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { BookingForm } from "@/components/booking/BookingForm";

interface BookingPageProps {
  listing: Listing;
  checkIn: string;
  checkOut: string;
  guests: number;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value);
  if (raw === undefined || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
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

export const getServerSideProps: GetServerSideProps<BookingPageProps> = async ({ query }) => {
  const id = firstParam(query.id);
  const checkIn = firstParam(query.checkIn);
  const checkOut = firstParam(query.checkOut);
  const guests = numberParam(query.guests) ?? 1;

  const listing = id ? (getListingById(id) ?? getListingBySlug(id)) : undefined;
  if (!listing || !checkIn || !checkOut || nightsBetween(checkIn, checkOut) <= 0) {
    return { redirect: { destination: "/listings", permanent: false } };
  }

  return { props: { listing, checkIn, checkOut, guests } };
};

export default function BookingPage({ listing, checkIn, checkOut, guests }: BookingPageProps) {
  const { t, locale } = useTranslation();
  const dfLocale = locale === "ru" ? ruLocale : enUS;

  const title = localize(listing.title, locale);
  const city = localize(listing.location.city, locale);
  const country = localize(listing.location.country, locale);
  const formatDate = (value: string) => format(new Date(value), "d MMM yyyy", { locale: dfLocale });
  const guestWord = pluralForm(guests, locale, t.search.guests);

  return (
    <>
      <Head>
        <title>{`${t.booking.title} — ${t.common.appName}`}</title>
        <meta name="description" content={t.booking.summary} />
      </Head>

      <section className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <h1 className="mb-8 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t.booking.title}
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-5">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t.booking.form.heading}
            </h2>
            <BookingForm
              listingId={listing.id}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          </div>

          <aside>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20">
              <h2 className="font-heading text-base font-medium text-foreground">
                {t.booking.summary}
              </h2>

              <div className="flex gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={listing.images[0]}
                    alt={title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">
                    {city}, {country}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{t.booking.checkIn}</span>
                  <span>{formatDate(checkIn)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{t.booking.checkOut}</span>
                  <span>{formatDate(checkOut)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{t.search.guests.label}</span>
                  <span className="tabular-nums">
                    {guests} {guestWord}
                  </span>
                </div>
              </div>

              <Separator />

              <PriceBreakdown listing={listing} checkIn={checkIn} checkOut={checkOut} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
