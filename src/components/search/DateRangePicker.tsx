import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { enUS, ru as ruLocale } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Show two months side by side on desktop, a single month on small screens. */
function useMonthsToShow(): number {
  const [months, setMonths] = useState(2);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setMonths(query.matches ? 2 : 1);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return months;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const dfLocale = locale === "ru" ? ruLocale : enUS;
  const months = useMonthsToShow();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmt = (date: Date) => format(date, "d MMM", { locale: dfLocale });
  const hasRange = Boolean(value?.from);
  const label = value?.from
    ? value.to
      ? `${fmt(value.from)} – ${fmt(value.to)}`
      : fmt(value.from)
    : t.search.addDates;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("h-12 w-full justify-start gap-2 font-normal", className)}
          />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className={cn("truncate", !hasRange && "text-muted-foreground")}>{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
          numberOfMonths={months}
          disabled={{ before: today }}
          locale={dfLocale}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
