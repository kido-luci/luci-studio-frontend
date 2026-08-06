import { afterEach, describe, expect, it, vi } from 'vitest';
import { escapeHtml, parseJWT, renderCommentText, timeAgo } from './commentFormat';

// Identity translator: returns the English fallback, which is what the page does
// when the i18n block is absent.
const en = (_key: string, fallback: string) => fallback;

// Build a JWT with the given payload. Only the payload segment is ever read.
function jwt(payload: Record<string, unknown>): string {
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `header.${b64}.signature`;
}

describe('escapeHtml', () => {
    it('escapes the five HTML-significant characters', () => {
        expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    });

    it('escapes & first so existing entities are not double-decoded', () => {
        expect(escapeHtml('&lt;')).toBe('&amp;lt;');
    });

    it('leaves plain text alone', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('treats null and undefined as empty', () => {
        expect(escapeHtml(null as unknown as string)).toBe('');
        expect(escapeHtml(undefined as unknown as string)).toBe('');
    });
});

describe('renderCommentText', () => {
    it('renders the three supported markers', () => {
        expect(renderCommentText('**b** *i* __u__')).toBe('<strong>b</strong> <em>i</em> <u>u</u>');
    });

    it('spans newlines inside a marker', () => {
        expect(renderCommentText('**two\nlines**')).toBe('<strong>two\nlines</strong>');
    });

    it('is non-greedy, so two bold runs stay separate', () => {
        expect(renderCommentText('**a** and **b**')).toBe('<strong>a</strong> and <strong>b</strong>');
    });

    // The XSS boundary: comment bodies are user-submitted and go through innerHTML.
    it('escapes before formatting, so injected markup is inert', () => {
        expect(renderCommentText('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('cannot be tricked into a real tag by markers around HTML', () => {
        expect(renderCommentText('**<img src=x onerror=y>**'))
            .toBe('<strong>&lt;img src=x onerror=y&gt;</strong>');
    });

    it('leaves an unmatched marker as literal text', () => {
        expect(renderCommentText('2 ** 3')).toBe('2 ** 3');
    });
});

describe('parseJWT', () => {
    it('decodes the payload segment', () => {
        expect(parseJWT(jwt({ sub: '9', role: 'user', exp: 123 })))
            .toEqual({ sub: '9', role: 'user', exp: 123 });
    });

    it('decodes multi-byte names (Vietnamese) rather than mangling them', () => {
        expect(parseJWT(jwt({ name: 'Nguyễn Văn A', exp: 1 }))?.name).toBe('Nguyễn Văn A');
    });

    it('returns null for null, empty, malformed and non-JSON tokens', () => {
        expect(parseJWT(null)).toBeNull();
        expect(parseJWT('')).toBeNull();
        expect(parseJWT('not-a-jwt')).toBeNull();
        expect(parseJWT('header.!!!not-base64!!!.sig')).toBeNull();
    });
});

describe('timeAgo', () => {
    const now = new Date('2026-08-06T12:00:00Z');
    const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

    afterEach(() => vi.useRealTimers());

    function at(iso: string) {
        vi.useFakeTimers();
        vi.setSystemTime(now);
        return timeAgo(iso, en);
    }

    it('reads "just now" under a minute', () => {
        expect(at(ago(0))).toBe('just now');
        expect(at(ago(59))).toBe('just now');
    });

    it('switches to minutes, singular at exactly one', () => {
        expect(at(ago(60))).toBe('1 minute ago');
        expect(at(ago(59 * 60))).toBe('59 minutes ago');
    });

    it('switches to hours, singular at exactly one', () => {
        expect(at(ago(3600))).toBe('1 hour ago');
        expect(at(ago(23 * 3600))).toBe('23 hours ago');
    });

    it('switches to days, singular at exactly one', () => {
        expect(at(ago(86400))).toBe('1 day ago');
        expect(at(ago(29 * 86400))).toBe('29 days ago');
    });

    it('falls back to an absolute date past 30 days', () => {
        expect(at(ago(31 * 86400))).toBe('Jul 6, 2026');
    });

    it('interpolates {n} when the catalog uses a placeholder', () => {
        vi.useFakeTimers();
        vi.setSystemTime(now);
        const vi_ = (_key: string, _fallback: string) => '{n} phút trước';
        expect(timeAgo(ago(300), vi_)).toBe('5 phút trước');
    });
});
