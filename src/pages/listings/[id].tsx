import type { GetStaticPaths, GetStaticProps } from "next";
import { Star } from "lucide-react";

import type { Amenity, Host, Listing, Review } from "@/types";
import {
  getAllListingSlugs,
  getAmenities,
  getHost,
  getListingBySlug,
  getReviews,
} from "@/lib/data";
import { localize, useTranslation, type Locale } from "@/locales";
import { Separator } from "@/components/ui/separator";
import { Gallery } from "@/components/listings/Gallery";
import { AmenityList } from "@/components/listings/AmenityList";
import { HostCard } from "@/components/listings/HostCard";
import { ReviewList } from "@/components/listings/ReviewList";
import { ListingMap } from "@/components/listings/ListingMap";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Seo } from "@/components/Seo";

interface DetailProps {
  listing: Listing;
  host: Host | null;
  reviews: Review[];
  amenities: Amenity[];
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

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllListingSlugs().map((slug) => ({ params: { id: slug } })),
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps<DetailProps> = async ({ params, locale }) => {
  // Listing content is localized on the client; `locale` is read to honor the
  // per-locale static generation contract.
  void locale;

  const slug = typeof params?.id === "string" ? params.id : undefined;
  const listing = slug ? getListingBySlug(slug) : undefined;
  if (!listing) {
    return { notFound: true };
  }

  return {
    props: {
      listing,
      host: getHost(listing.hostId) ?? null,
      reviews: getReviews(listing.id),
      amenities: getAmenities(),
    },
  };
};

export default function ListingDetailPage({ listing, host, reviews, amenities }: DetailProps) {
  const { t, locale } = useTranslation();

  const title = localize(listing.title, locale);
  const city = localize(listing.location.city, locale);
  const country = localize(listing.location.country, locale);
  const address = localize(listing.location.address, locale);
  const description = localize(listing.description, locale);
  const typeLabel = t.catalog.propertyTypes[listing.type];

  const summary = [
    `${listing.maxGuests} ${pluralForm(listing.maxGuests, locale, t.search.guests)}`,
    `${listing.bedrooms} ${pluralForm(listing.bedrooms, locale, t.detail.bedrooms)}`,
    `${listing.beds} ${pluralForm(listing.beds, locale, t.detail.beds)}`,
    `${listing.bathrooms} ${pluralForm(listing.bathrooms, locale, t.detail.bathrooms)}`,
  ].join(" · ");

  return (
    <>
      <Seo
        title={`${title} — ${t.common.appName}`}
        description={description}
        image={listing.images[0]}
      />

      <article className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="size-4 fill-current" />
              <span className="tabular-nums">{listing.rating.toFixed(2)}</span>
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="tabular-nums">{listing.reviewsCount}</span>{" "}
              {pluralForm(listing.reviewsCount, locale, t.listing.reviews)}
            </span>
            <span aria-hidden>·</span>
            <span>
              {city}, {country}
            </span>
          </div>
        </header>

        <Gallery images={listing.images} alt={title} />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-1">
              <h2 className="font-heading text-xl font-medium text-foreground">
                {typeLabel} · {city}
              </h2>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {t.detail.description}
              </h2>
              <p className="leading-relaxed whitespace-pre-line text-foreground/90">
                {description}
              </p>
            </section>

            <Separator />

            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {t.detail.whatThisPlaceOffers}
              </h2>
              <AmenityList amenityKeys={listing.amenityKeys} amenities={amenities} />
            </section>

            {host && (
              <>
                <Separator />
                <section className="flex flex-col gap-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {t.detail.hostedBy}
                  </h2>
                  <HostCard host={host} />
                </section>
              </>
            )}

            <Separator />

            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {t.detail.whereYoullBe}
              </h2>
              <ListingMap
                lat={listing.location.lat}
                lng={listing.location.lng}
                address={`${address}, ${city}, ${country}`}
              />
            </section>

            <Separator />

            <section>
              <ReviewList
                reviews={reviews}
                rating={listing.rating}
                reviewsCount={listing.reviewsCount}
              />
            </section>
          </div>

          <aside>
            <div className="lg:sticky lg:top-20">
              <BookingWidget listing={listing} />
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
