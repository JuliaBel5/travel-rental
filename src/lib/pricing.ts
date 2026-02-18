import type { CurrencyCode, Listing, PriceBreakdown } from "@/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole nights between two ISO dates (0 if the range is empty or invalid). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const nights = Math.round((end - start) / MS_PER_DAY);
  return nights > 0 ? nights : 0;
}

type Priceable = Pick<Listing, "pricePerNight" | "cleaningFee" | "serviceFeeRate" | "currency">;

/** Compute the full price breakdown for a stay. */
export function computePrice(
  listing: Priceable,
  checkIn: string,
  checkOut: string,
): PriceBreakdown {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = nights * listing.pricePerNight;
  const cleaningFee = nights > 0 ? listing.cleaningFee : 0;
  const serviceFee = Math.round(subtotal * listing.serviceFeeRate);
  const total = subtotal + cleaningFee + serviceFee;

  return {
    nights,
    pricePerNight: listing.pricePerNight,
    subtotal,
    cleaningFee,
    serviceFee,
    total,
    currency: listing.currency,
  };
}

/** Format a monetary amount for the given locale. */
export function formatPrice(amount: number, currency: CurrencyCode, locale: string): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
