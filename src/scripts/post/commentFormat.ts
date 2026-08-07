// Pure formatting helpers for the comment thread — no DOM, no fetch, no module
// state, so they are unit-testable in isolation. Extracted from comments.ts,
// which holds everything that does touch the page.

// Claims of the commenter JWT the Google OAuth callback hands back, as read by
// parseJWT. `role` and `exp` gate validity; the rest populate the composer's
// avatar and the ownership check on each comment.
export interface JwtPayload {
  sub?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  exp: number;
}

// Decode a JWT's payload segment. Returns null for anything unparseable — a
// missing token, a malformed one, or a payload that is not JSON — so callers
// can treat "no valid session" as one case.
export function parseJWT(token: string | null): JwtPayload | null {
  try {
    const base64 = (token ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    // atob gives Latin-1 bytes; decode as UTF-8 to handle Vietnamese and other multi-byte chars
    const bytes = atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
    return JSON.parse(decodeURIComponent(bytes));
  } catch { return null; }
}

// Relative timestamp, falling back to an absolute date past 30 days. `t` is the
// caller's string lookup (comments.ts reads the page's i18n block); it takes a
// key and the English fallback, exactly like the catalog does. `locale` formats
// that absolute fallback — without it the relative times localise on /vi/blog
// while the dates past 30 days stay English.
export function timeAgo(
  iso: string,
  t: (key: string, fallback: string) => string,
  locale = 'en-US',
): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  function interp(tpl: string, n: number) { return tpl.replace('{n}', String(n)); }
  if (diff < 60) return t('timeJustNow', 'just now');
  if (diff < 3600) { const m = Math.floor(diff / 60); return interp(t(m !== 1 ? 'timeMinutes' : 'timeMinute', `${m} minute${m !== 1 ? 's' : ''} ago`), m); }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return interp(t(h !== 1 ? 'timeHours' : 'timeHour', `${h} hour${h !== 1 ? 's' : ''} ago`), h); }
  if (diff < 2592000) { const d = Math.floor(diff / 86400); return interp(t(d !== 1 ? 'timeDays' : 'timeDay', `${d} day${d !== 1 ? 's' : ''} ago`), d); }
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Escape before any comment text reaches innerHTML. Comment bodies are
// user-submitted, so this is the XSS boundary for the thread.
export function escapeHtml(str: string) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The comment mini-markdown: **bold**, *italic*, __underline__. Escaping runs
// FIRST, so markup in the source text is inert and only these three patterns
// produce tags.
export function renderCommentText(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/gs, '<em>$1</em>')
    .replace(/__(.+?)__/gs, '<u>$1</u>');
}
