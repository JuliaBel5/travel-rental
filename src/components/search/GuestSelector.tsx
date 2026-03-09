import { Minus, Plus, Users } from "lucide-react";

import { useTranslation, type Locale } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

export function GuestSelector({
  value,
  onChange,
  min = 1,
  max = 16,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const word = pluralForm(value, locale, t.search.guests);

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
        <Users className="size-4 text-muted-foreground" />
        <span className="truncate tabular-nums">
          {value} {word}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="font-medium">{t.search.guests.label}</Label>
            <span className="text-xs text-muted-foreground">{t.search.guests.hint}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="-"
              disabled={value <= min}
              onClick={() => onChange(Math.max(min, value - 1))}
            >
              <Minus />
            </Button>
            <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="+"
              disabled={value >= max}
              onClick={() => onChange(Math.min(max, value + 1))}
            >
              <Plus />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
