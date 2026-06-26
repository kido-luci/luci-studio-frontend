import { en } from './en';
import { vi } from './vi';

// Supported locales. English is the default and lives at the un-prefixed root (`/`);
// Vietnamese lives under `/vi/` (routing added in Phase 3).
export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const catalogs: Record<Locale, Record<string, string>> = { en, vi };

// getLocaleFromUrl derives the active locale from the first path segment.
// `/vi/...` → 'vi'; everything else → 'en'. Today every page is at `/`, so this
// always returns 'en' (identical output); Phase 3's `/vi/` routes flip it.
export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg === 'vi' ? 'vi' : 'en';
}

// useTranslations returns a `t(key)` lookup for the given locale, falling back to
// the English value, then to the key itself — so a missing string is visible, never blank.
export function useTranslations(locale: Locale) {
  const dict = catalogs[locale] ?? catalogs.en;
  return (key: string): string => dict[key] ?? catalogs.en[key] ?? key;
}
