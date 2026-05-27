const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const CACHE_KEY = 'postStatsCache.v1';

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

export function invalidatePostStatsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
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

  // Recompute playlist aggregates from the fresh stats. Each .playlist-row
  // carries a data-playlist-post-ids JSON array; sum across it. Posts missing
  // from the stats map (deleted since build) contribute 0.
  const byID = new Map(stats.map(s => [String(s.id), s]));
  document.querySelectorAll<HTMLElement>('.playlist-row[data-playlist-post-ids]').forEach(row => {
    let ids: string[];
    try { ids = JSON.parse(row.dataset.playlistPostIds || '[]'); } catch { return; }
    let v = 0, l = 0;
    for (const id of ids) {
      const s = byID.get(String(id));
      if (s) { v += s.views; l += s.likes; }
    }
    const vEl = row.querySelector<HTMLElement>('.playlist-views-count');
    const lEl = row.querySelector<HTMLElement>('.playlist-likes-count');
    if (vEl) vEl.textContent = String(v);
    if (lEl) lEl.textContent = String(l);
  });
}

function statsUrl() {
  return `${BASE_URL}/posts/stats?t=${Date.now()}`;
}

// Apply cached stats immediately for a quick paint, but always refresh from
// `/posts/stats` because engagement counters are expected to be live.
export function refreshPostStats() {
  if (!BASE_URL) return;

  const cached = readCache();
  if (cached) applyStats(cached.data);

  fetch(statsUrl(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`stats ${r.status}`)))
    .then((data: unknown) => {
      if (!Array.isArray(data)) return;
      const stats = data as PostStat[];
      applyStats(stats);
      writeCache(stats);
    })
    .catch(() => {});
}
