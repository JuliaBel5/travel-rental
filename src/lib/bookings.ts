import type { Booking } from "@/types";

const STORAGE_KEY = "wanderstay.bookings";

/** Read all bookings from localStorage (returns [] on the server). */
export function getStoredBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

/** Persist a booking, newest first, de-duplicating by id. */
export function saveBooking(booking: Booking): void {
  if (typeof window === "undefined") return;
  const next = [booking, ...getStoredBookings().filter((item) => item.id !== booking.id)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore write failures (quota exceeded / private mode).
  }
}

/** Look up a single stored booking by id (undefined on the server or if absent). */
export function getStoredBooking(id: string): Booking | undefined {
  if (typeof window === "undefined") return undefined;
  return getStoredBookings().find((item) => item.id === id);
}
