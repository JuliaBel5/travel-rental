import { useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { SearchX, SlidersHorizontal } from "lucide-react";

import type { Amenity, Category, Listing, PropertyType } from "@/types";
import {
  getAllListings,
  getAmenities,
  getCategories,
  type ListingFilters,
  type SortOption,
} from "@/lib/data";
import { localize, useTranslation, type Locale } from "@/locales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Seo } from "@/components/Seo";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Filters } from "@/components/search/Filters";
import { SortSelect } from "@/components/search/SortSelect";

const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "villa", "room", "cabin"];
const SORT_OPTIONS: SortOption[] = ["recommended", "price_asc", "price_desc", "rating_desc"];

interface CatalogProps {
  listings: Listing[];
  filters: ListingFilters;
  categories: Category[];
  amenities: Amenity[];
  propertyTypes: PropertyType[];
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function listParam(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : value.split(",");
  const items = raw.map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function numberParam(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value);
  if (raw === undefined || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sortParam(value: string | string[] | undefined): SortOption {
  const raw = firstParam(value);
  return SORT_OPTIONS.find((option) => option === raw) ?? "recommended";
}

/** Locale-aware plural form (no extra deps). */
function pluralForm(
  count: number,
  locale: Locale,
  forms: { one: string; few: string; many: string },
): string {
  const category = new Intl.PluralRules(locale === "ru" ? "ru-RU" : "en-US").select(count);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few;
  return forms.many;
}

/** Remount key so the Filters controls resync whenever the URL filters change. */
function filtersKey(filters: ListingFilters): string {
  return JSON.stringify([
    filters.minPrice ?? null,
    filters.maxPrice ?? null,
    filters.guests ?? null,
    filters.types ?? null,
    filters.amenities ?? null,
  ]);
}

function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
  if (filters.guests !== undefined && filters.guests > 0) count += 1;
  if (filters.types && filters.types.length > 0) count += 1;
  if (filters.amenities && filters.amenities.length > 0) count += 1;
  return count;
}

export const getServerSideProps: GetServerSideProps<CatalogProps> = async ({ query, locale }) => {
  // Listing data is locale-independent; components localize via the active
  // locale on the client. `locale` (context.locale) is read to honor the SSR
  // contract for per-locale rendering.
  void locale;

  const filters: ListingFilters = { sort: sortParam(query.sort) };
  const location = firstParam(query.location);
  const category = firstParam(query.category);
  const guests = numberParam(query.guests);
  const minPrice = numberParam(query.minPrice);
  const maxPrice = numberParam(query.maxPrice);
  const types = listParam(query.types);
  const amenityKeys = listParam(query.amenities);

  if (location) filters.location = location;
  if (category) filters.category = category;
  if (guests !== undefined) filters.guests = guests;
  if (minPrice !== undefined) filters.minPrice = minPrice;
  if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  if (types) filters.types = types;
  if (amenityKeys) filters.amenities = amenityKeys;

  return {
    props: {
      listings: getAllListings(filters),
      filters,
      categories: getCategories(),
      amenities: getAmenities(),
      propertyTypes: PROPERTY_TYPES,
    },
  };
};

export default function CatalogPage({
  listings,
  filters,
  categories,
  amenities,
  propertyTypes,
}: CatalogProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeCategory = filters.category
    ? categories.find((category) => category.key === filters.category)
    : undefined;
  const heading = activeCategory ? localize(activeCategory.label, locale) : t.catalog.title;
  const count = listings.length;
  const countWord = pluralForm(count, locale, t.catalog.stays);
  const activeFilterCount = countActiveFilters(filters);
  const remountKey = filtersKey(filters);

  function clearAll() {
    router.push({ pathname: "/listings", query: {} });
  }

  return (
    <>
      <Seo
        title={`${heading} — ${t.common.appName}`}
        description={t.common.tagline}
        image={listings[0]?.images[0]}
      />

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="tabular-nums">{count}</span> {countWord}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
                <SlidersHorizontal className="size-4" />
                {t.catalog.filters}
                {activeFilterCount > 0 && (
                  <Badge className="ml-0.5 tabular-nums">{activeFilterCount}</Badge>
                )}
              </SheetTrigger>
              <SheetContent side="left" className="w-80 gap-0 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t.catalog.filters}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <Filters
                    key={remountKey}
                    filters={filters}
                    propertyTypes={propertyTypes}
                    amenities={amenities}
                    onApplied={() => setMobileFiltersOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <SortSelect value={filters.sort ?? "recommended"} />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <Filters
                key={remountKey}
                filters={filters}
                propertyTypes={propertyTypes}
                amenities={amenities}
              />
            </div>
          </aside>

          <div>
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    {t.catalog.empty.title}
                  </h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {t.catalog.empty.subtitle}
                  </p>
                </div>
                <Button variant="outline" onClick={clearAll}>
                  {t.catalog.clearAll}
                </Button>
              </div>
            ) : (
              <ListingGrid listings={listings} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
