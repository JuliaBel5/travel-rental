import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

/** Small bbox (~1km) around the point for the OpenStreetMap embed. */
const DELTA = 0.008;

export function ListingMap({
  lat,
  lng,
  address,
  className,
}: {
  lat: number;
  lng: number;
  address: string;
  className?: string;
}) {
  const bbox = `${lng - DELTA},${lat - DELTA},${lng + DELTA},${lat + DELTA}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <iframe
          src={src}
          title={address}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full"
        />
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" />
        {address}
      </p>
    </div>
  );
}
