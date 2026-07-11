// Build-time play-count fetch for the /games showcase. Every game tracks a run
// counter in its own leaderboard Worker (`stats.plays` in D1, bumped when a run
// starts), exposed via `GET https://<host>/api/leaderboard` → { plays }. We bake
// the numbers into the static build here rather than fetching them client-side:
// the blog is a different origin and the game Workers send no CORS headers, and a
// per-visit fetch would spend the shared Worker request budget. The displayed
// number therefore reflects the last blog deploy — fine for a vanity stat.
import { GAMES } from '../data/games';

const TIMEOUT_MS = 4000;

// slug -> play count. A game that's down/slow/malformed is simply absent from the
// map, so a single failing game never breaks the build (each fetch resolves to
// null instead of rejecting).
export type PlayCounts = Record<string, number>;

const fetchPlays = async (host: string): Promise<number | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`https://${host}/api/leaderboard`, { signal: ctrl.signal });
        if (!res.ok) return null;
        const data = (await res.json()) as { plays?: unknown };
        const plays = Number(data?.plays);
        return Number.isFinite(plays) && plays >= 0 ? Math.floor(plays) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

// Module-scoped cache so callers within a single build share one round-trip.
let playCountsPromise: Promise<PlayCounts> | null = null;

export const getPlayCounts = (): Promise<PlayCounts> => {
    if (playCountsPromise) return playCountsPromise;
    playCountsPromise = (async () => {
        const entries = await Promise.all(
            GAMES.map(async (g) => [g.slug, await fetchPlays(g.host)] as const),
        );
        const counts: PlayCounts = {};
        for (const [slug, plays] of entries) {
            if (plays !== null) counts[slug] = plays;
        }
        return counts;
    })();
    return playCountsPromise;
};
