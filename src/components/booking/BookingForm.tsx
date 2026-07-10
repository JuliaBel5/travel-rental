import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";

import type { Booking } from "@/types";
import { saveBooking } from "@/lib/bookings";
import { useTranslation, type Dictionary } from "@/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Build the validation schema from the active dictionary so messages localize. */
function makeSchema(t: Dictionary) {
  return z.object({
    guestName: z.string().min(2, t.booking.form.nameTooShort),
    guestEmail: z.email(t.booking.form.emailInvalid),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

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
  const router = useRouter();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => makeSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { guestName: "", guestEmail: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
          guestName: values.guestName,
          guestEmail: values.guestEmail,
        }),
      });

      if (!response.ok) {
        setServerError(t.booking.form.error);
        return;
      }

      const booking = (await response.json()) as Booking;
      saveBooking(booking);
      router.push({ pathname: "/booking/confirm", query: { id: booking.id } });
    } catch {
      setServerError(t.booking.form.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="guestName">{t.booking.form.name}</Label>
        <Input
          id="guestName"
          autoComplete="name"
          placeholder={t.booking.form.namePlaceholder}
          aria-invalid={Boolean(errors.guestName)}
          {...register("guestName")}
        />
        {errors.guestName && <p className="text-sm text-destructive">{errors.guestName.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="guestEmail">{t.booking.form.email}</Label>
        <Input
          id="guestEmail"
          type="email"
          autoComplete="email"
          placeholder={t.booking.form.emailPlaceholder}
          aria-invalid={Boolean(errors.guestEmail)}
          {...register("guestEmail")}
        />
        {errors.guestEmail && (
          <p className="text-sm text-destructive">{errors.guestEmail.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.booking.form.submitting : t.booking.form.submit}
      </Button>
    </form>
  );
}
