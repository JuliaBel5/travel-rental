import type { Dictionary } from "./ru";

export const en: Dictionary = {
  common: {
    appName: "Wanderstay",
    tagline: "Stays for your travels",
    search: "Search",
    loading: "Loading…",
  },
  nav: {
    home: "Home",
    listings: "Stays",
    bookings: "My bookings",
    language: "Language",
    menu: "Menu",
  },
  home: {
    metaDescription:
      "Find the perfect place for your next trip — seaside villas, downtown lofts, mountain cabins and cozy countryside escapes.",
    hero: {
      eyebrow: "Over 1,000 hand-picked stays",
      title: "Your next journey starts here",
      subtitle:
        "Book one-of-a-kind homes around the world, from beachfront villas to alpine chalets.",
    },
    categories: {
      title: "Where to next?",
      subtitle: "Pick the mood of your trip",
    },
    featured: {
      title: "Featured stays",
      subtitle: "The highest-rated homes for your getaway",
      viewAll: "View all",
    },
  },
  search: {
    locationPlaceholder: "Where are you going?",
    addDates: "Dates",
    guests: {
      label: "Guests",
      hint: "How many are traveling",
      one: "guest",
      few: "guests",
      many: "guests",
    },
  },
  listing: {
    perNight: "night",
    reviews: {
      one: "review",
      few: "reviews",
      many: "reviews",
    },
  },
  catalog: {
    title: "Stays",
    filters: "Filters",
    sortLabel: "Sort",
    sort: {
      recommended: "Recommended",
      priceAsc: "Price: low to high",
      priceDesc: "Price: high to low",
      ratingDesc: "Top rated",
    },
    price: "Price per night",
    min: "Min",
    max: "Max",
    propertyType: "Property type",
    amenities: "Amenities",
    guests: "Guests",
    any: "Any",
    apply: "Apply",
    reset: "Reset",
    clearAll: "Clear all",
    stays: {
      one: "stay",
      few: "stays",
      many: "stays",
    },
    empty: {
      title: "No stays found",
      subtitle: "Try adjusting or clearing your filters.",
    },
    propertyTypes: {
      apartment: "Apartment",
      house: "House",
      villa: "Villa",
      room: "Room",
      cabin: "Cabin",
    },
  },
  footer: {
    rights: "All rights reserved",
    madeWith: "Made for travelers",
  },
  locale: {
    ru: "Русский",
    en: "English",
  },
};
