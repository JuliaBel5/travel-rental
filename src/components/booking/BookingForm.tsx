import { useState } from "react";
import { useRouter } from "next/router";

import type { Booking } from "@/types";
import { useTranslation } from "@/locales";
import { Button } from "@/components/ui/button";

/**
 * The guest is the logged-in user, so this is just a confirm action — the API
 * derives the name/email + userId from the session.
 */
export function BookingForm({
  listingId,
  checkIn,
  checkOut,
  guests,
}: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onReserve() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, checkIn, checkOut, guests }),
      });
      setLoading(false);

      if (response.status === 409) {
        setError(t.booking.form.unavailable);
        return;
      }
      if (!response.ok) {
        setError(t.booking.form.error);
        return;
      }

      const booking = (await response.json()) as Booking;
      router.push({ pathname: "/booking/confirm", query: { id: booking.id } });
    } catch {
      setLoading(false);
      setError(t.booking.form.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button size="lg" onClick={onReserve} disabled={loading} className="w-full">
        {loading ? t.booking.form.submitting : t.booking.form.submit}
      </Button>
    </div>
  );
}
