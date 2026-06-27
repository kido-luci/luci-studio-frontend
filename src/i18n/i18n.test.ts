import { describe, it, expect } from 'vitest';
import {
  localized,
  getLocaleFromUrl,
  localizedHref,
  switchLocalePath,
} from './index';
import type { LocaleOverlay } from './index';

interface TestEntity {
  id: string;
  title: string;
  content: string;
  subtitle?: string;
  tags?: string[];
  translations?: LocaleOverlay | null;
}

describe('localized()', () => {
  const base: TestEntity = {
    id: '1',
    title: 'Hello World',
    content: 'Base content',
    subtitle: 'Base subtitle',
    tags: ['a', 'b'],
  };

  it('en locale returns entity unchanged even with a vi overlay present', () => {
    const entity: TestEntity = {
      ...base,
      translations: { vi: { title: 'Xin chào thế giới', content: 'Nội dung VI' } },
    };
    const result = localized(entity, 'en');
    expect(result.title).toBe('Hello World');
    expect(result.content).toBe('Base content');
  });

  it('vi locale + overlay present → overlay fields applied over base, untouched fields preserved', () => {
    const entity: TestEntity = {
      ...base,
      translations: { vi: { title: 'Xin chào thế giới' } },
    };
    const result = localized(entity, 'vi');
    expect(result.title).toBe('Xin chào thế giới');
    // content not in overlay → preserved from base
    expect(result.content).toBe('Base content');
    expect(result.id).toBe('1');
  });

  it('vi locale + missing overlay → unchanged (English fallback)', () => {
    const entity: TestEntity = { ...base };
    const result = localized(entity, 'vi');
    expect(result.title).toBe('Hello World');
    expect(result.content).toBe('Base content');
  });

  it('vi locale + null translations → unchanged', () => {
    const entity: TestEntity = { ...base, translations: null };
    const result = localized(entity, 'vi');
    expect(result.title).toBe('Hello World');
  });

  it('vi locale + overlay with empty-string field → falls back to base (not blanked)', () => {
    const entity: TestEntity = {
      ...base,
      translations: { vi: { title: '', content: 'Nội dung VI' } },
    };
    const result = localized(entity, 'vi');
    // empty string skipped → base title preserved
    expect(result.title).toBe('Hello World');
    expect(result.content).toBe('Nội dung VI');
  });

  it('vi locale + overlay with empty-array field → falls back to base', () => {
    const entity: TestEntity = {
      ...base,
      translations: { vi: { tags: [] } },
    };
    const result = localized(entity, 'vi');
    expect(result.tags).toEqual(['a', 'b']);
  });

  it('returns a new object (does not mutate the original)', () => {
    const entity: TestEntity = {
      ...base,
      translations: { vi: { title: 'VI Title' } },
    };
    const result = localized(entity, 'vi');
    expect(result).not.toBe(entity);
    expect(entity.title).toBe('Hello World');
  });
});

describe('getLocaleFromUrl()', () => {
  it('/vi/blog → vi', () => {
    expect(getLocaleFromUrl(new URL('https://luci-studio.com/vi/blog'))).toBe('vi');
  });

  it('/blog → en', () => {
    expect(getLocaleFromUrl(new URL('https://luci-studio.com/blog'))).toBe('en');
  });

  it('/ → en', () => {
    expect(getLocaleFromUrl(new URL('https://luci-studio.com/'))).toBe('en');
  });

  it('/vi/ → vi', () => {
    expect(getLocaleFromUrl(new URL('https://luci-studio.com/vi/'))).toBe('vi');
  });
});

describe('localizedHref()', () => {
  it('en locale returns path unchanged', () => {
    expect(localizedHref('en', '/blog')).toBe('/blog');
    expect(localizedHref('en', '/')).toBe('/');
  });

  it('vi locale prefixes bilingual (blog) paths; non-blog paths stay English', () => {
    expect(localizedHref('vi', '/blog')).toBe('/vi/blog');
    expect(localizedHref('vi', '/')).toBe('/'); // home is English-only — no /vi/ home route
  });

  it('non-root paths not starting with / are returned as-is (external/anchor)', () => {
    expect(localizedHref('vi', 'https://example.com')).toBe('https://example.com');
    expect(localizedHref('vi', '#contact')).toBe('#contact');
  });
});

describe('switchLocalePath()', () => {
  it('/vi/blog → en gives /blog', () => {
    expect(switchLocalePath('/vi/blog', 'en')).toBe('/blog');
  });

  it('/blog → vi gives /vi/blog', () => {
    expect(switchLocalePath('/blog', 'vi')).toBe('/vi/blog');
  });

  it('/vi/ → en gives /', () => {
    expect(switchLocalePath('/vi/', 'en')).toBe('/');
  });

  it('/ → vi stays / (home is English-only)', () => {
    expect(switchLocalePath('/', 'vi')).toBe('/');
  });
});
