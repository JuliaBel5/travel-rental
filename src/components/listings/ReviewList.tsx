import Image from "next/image";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";

import type { Review } from "@/types";
import { localize, useTranslation, type Locale } from "@/locales";
import { cn } from "@/lib/utils";

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

export function ReviewList({
  reviews,
  rating,
  reviewsCount,
  className,
}: {
  reviews: Review[];
  rating: number;
  reviewsCount: number;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const dfLocale = locale === "ru" ? ruLocale : enUS;
  const reviewWord = pluralForm(reviewsCount, locale, t.listing.reviews);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <h2 className="flex flex-wrap items-center gap-2 font-heading text-xl font-semibold text-foreground">
        <Star className="size-5 fill-current" />
        <span className="tabular-nums">{rating.toFixed(2)}</span>
        <span aria-hidden>·</span>
        <span>
          <span className="tabular-nums">{reviewsCount}</span> {reviewWord}
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={review.avatar}
                  alt={review.author}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground">{review.author}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.date), "LLLL yyyy", { locale: dfLocale })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5" aria-label={`${review.rating}/5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "size-3.5",
                    index < review.rating
                      ? "fill-current text-foreground"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {localize(review.text, locale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
