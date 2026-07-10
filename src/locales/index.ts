import { useRouter } from "next/router";
import type { Localized } from "@/types";
import { ru, type Dictionary } from "./ru";
import { en } from "./en";

export type Locale = "ru" | "en";

export const locales: Locale[] = ["ru", "en"];
export const defaultLocale: Locale = "ru";

const dictionaries: Record<Locale, Dictionary> = { ru, en };

function toLocale(locale: string | undefined): Locale {
  return locale === "en" || locale === "ru" ? locale : defaultLocale;
}

/** Get the full dictionary for a locale (use in getStaticProps/getServerSideProps). */
export function getDictionary(locale: string | undefined): Dictionary {
  return dictionaries[toLocale(locale)];
}

/** Client hook: returns the active dictionary and normalized locale. */
export function useTranslation(): { t: Dictionary; locale: Locale } {
  const { locale } = useRouter();
  const current = toLocale(locale);
  return { t: dictionaries[current], locale: current };
}

/** Pick the right language from a localized content field. */
export function localize(value: Localized, locale: string | undefined): string {
  return value[toLocale(locale)];
}

export type { Dictionary };
export type { Localized };
