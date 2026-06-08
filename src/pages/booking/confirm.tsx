import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CircleCheck } from "lucide-react";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";

import type { Booking } from "@/types";
import { getListingById } from "@/lib/data";
import { getStoredBooking } from "@/lib/bookings";
import { formatPrice } from "@/lib/pricing";
import { localize, useTranslation, type Locale } from "@/locales";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

export default function BookingConfirmPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const id = typeof router.query.id === "string" ? router.query.id : undefined;
    setBooking(id ? getStoredBooking(id) : undefined);
    setReady(true);
  }, [router.isReady, router.query.id]);

  const dfLocale = locale === "ru" ? ruLocale : enUS;
  const formatDate = (value: string) => format(new Date(value), "d MMM yyyy", { locale: dfLocale });
  const listing = booking ? getListingById(booking.listingId) : undefined;

  return (
    <>
      <Head>
        <title>{`${t.booking.confirm.title} — ${t.common.appName}`}</title>
      </Head>

      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
        {!ready ? (
          <p className="text-muted-foreground">{t.common.loading}</p>
        ) : booking ? (
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleCheck className="size-9" />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                {t.booking.confirm.title}
              </h1>
              <p className="text-muted-foreground">{t.booking.confirm.subtitle}</p>
            </div>

            <div className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
              {listing && (
                <>
                  <div className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={listing.images[0]}
                        alt={localize(listing.title, locale)}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="font-medium text-foreground">
                        {localize(listing.title, locale)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {localize(listing.location.city, locale)},{" "}
                        {localize(listing.location.country, locale)}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.confirm.bookingId}</dt>
                  <dd className="font-medium tabular-nums">{booking.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.checkIn}</dt>
                  <dd>{formatDate(booking.checkIn)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.checkOut}</dt>
                  <dd>{formatDate(booking.checkOut)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t.search.guests.label}</dt>
                  <dd className="tabular-nums">
                    {booking.guests} {pluralForm(booking.guests, locale, t.search.guests)}
                  </dd>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between gap-4 font-semibold">
                  <dt>{t.booking.total}</dt>
                  <dd className="tabular-nums">
                    {formatPrice(booking.total, booking.currency, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button className="flex-1" render={<Link href="/bookings" />}>
                {t.booking.confirm.viewMyBookings}
              </Button>
              <Button variant="outline" className="flex-1" render={<Link href="/" />}>
                {t.booking.confirm.backHome}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CircleCheck className="size-7" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              {t.booking.confirm.notFoundTitle}
            </h1>
            <p className="max-w-sm text-muted-foreground">{t.booking.confirm.notFoundSubtitle}</p>
            <Button render={<Link href="/bookings" />}>{t.booking.confirm.viewMyBookings}</Button>
          </div>
        )}
      </section>
    </>
  );
}
