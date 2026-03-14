import Link from "next/link";

import type { Category } from "@/types";
import { localize, useTranslation } from "@/locales";
import { getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function CategoryChips({
  categories,
  className,
}: {
  categories: Category[];
  className?: string;
}) {
  const { locale } = useTranslation();

  return (
    <div
      className={cn(
        "flex [scrollbar-width:none] gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        return (
          <Link
            key={category.key}
            href={{ pathname: "/listings", query: { category: category.key } }}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="whitespace-nowrap">{localize(category.label, locale)}</span>
          </Link>
        );
      })}
    </div>
  );
}
