/** A text value available in both supported languages. */
export type Localized = { ru: string; en: string };

export type PropertyType = "apartment" | "house" | "villa" | "room" | "cabin";

export type CurrencyCode = "USD" | "EUR" | "RUB";

export interface Host {
  id: string;
  name: string;
  avatar: string;
  joinedYear: number;
  isSuperhost: boolean;
}

export interface Amenity {
  /** Stable key used for filtering and icon lookup, e.g. "wifi". */
  key: string;
  label: Localized;
}

export interface Category {
  /** Stable key used in URLs and filtering, e.g. "beach". */
  key: string;
  label: Localized;
  /** lucide-react icon name. */
  icon: string;
}

export interface Review {
  id: string;
  listingId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string; // ISO date
  text: Localized;
}

export interface ListingLocation {
  city: Localized;
  country: Localized;
  address: Localized;
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  slug: string;
  title: Localized;
  description: Localized;
  type: PropertyType;
  categoryKeys: string[];
  location: ListingLocation;
  pricePerNight: number;
  currency: CurrencyCode;
  cleaningFee: number;
  /** Service fee as a fraction of the subtotal, e.g. 0.12. */
  serviceFeeRate: number;
  rating: number;
  reviewsCount: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenityKeys: string[];
  images: string[];
  hostId: string;
}

export interface Booking {
  id: string;
  listingId: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests: number;
  guestName: string;
  guestEmail: string;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
  currency: CurrencyCode;
  createdAt: string; // ISO datetime
}

/** Price breakdown returned by the pricing helper. */
export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
  currency: CurrencyCode;
}
