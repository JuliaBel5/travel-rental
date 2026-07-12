import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { addDays, format, parseISO } from "date-fns";
import type { DateRange, Matcher } from "react-day-picker";

import type { Listing } from "@/types";
import { formatPrice, nightsBetween } from "@/lib/pricing";
import { useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { GuestSelector } from "@/components/search/GuestSelector";
import { PriceBreakdown } from "./PriceBreakdown";

export function BookingWidget({ listing, className }: { listing: Listing; className?: string }) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState(1);
  const [booked, setBooked] = useState<Array<{ checkIn: string; checkOut: string }>>([]);

  // Existing bookings gray out taken nights in the picker. Best-effort: if the
  // request fails the server still rejects overlaps with a 409 on submit.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/listings/${listing.id}/availability`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.booked) setBooked(data.booked);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [listing.id]);

  // [checkIn, checkOut) → disable nights only; the check-out day stays
  // selectable as the next guest's check-in.
  const disabledRanges = useMemo<Matcher[]>(
    () =>
      booked
        .map((b) => ({ from: parseISO(b.checkIn), to: addDays(parseISO(b.checkOut), -1) }))
        .filter((m) => m.to >= m.from),
    [booked],
  );

  const checkIn = range?.from ? format(range.from, "yyyy-MM-dd") : undefined;
  const checkOut = range?.to ? format(range.to, "yyyy-MM-dd") : undefined;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const canReserve = nights > 0;

  function reserve() {
    if (!canReserve || !checkIn || !checkOut) return;
    router.push({
      pathname: "/booking",
      query: { id: listing.id, checkIn, checkOut, guests: String(guests) },
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-lg ring-1 ring-foreground/5",
        className,
      )}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-foreground">
          {formatPrice(listing.pricePerNight, listing.currency, locale)}
        </span>
        <span className="text-sm text-muted-foreground">/ {t.listing.perNight}</span>
      </div>

      <div className="flex flex-col gap-2">
        <DateRangePicker value={range} onChange={setRange} disabledRanges={disabledRanges} />
        <GuestSelector value={guests} onChange={setGuests} max={listing.maxGuests} />
      </div>

      <PriceBreakdown listing={listing} checkIn={checkIn} checkOut={checkOut} />

      <Button size="lg" className="w-full" disabled={!canReserve} onClick={reserve}>
        {t.booking.reserve}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t.booking.youWontBeCharged}</p>
    </div>
  );
}
