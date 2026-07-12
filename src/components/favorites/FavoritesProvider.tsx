import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface FavoritesContextValue {
  /** Whether the listing is in the user's favorites. */
  isFavorite: (listingId: string) => boolean;
  /** Optimistically add/remove; rolls back if the server rejects. */
  toggle: (listingId: string) => void;
  /** Guests can't favorite — the button routes them to /login instead. */
  isAuthenticated: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  isFavorite: () => false,
  toggle: () => {},
  isAuthenticated: false,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  // One in-flight PUT/DELETE per listing; stale responses must not clobber
  // newer optimistic state.
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    const controller = new AbortController();
    fetch("/api/favorites", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ids?: string[] } | null) => {
        if (data?.ids) setIds(new Set(data.ids));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isAuthenticated]);

  const isFavorite = useCallback((listingId: string) => ids.has(listingId), [ids]);

  const toggle = useCallback(
    (listingId: string) => {
      if (pending.current.has(listingId)) return;
      pending.current.add(listingId);

      const wasFavorite = ids.has(listingId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      fetch(`/api/favorites/${encodeURIComponent(listingId)}`, {
        method: wasFavorite ? "DELETE" : "PUT",
      })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
        })
        .catch(() => {
          // Roll back the optimistic flip.
          setIds((prev) => {
            const next = new Set(prev);
            if (wasFavorite) next.add(listingId);
            else next.delete(listingId);
            return next;
          });
        })
        .finally(() => {
          pending.current.delete(listingId);
        });
    },
    [ids],
  );

  const value = useMemo(
    () => ({ isFavorite, toggle, isAuthenticated }),
    [isFavorite, toggle, isAuthenticated],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  return useContext(FavoritesContext);
}
