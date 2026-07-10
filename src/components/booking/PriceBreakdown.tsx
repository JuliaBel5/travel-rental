import type { Listing } from "@/types";
import { computePrice, formatPrice } from "@/lib/pricing";
import { useTranslation, type Locale } from "@/locales";
import { cn } from "@/lib/utils";
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", strong && "font-semibold")}>
      <span className={cn(!strong && "text-muted-foreground")}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function PriceBreakdown({
  listing,
  checkIn,
  checkOut,
  className,
}: {
  listing: Listing;
  checkIn?: string;
  checkOut?: string;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const price = computePrice(listing, checkIn ?? "", checkOut ?? "");

  if (price.nights === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{t.booking.pickDates}</p>;
  }

  const money = (amount: number) => formatPrice(amount, price.currency, locale);
  const nightsLabel = `${money(price.pricePerNight)} × ${price.nights} ${pluralForm(
    price.nights,
    locale,
    t.booking.nights,
  )}`;

  return (
    <div className={cn("flex flex-col gap-3 text-sm", className)}>
      <Row label={nightsLabel} value={money(price.subtotal)} />
      <Row label={t.booking.cleaningFee} value={money(price.cleaningFee)} />
      <Row label={t.booking.serviceFee} value={money(price.serviceFee)} />
      <Separator />
      <Row label={t.booking.total} value={money(price.total)} strong />
    </div>
  );
}
