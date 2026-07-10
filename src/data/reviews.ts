import type { Review } from "@/types";
import { listings } from "./listings";

const reviewTexts: { ru: string; en: string }[] = [
  {
    ru: "Прекрасное место, всё как на фото. Хозяин очень отзывчивый, обязательно вернёмся!",
    en: "Wonderful place, exactly like the photos. The host was super responsive — we'll be back!",
  },
  {
    ru: "Чисто, уютно и отличное расположение. Рекомендуем всем друзьям.",
    en: "Clean, cozy and a great location. We recommend it to all our friends.",
  },
  {
    ru: "Виды просто невероятные. Немного шумно вечером, но в целом отдых удался.",
    en: "The views are simply incredible. A little noisy in the evening, but overall a great stay.",
  },
  {
    ru: "Идеально для семьи с детьми. Кухня полностью оборудована, всё продумано.",
    en: "Perfect for a family with kids. The kitchen is fully equipped and everything is well thought out.",
  },
  {
    ru: "Заселение прошло гладко, хозяин встретил лично и всё показал. Спасибо!",
    en: "Check-in was smooth, the host met us in person and showed us around. Thank you!",
  },
  {
    ru: "Уютно и тихо, отличное соотношение цены и качества. Проспали как никогда.",
    en: "Cozy and quiet, great value for money. We slept better than ever.",
  },
  {
    ru: "Локация топ — до всего пешком. Вернёмся снова в следующем сезоне.",
    en: "Top location — everything within walking distance. We'll return next season.",
  },
  {
    ru: "Фотографии не передают, насколько тут красиво вживую. Однозначно советуем.",
    en: "The photos don't capture how beautiful it is in person. Highly recommend.",
  },
  {
    ru: "Хозяин дал массу советов по окрестностям. Чувствовали себя как дома.",
    en: "The host gave us tons of tips about the area. We felt right at home.",
  },
  {
    ru: "Немного далеко от центра, зато очень спокойно и приватно. Нам понравилось.",
    en: "A bit far from the center, but very calm and private. We loved it.",
  },
];

const reviewers: { name: string; avatar: string }[] = [
  { name: "James", avatar: "https://i.pravatar.cc/120?img=13" },
  { name: "Marie", avatar: "https://i.pravatar.cc/120?img=24" },
  { name: "Ahmed", avatar: "https://i.pravatar.cc/120?img=33" },
  { name: "Priya", avatar: "https://i.pravatar.cc/120?img=44" },
  { name: "Lucas", avatar: "https://i.pravatar.cc/120?img=51" },
  { name: "Nina", avatar: "https://i.pravatar.cc/120?img=16" },
  { name: "Tom", avatar: "https://i.pravatar.cc/120?img=60" },
  { name: "Olga", avatar: "https://i.pravatar.cc/120?img=29" },
  { name: "Hana", avatar: "https://i.pravatar.cc/120?img=47" },
  { name: "Diego", avatar: "https://i.pravatar.cc/120?img=57" },
];

const dates = [
  "2025-11-12",
  "2025-10-03",
  "2025-09-21",
  "2025-08-15",
  "2025-07-08",
  "2025-06-19",
  "2025-05-27",
  "2025-04-11",
];

const perListingRatings = [5, 4, 5];

export const reviews: Review[] = listings.flatMap((listing, li) =>
  Array.from({ length: 3 }, (_, ri) => {
    const idx = li * 3 + ri;
    return {
      id: `${listing.id}-r${ri + 1}`,
      listingId: listing.id,
      author: reviewers[idx % reviewers.length].name,
      avatar: reviewers[idx % reviewers.length].avatar,
      rating: perListingRatings[ri] ?? 5,
      date: dates[idx % dates.length],
      text: reviewTexts[idx % reviewTexts.length],
    };
  }),
);

export function reviewsForListing(listingId: string): Review[] {
  return reviews.filter((r) => r.listingId === listingId);
}
