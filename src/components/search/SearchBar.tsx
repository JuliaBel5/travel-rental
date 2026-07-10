import { useState } from "react";
import { useRouter } from "next/router";
import { MapPin, Search } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "./DateRangePicker";
import { GuestSelector } from "./GuestSelector";

const triggerClassName =
  "border-0 bg-transparent shadow-none hover:bg-muted/60 dark:bg-transparent dark:hover:bg-muted/40";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [location, setLocation] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState(1);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query: Record<string, string> = {};
    const trimmed = location.trim();
    if (trimmed) query.location = trimmed;
    if (range?.from) query.checkIn = format(range.from, "yyyy-MM-dd");
    if (range?.to) query.checkOut = format(range.to, "yyyy-MM-dd");
    if (guests > 1) query.guests = String(guests);

    router.push({ pathname: "/listings", query });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm ring-1 ring-foreground/5 md:flex-row md:items-center md:gap-1 md:rounded-full md:p-1.5",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        <Input
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t.search.locationPlaceholder}
          aria-label={t.search.locationPlaceholder}
          className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-sm dark:bg-transparent"
        />
      </div>

      <Separator orientation="horizontal" className="md:hidden" />
      <Separator orientation="vertical" className="hidden h-8 md:block" />

      <DateRangePicker
        value={range}
        onChange={setRange}
        className={cn("flex-1", triggerClassName)}
      />

      <Separator orientation="horizontal" className="md:hidden" />
      <Separator orientation="vertical" className="hidden h-8 md:block" />

      <GuestSelector
        value={guests}
        onChange={setGuests}
        className={cn("flex-1", triggerClassName)}
      />

      <Button
        type="submit"
        size="lg"
        className="h-12 gap-2 rounded-xl md:aspect-square md:rounded-full md:px-0"
      >
        <Search className="size-4" />
        <span className="md:sr-only">{t.common.search}</span>
      </Button>
    </form>
  );
}
