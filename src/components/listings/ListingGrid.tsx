import type { Listing } from "@/types";
import { cn } from "@/lib/utils";
import { ListingCard } from "./ListingCard";

export function ListingGrid({ listings, className }: { listings: Listing[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
