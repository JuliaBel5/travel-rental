// The authoritative booking records live in the database. The browser only
// remembers the ids of bookings it created (until there is real auth), and the
// pages fetch the full records from the API by those ids.

const STORAGE_KEY = "wanderstay.bookingIds";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

/** Ids of bookings created in this browser, newest first ([] on the server). */
export function getStoredBookingIds(): string[] {
  return read();
}

/** Remember a booking id (newest first, de-duplicated). */
export function rememberBookingId(id: string): void {
  if (typeof window === "undefined") return;
  const ids = [id, ...read().filter((item) => item !== id)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write failures (quota exceeded / private mode).
  }
}
