import { useRouter } from "next/router";
import { Heart } from "lucide-react";

import { useTranslation } from "@/locales";
import { cn } from "@/lib/utils";
import { useFavorites } from "./FavoritesProvider";

/**
 * Heart toggle rendered over a listing photo. Must live OUTSIDE the card's
 * <Link> (nested interactive elements are invalid HTML). Guests are sent to
 * /login and come back to the same page via callbackUrl.
 */
export function FavoriteButton({
  listingId,
  className,
}: {
  listingId: string;
  className?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isFavorite, toggle, isAuthenticated } = useFavorites();

  const active = isFavorite(listingId);
  const label = active ? t.favorites.remove : t.favorites.add;

  function onClick() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    toggle(listingId);
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-all outline-none hover:scale-110 hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          active ? "fill-red-500 text-red-500" : "fill-transparent",
        )}
      />
    </button>
  );
}
