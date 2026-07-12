import Image from "next/image";
import Link from "next/link";
import { Star, Users } from "lucide-react";

import type { Listing } from "@/types";
import { localize, useTranslation, type Locale } from "@/locales";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

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

export function ListingCard({ listing, className }: { listing: Listing; className?: string }) {
  const { t, locale } = useTranslation();

  const title = localize(listing.title, locale);
  const city = localize(listing.location.city, locale);
  const country = localize(listing.location.country, locale);
  const price = formatPrice(listing.pricePerNight, listing.currency, locale);

  return (
    <div className="group relative">
      <Link
        href={`/listings/${listing.slug}`}
        className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card
          className={cn(
            "gap-0 py-0 ring-foreground/10 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-foreground/20",
            className,
          )}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <Image
              src={listing.images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <Star className="size-3.5 fill-current text-foreground" />
              <span className="tabular-nums">{listing.rating.toFixed(2)}</span>
            </div>
          </div>

          <CardContent className="flex flex-col gap-1 px-4 py-4">
            <h3 className="truncate font-heading text-base leading-snug font-medium text-foreground">
              {title}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {city}, {country}
            </p>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span className="tabular-nums">{listing.maxGuests}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{listing.reviewsCount}</span>
              <span>{pluralForm(listing.reviewsCount, locale, t.listing.reviews)}</span>
            </div>

            <p className="mt-2 text-sm text-foreground">
              <span className="text-base font-semibold">{price}</span>
              <span className="text-muted-foreground"> / {t.listing.perNight}</span>
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* Sibling of the Link, not a child: nested interactive elements are invalid. */}
      <FavoriteButton
        listingId={listing.id}
        className="absolute top-3 left-3 z-10 transition-transform duration-200 group-hover:-translate-y-1"
      />
    </div>
  );
}
