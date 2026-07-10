import { useState } from "react";
import { useRouter } from "next/router";
import { Check, Minus, Plus } from "lucide-react";

import type { Amenity, PropertyType } from "@/types";
import type { ListingFilters } from "@/lib/data";
import { localize, useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** Query keys this component owns; everything else is preserved on apply. */
const MANAGED_KEYS = ["minPrice", "maxPrice", "guests", "types", "amenities"];
const MAX_GUESTS = 16;

function CheckOption({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer size-4 appearance-none rounded-[5px] border border-input bg-background transition-colors outline-none checked:border-primary checked:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Check className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
      </span>
      <span className="text-foreground">{label}</span>
    </label>
  );
}

export function Filters({
  filters,
  propertyTypes,
  amenities,
  onApplied,
  className,
}: {
  filters: ListingFilters;
  propertyTypes: PropertyType[];
  amenities: Amenity[];
  onApplied?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [minPrice, setMinPrice] = useState(
    filters.minPrice != null ? String(filters.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    filters.maxPrice != null ? String(filters.maxPrice) : "",
  );
  const [guests, setGuests] = useState(filters.guests ?? 0);
  const [types, setTypes] = useState<string[]>(filters.types ?? []);
  const [amenityKeys, setAmenityKeys] = useState<string[]>(filters.amenities ?? []);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function apply() {
    const query: Record<string, string> = {};
    // Preserve non-managed params already in the URL (location, category, sort…).
    for (const [key, val] of Object.entries(router.query)) {
      if (MANAGED_KEYS.includes(key)) continue;
      const first = Array.isArray(val) ? val[0] : val;
      if (typeof first === "string" && first) query[key] = first;
    }
    if (minPrice.trim()) query.minPrice = minPrice.trim();
    if (maxPrice.trim()) query.maxPrice = maxPrice.trim();
    if (guests > 0) query.guests = String(guests);
    if (types.length > 0) query.types = types.join(",");
    if (amenityKeys.length > 0) query.amenities = amenityKeys.join(",");

    router.push({ pathname: "/listings", query });
    onApplied?.();
  }

  function reset() {
    setMinPrice("");
    setMaxPrice("");
    setGuests(0);
    setTypes([]);
    setAmenityKeys([]);
    router.push({ pathname: "/listings", query: {} });
    onApplied?.();
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{t.catalog.price}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder={t.catalog.min}
            aria-label={t.catalog.min}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder={t.catalog.max}
            aria-label={t.catalog.max}
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <Label className="mb-1 text-sm font-medium">{t.catalog.propertyType}</Label>
        {propertyTypes.map((type) => (
          <CheckOption
            key={type}
            checked={types.includes(type)}
            onChange={() => setTypes((prev) => toggle(prev, type))}
            label={t.catalog.propertyTypes[type]}
          />
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">{t.catalog.guests}</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="-"
            disabled={guests <= 0}
            onClick={() => setGuests((value) => Math.max(0, value - 1))}
          >
            <Minus />
          </Button>
          <span className="min-w-16 text-center text-sm font-medium tabular-nums">
            {guests > 0 ? guests : t.catalog.any}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="+"
            disabled={guests >= MAX_GUESTS}
            onClick={() => setGuests((value) => Math.min(MAX_GUESTS, value + 1))}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <Label className="mb-1 text-sm font-medium">{t.catalog.amenities}</Label>
        {amenities.map((amenity) => (
          <CheckOption
            key={amenity.key}
            checked={amenityKeys.includes(amenity.key)}
            onChange={() => setAmenityKeys((prev) => toggle(prev, amenity.key))}
            label={localize(amenity.label, locale)}
          />
        ))}
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        <Button type="button" className="flex-1" onClick={apply}>
          {t.catalog.apply}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          {t.catalog.reset}
        </Button>
      </div>
    </div>
  );
}
