# Feature: Catalog (home, listings, search)

## Purpose

Help a visitor discover stays: a home page with featured listings and category chips, a searchable and filterable catalog, and a listing detail page with gallery, amenities, host, reviews, and a map.

## Routes and files it owns

| Path                    | File                              | Notes                            |
| ----------------------- | --------------------------------- | -------------------------------- |
| `/`                     | `src/pages/index.tsx`             | Home: hero, categories, featured |
| `/listings`             | `src/pages/listings/index.tsx`    | Catalog with filters + sort      |
| `/listings/:id`         | `src/pages/listings/[id].tsx`     | Detail (accepts id or slug)      |
| `GET /api/listings`     | `src/pages/api/listings/index.ts` | Filtered listing feed            |
| `GET /api/listings/:id` | `src/pages/api/listings/[id].ts`  | Single listing                   |

Components: `src/components/home/` (`Hero`, `CategoryChips`); `src/components/listings/` (`ListingCard`, `ListingCardSkeleton`, `ListingGrid`, `Gallery`, `HostCard`, `ReviewList`, `AmenityList`, `ListingMap`); `src/components/search/` (`SearchBar`, `Filters`, `SortSelect`, `GuestSelector`, `DateRangePicker`). Data: `src/lib/data.ts`.

## Business rules

- **All catalog data comes from `data.ts` accessors**, not raw Prisma in the page. Reads: `getAllListings(filters)`, `getFeaturedListings(limit)`, `getListingById`, `getListingBySlug`, `getReviews`, `getHost`, `getCategories`, `getAmenities`. See `docs/skills/data-access.md`.
- **Filtering and sorting run in memory** after a single `findMany`, because the dataset is small. The filter contract is the `ListingFilters` interface in `src/lib/data.ts`:

```ts
export interface ListingFilters {
  location?: string; // free-text match against city/country in either language
  category?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  types?: string[]; // property types to include (empty/undefined = all)
  amenities?: string[]; // amenity keys that must ALL be present
  sort?: SortOption;
}
```

- **Filter semantics differ per field** (verify before changing):
  - `location` matches a lowercased haystack of RU and EN city and country (`matchesLocation`), so either language works.
  - `types` is an OR (include any of the selected types).
  - `amenities` is an AND (`every` selected key must be present).
  - `guests` filters on `maxGuests >= guests`.
- **Sort options**: `recommended`, `price_asc`, `price_desc`, `rating_desc`. Both `recommended` and `rating_desc` sort by rating descending (`sortListings`).
- **Localized content** (titles, descriptions, review text) is `{ ru, en }` JSON; render it through `localize(...)`. See `docs/skills/i18n.md`.

## Edge cases

## EC-001: Listing lookups accept id or slug

- **Symptom**: A URL or API call using a slug (or an id) must resolve the same listing.
- **Root cause**: Listings have both a `cuid`-style `id` and a human `slug` (`@unique`), and different entry points use different ones.
- **Fix**: Resolve with id first, then slug: `(await getListingById(x)) ?? (await getListingBySlug(x))`. This pattern is shared by the detail page, the availability route, and the booking create route.
- **Regression test**: Open `/listings/{slug}` and `/listings/{id}`; both render the same listing.
- **Related skill**: `docs/skills/data-access.md`.
- **Stay-aware**: When you add an endpoint that takes a listing identifier, support both id and slug the same way.

## EC-002: `amenities` is AND, `types` is OR

- **Symptom**: Filter results look wrong when mixing amenity and type filters.
- **Root cause**: The two filters intentionally use different set logic.
- **Fix**: Keep `amenities` as `every(...)` (all selected must be present) and `types` as `includes(...)` (any selected type). See `getAllListings`.
- **Regression test**: Select two amenities and confirm results have both; select two types and confirm results have either.
- **Stay-aware**: Do not "simplify" these to the same operator; the difference is the intended behavior.

## EC-003: Remote listing images must be whitelisted

- **Symptom**: A listing/host image from a new host renders a 500 or blank.
- **Root cause**: `next/image` only loads hosts in `next.config.ts` `remotePatterns` (`images.unsplash.com`, `picsum.photos`, `i.pravatar.cc`).
- **Fix**: Add the host to `remotePatterns` before using its images.
- **Related skill**: `docs/skills/ui-components.md`.
- **Stay-aware**: Seed data uses those three hosts; new image sources need a config change.
