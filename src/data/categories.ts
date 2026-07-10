import type { Category } from "@/types";

/** `icon` is a lucide-react icon name resolved in the UI layer. */
export const categories: Category[] = [
  { key: "beach", label: { ru: "Пляж", en: "Beach" }, icon: "Waves" },
  { key: "city", label: { ru: "Город", en: "City" }, icon: "Building2" },
  { key: "mountain", label: { ru: "Горы", en: "Mountains" }, icon: "Mountain" },
  { key: "countryside", label: { ru: "Загород", en: "Countryside" }, icon: "Trees" },
  { key: "lake", label: { ru: "Озеро", en: "Lakefront" }, icon: "Sailboat" },
  { key: "ski", label: { ru: "Горнолыжные", en: "Skiing" }, icon: "Snowflake" },
];

export const categoryByKey = new Map(categories.map((c) => [c.key, c]));
