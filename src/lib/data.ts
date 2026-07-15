import type {
  Amenity as DbAmenity,
  Category as DbCategory,
  Host as DbHost,
  Listing as DbListing,
  Review as DbReview,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type {
  Amenity,
  Category,
  CurrencyCode,
  Host,
  Listing,
  ListingLocation,
  Localized,
  PropertyType,
  Review,
} from "@/types";

export type SortOption = "recommended" | "price_asc" | "price_desc" | "rating_desc";

export interface ListingFilters {
  /** Free-text match against city/country in either language. */
  location?: string;
  category?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Property types to include (empty/undefined = all). */
  types?: string[];
  /** Amenity keys that must all be present. */
  amenities?: string[];
  sort?: SortOption;
}

// ---- row → domain mappers (Prisma Json fields cast to typed shapes) ----

function toListing(row: DbListing): Listing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title as unknown as Localized,
    description: row.description as unknown as Localized,
    type: row.type as PropertyType,
    categoryKeys: row.categoryKeys,
    location: row.location as unknown as ListingLocation,
    pricePerNight: row.pricePerNight,
    currency: row.currency as CurrencyCode,
    cleaningFee: row.cleaningFee,
    serviceFeeRate: row.serviceFeeRate,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    maxGuests: row.maxGuests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    amenityKeys: row.amenityKeys,
    images: row.images,
    hostId: row.hostId,
  };
}

function toReview(row: DbReview): Review {
  return {
    id: row.id,
    listingId: row.listingId,
    author: row.author,
    avatar: row.avatar,
    rating: row.rating,
    date: row.date,
    text: row.text as unknown as Localized,
  };
}

function toHost(row: DbHost): Host {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    joinedYear: row.joinedYear,
    isSuperhost: row.isSuperhost,
  };
}

function toCategory(row: DbCategory): Category {
  return { key: row.key, label: row.label as unknown as Localized, icon: row.icon };
}

function toAmenity(row: DbAmenity): Amenity {
  return { key: row.key, label: row.label as unknown as Localized };
}

// ---- in-memory filtering/sorting (dataset is small; keeps behavior identical) ----

function matchesLocation(listing: Listing, query: string): boolean {
  const haystack = [
    listing.location.city.ru,
    listing.location.city.en,
    listing.location.country.ru,
    listing.location.country.en,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function sortListings(items: Listing[], sort: SortOption = "recommended"): Listing[] {
  const sorted = [...items];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
    case "price_desc":
      return sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
    case "rating_desc":
    case "recommended":
    default:
      return sorted.sort((a, b) => b.rating - a.rating);
  }
}

// ---- accessors (async, DB-backed) ----

export async function getAllListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const rows = await prisma.listing.findMany();
  let result = rows.map(toListing);

  if (filters.location) {
    result = result.filter((l) => matchesLocation(l, filters.location as string));
  }
  if (filters.category) {
    result = result.filter((l) => l.categoryKeys.includes(filters.category as string));
  }
  if (typeof filters.guests === "number" && filters.guests > 0) {
    result = result.filter((l) => l.maxGuests >= (filters.guests as number));
  }
  if (typeof filters.minPrice === "number") {
    result = result.filter((l) => l.pricePerNight >= (filters.minPrice as number));
  }
  if (typeof filters.maxPrice === "number") {
    result = result.filter((l) => l.pricePerNight <= (filters.maxPrice as number));
  }
  if (filters.types && filters.types.length > 0) {
    result = result.filter((l) => filters.types!.includes(l.type));
  }
  if (filters.amenities && filters.amenities.length > 0) {
    result = result.filter((l) => filters.amenities!.every((key) => l.amenityKeys.includes(key)));
  }

  return sortListings(result, filters.sort);
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const row = await prisma.listing.findUnique({ where: { id } });
  return row ? toListing(row) : undefined;
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const row = await prisma.listing.findUnique({ where: { slug } });
  return row ? toListing(row) : undefined;
}

export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  const rows = await prisma.listing.findMany({ orderBy: { rating: "desc" }, take: limit });
  return rows.map(toListing);
}

/** The user's saved listings, most recently saved first. */
export async function getFavoriteListings(userId: string): Promise<Listing[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toListing(row.listing));
}

export async function getAllListingSlugs(): Promise<string[]> {
  const rows = await prisma.listing.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getHost(id: string): Promise<Host | undefined> {
  const row = await prisma.host.findUnique({ where: { id } });
  return row ? toHost(row) : undefined;
}

export async function getReviews(listingId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({ where: { listingId } });
  return rows.map(toReview);
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { key: "asc" } });
  return rows.map(toCategory);
}

export async function getAmenities(): Promise<Amenity[]> {
  const rows = await prisma.amenity.findMany({ orderBy: { key: "asc" } });
  return rows.map(toAmenity);
}

export async function getAllHosts(): Promise<Host[]> {
  const rows = await prisma.host.findMany();
  return rows.map(toHost);
}

// ---- account (current user) ----

export interface UserProfile {
  name: string | null;
  email: string;
  /** base64 data-URL or null; never stored in the JWT/session (see lib/auth). */
  image: string | null;
  createdAt: Date;
  bookingsCount: number;
  favoritesCount: number;
}

/** Fresh account snapshot for the signed-in user (never trust the stale JWT). */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { bookings: true, favorites: true } },
    },
  });
  if (!row) return null;
  return {
    name: row.name,
    email: row.email,
    image: row.image,
    createdAt: row.createdAt,
    bookingsCount: row._count.bookings,
    favoritesCount: row._count.favorites,
  };
}

/** Update the editable profile fields; only provided keys are written. */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; image?: string | null },
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data });
}

export type ChangePasswordResult = { ok: true } | { ok: false; reason: "not_found" | "mismatch" };

/** Verify the current password, then hash and store the new one. */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, reason: "not_found" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { ok: false, reason: "mismatch" };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}

/**
 * Delete the account. Favorites cascade at the DB level, but we clear them
 * explicitly and disconnect bookings (userId is nullable) so past reservations
 * survive as history — all atomically.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.booking.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
