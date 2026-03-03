import {
  Building2,
  MapPin,
  Mountain,
  Sailboat,
  Snowflake,
  Trees,
  Waves,
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
