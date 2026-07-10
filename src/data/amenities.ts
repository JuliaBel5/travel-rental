import type { Amenity } from "@/types";

export const amenities: Amenity[] = [
  { key: "wifi", label: { ru: "Wi-Fi", en: "Wi-Fi" } },
  { key: "kitchen", label: { ru: "Кухня", en: "Kitchen" } },
  { key: "parking", label: { ru: "Бесплатная парковка", en: "Free parking" } },
  { key: "pool", label: { ru: "Бассейн", en: "Pool" } },
  { key: "ac", label: { ru: "Кондиционер", en: "Air conditioning" } },
  { key: "washer", label: { ru: "Стиральная машина", en: "Washer" } },
  { key: "tv", label: { ru: "Телевизор", en: "TV" } },
  { key: "heating", label: { ru: "Отопление", en: "Heating" } },
  { key: "workspace", label: { ru: "Рабочее место", en: "Workspace" } },
  { key: "breakfast", label: { ru: "Завтрак", en: "Breakfast" } },
  { key: "hotTub", label: { ru: "Джакузи", en: "Hot tub" } },
  { key: "gym", label: { ru: "Спортзал", en: "Gym" } },
  { key: "petFriendly", label: { ru: "Можно с питомцами", en: "Pet friendly" } },
  { key: "seaView", label: { ru: "Вид на море", en: "Sea view" } },
  { key: "balcony", label: { ru: "Балкон", en: "Balcony" } },
  { key: "fireplace", label: { ru: "Камин", en: "Fireplace" } },
];

export const amenityByKey = new Map(amenities.map((a) => [a.key, a]));
