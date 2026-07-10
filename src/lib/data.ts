import { amenities } from "@/data/amenities";
import { categories } from "@/data/categories";
import { hostById, hosts } from "@/data/hosts";
import { listingById, listingBySlug, listings } from "@/data/listings";
import { reviewsForListing } from "@/data/reviews";
import type { Amenity, Category, Host, Listing, Review } from "@/types";

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

export function getAllListings(filters: ListingFilters = {}): Listing[] {
  let result = listings;

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

export function getListingById(id: string): Listing | undefined {
  return listingById.get(id);
}

export function getListingBySlug(slug: string): Listing | undefined {
  return listingBySlug.get(slug);
}

export function getFeaturedListings(limit = 6): Listing[] {
  return [...listings].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getAllListingSlugs(): string[] {
  return listings.map((l) => l.slug);
}

export function getHost(id: string): Host | undefined {
  return hostById.get(id);
}

export function getReviews(listingId: string): Review[] {
  return reviewsForListing(listingId);
}

export function getCategories(): Category[] {
  return categories;
}

export function getAmenities(): Amenity[] {
  return amenities;
}

export function getAllHosts(): Host[] {
  return hosts;
}
