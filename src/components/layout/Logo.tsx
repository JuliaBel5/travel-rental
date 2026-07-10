import Link from "next/link";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/locales";

/**
 * Brand logo: a location-pin-with-house mark (matching the favicon) plus the
 * wordmark. The mark uses `currentColor` for the pin and `var(--background)`
 * for the knocked-out house, so it inverts cleanly between light and dark.
 */
export function Logo({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href="/"
      aria-label={t.common.appName}
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-7 shrink-0 text-primary transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M16 2C9.9 2 5 6.9 5 13c0 7.6 9.3 15.6 10.3 16.4a1.1 1.1 0 0 0 1.4 0C17.7 28.6 27 20.6 27 13 27 6.9 22.1 2 16 2Z"
        />
        <polygon fill="var(--background)" points="16,6.8 23,12.6 9,12.6" />
        <rect fill="var(--background)" x="11.3" y="12.2" width="9.4" height="7" rx="0.6" />
        <rect fill="currentColor" x="14.4" y="15.2" width="3.2" height="4" rx="0.4" />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        {t.common.appName}
      </span>
    </Link>
  );
}
