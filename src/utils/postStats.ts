const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const CACHE_KEY = 'postStatsCache.v1';
const TTL_MS = 5 * 60 * 1000;

interface PostStat { id: string; views: number; likes: number }
interface CachedStats { ts: number; data: PostStat[] }

function readCache(): CachedStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStats;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== 'number') return null;
    return parsed;
  } catch { return null; }
}

function writeCache(data: PostStat[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function applyStats(stats: PostStat[]) {
  for (const s of stats) {
    const id = String(s.id);
    document.querySelectorAll<HTMLElement>(`.tile-view-area[data-id="${id}"] .tile-view-count`).forEach(el => {
      el.textContent = String(s.views);
    });
    // Skip like count on tiles the user just toggled this session — their
    // optimistic value is fresher than the cached/server snapshot.
    document.querySelectorAll<HTMLElement>(`.tile-like-area[data-id="${id}"]`).forEach(area => {
      if (area.dataset.userInteracted === '1') return;
      const countEl = area.querySelector<HTMLElement>('.tile-like-count');
      if (countEl) countEl.textContent = String(s.likes);
    });
  }
}

// Apply cached stats immediately (cheap, no network) and, if stale,
// refresh from `/posts/stats` once in the background.
export function refreshPostStats() {
  if (!BASE_URL) return;

  const cached = readCache();
  if (cached) applyStats(cached.data);

  const fresh = cached && Date.now() - cached.ts < TTL_MS;
  if (fresh) return;

  fetch(`${BASE_URL}/posts/stats`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`stats ${r.status}`)))
    .then((data: unknown) => {
      if (!Array.isArray(data)) return;
      const stats = data as PostStat[];
      applyStats(stats);
      writeCache(stats);
    })
    .catch(() => {});
}
