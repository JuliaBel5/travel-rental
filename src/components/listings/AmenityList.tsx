import type { Amenity } from "@/types";
import { localize, useTranslation } from "@/locales";
import { getAmenityIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function AmenityList({
  amenityKeys,
  amenities,
  className,
}: {
  amenityKeys: string[];
  amenities: Amenity[];
  className?: string;
}) {
  const { locale } = useTranslation();
  const byKey = new Map(amenities.map((amenity) => [amenity.key, amenity]));

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      {amenityKeys.map((key) => {
        const amenity = byKey.get(key);
        if (!amenity) return null;
        const Icon = getAmenityIcon(key);
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-foreground">{localize(amenity.label, locale)}</span>
          </div>
        );
      })}
    </div>
  );
}
