import { useRouter } from "next/router";
import { ArrowDownUp } from "lucide-react";

import type { SortOption } from "@/lib/data";
import { useTranslation } from "@/locales";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS: SortOption[] = ["recommended", "price_asc", "price_desc", "rating_desc"];

export function SortSelect({ value }: { value: SortOption }) {
  const router = useRouter();
  const { t } = useTranslation();

  const labels: Record<SortOption, string> = {
    recommended: t.catalog.sort.recommended,
    price_asc: t.catalog.sort.priceAsc,
    price_desc: t.catalog.sort.priceDesc,
    rating_desc: t.catalog.sort.ratingDesc,
  };

  function handleChange(next: string | null) {
    if (!next) return;
    // Preserve every other query param and only replace `sort`.
    const query: Record<string, string> = {};
    for (const [key, val] of Object.entries(router.query)) {
      if (key === "sort") continue;
      const first = Array.isArray(val) ? val[0] : val;
      if (typeof first === "string" && first) query[key] = first;
    }
    if (next !== "recommended") query.sort = next;
    router.push({ pathname: "/listings", query });
  }

  return (
    <Select value={value} onValueChange={handleChange} items={labels}>
      <SelectTrigger size="sm" className="min-w-44" aria-label={t.catalog.sortLabel}>
        <ArrowDownUp className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
