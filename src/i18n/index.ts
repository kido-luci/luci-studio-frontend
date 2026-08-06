import { en } from './en';

// Supported locales. English is the default at the un-prefixed root (`/`);
// Vietnamese lives under `/vi/` (blog only). NOTE: the UI is English in both
// locales — `vi` exists purely as a routing/content-overlay dimension.
export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

// getLocaleFromUrl derives the active locale from the first path segment.
// `/vi/...` → 'vi'; everything else → 'en'. Only the blog section is mirrored
// under `/vi` (see isBilingualPath), so every other route resolves to 'en'.
export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg === 'vi' ? 'vi' : 'en';
}

// useTranslations returns a `t(key)` lookup for UI-chrome strings. The app UI
// stays ENGLISH in every locale by design — only POST CONTENT is localized (via
// `localized()` reading the backend translations overlay). So `t()` always reads
// the English catalog and ignores the locale; the `locale` param is kept for call-
// site compatibility. There is consequently no `vi.ts` catalog — `en.ts` is the
// only one, and adding a second would not change any rendered UI on its own.
export function useTranslations(_locale: Locale) {
  return (key: string): string => en[key] ?? key;
}

// isBilingualPath reports whether a route is part of the bilingual surface. ONLY
// the blog section (`/blog`, `/blog/…`, including series) has a Vietnamese version;
// every other route (home, portfolio, lab, art, legal) is English-only. Accepts a
// path with or without the `/vi` prefix.
export function isBilingualPath(path: string): boolean {
  const p = path.replace(/^\/vi(?=\/|$)/, '') || '/';
  return p === '/blog' || p.startsWith('/blog/');
}

// localizedHref prefixes an internal path for the given locale. English (default)
// is un-prefixed; Vietnamese lives under `/vi` — but ONLY for bilingual (blog)
// routes. Non-blog paths (and anchors/mailto/external) are returned unchanged, so a
// VI blog page still links to the English home/lab/etc. instead of a /vi 404.
export function localizedHref(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  if (!path.startsWith('/')) return path; // '#contact', 'mailto:…', 'https://…'
  if (!isBilingualPath(path)) return path; // home/portfolio/lab/art/legal stay English
  return `/vi${path}`;
}

// switchLocalePath maps the current pathname to its counterpart in `target`,
// preserving the rest of the path so a language switch keeps the reader on the
// same page (e.g. /blog/x ↔ /vi/blog/x).
export function switchLocalePath(pathname: string, target: Locale): string {
  const stripped = pathname.replace(/^\/vi(?=\/|$)/, '') || '/';
  return target === 'vi' ? localizedHref('vi', stripped) : stripped;
}

// format interpolates `{name}` placeholders in a catalog template. Used for the
// strings that embed a count/value (e.g. "{n} articles …"); keeps EN output
// identical while letting VI phrase the sentence naturally.
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

// Per-language content overlay stored by the backend on each content entity:
// { vi: { title, content, … } }. Only the translated fields are present.
export type LocaleOverlay = Record<string, Record<string, unknown>>;

// localized returns the entity with its `translations[locale]` overlay applied
// over the base fields. English (default) and a missing/empty overlay return the
// entity unchanged — so untranslated content falls back to the base value. This
// is the read side of the additive translations model (the backend writes the
// overlay; see the bilingual i18n design).
export function localized<T extends { translations?: LocaleOverlay | null }>(entity: T, locale: Locale): T {
  if (locale === 'en' || !entity.translations) return entity;
  const overlay = entity.translations[locale];
  if (!overlay) return entity;
  // Drop overlay keys whose value is empty so a blank translation falls back.
  const applied: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(overlay)) {
    if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
      applied[k] = v;
    }
  }
  return { ...entity, ...applied };
}
