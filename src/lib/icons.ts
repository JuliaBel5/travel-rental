import {
  AirVent,
  Bath,
  Building2,
  Coffee,
  DoorOpen,
  Dumbbell,
  Flame,
  Laptop,
  MapPin,
  Mountain,
  PawPrint,
  Sailboat,
  Snowflake,
  Sparkles,
  SquareParking,
  Thermometer,
  Trees,
  Tv,
  Utensils,
  WashingMachine,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps a lucide-react icon name (as stored on `Category.icon`) to its
 * component. Unknown names fall back to a neutral map pin so the UI never
 * breaks on new data.
 */
const iconByName: Record<string, LucideIcon> = {
  Waves,
  Building2,
  Mountain,
  Trees,
  Sailboat,
  Snowflake,
  MapPin,
};

export function getCategoryIcon(name: string): LucideIcon {
  return iconByName[name] ?? MapPin;
}

/** Maps an amenity key (see `src/data/amenities.ts`) to a representative icon. */
const amenityIconByKey: Record<string, LucideIcon> = {
  wifi: Wifi,
  kitchen: Utensils,
  parking: SquareParking,
  pool: Waves,
  ac: AirVent,
  washer: WashingMachine,
  tv: Tv,
  heating: Thermometer,
  workspace: Laptop,
  breakfast: Coffee,
  hotTub: Bath,
  gym: Dumbbell,
  petFriendly: PawPrint,
  seaView: Sailboat,
  balcony: DoorOpen,
  fireplace: Flame,
};

export function getAmenityIcon(key: string): LucideIcon {
  return amenityIconByKey[key] ?? Sparkles;
}
