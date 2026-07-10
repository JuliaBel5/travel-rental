import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-0 py-0 ring-foreground/10", className)}>
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <CardContent className="flex flex-col gap-2 px-4 py-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function ListingGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
