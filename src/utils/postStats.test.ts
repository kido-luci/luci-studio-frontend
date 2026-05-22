// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CACHE_KEY = 'postStatsCache.v1';

// postStats.ts freezes BASE_URL at module-load time. To exercise the
// network path we must stub the env and re-import the module fresh per test.
let refreshPostStats: typeof import('./postStats').refreshPostStats;

function buildTile(id: string, userInteracted = false) {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="tile-view-area" data-id="${id}">
            <span class="tile-view-count">0</span>
        </div>
        <div class="tile-like-area" data-id="${id}"${userInteracted ? ' data-user-interacted="1"' : ''}>
            <span class="tile-like-count">0</span>
        </div>
    `);
}

describe('refreshPostStats', () => {
    beforeEach(async () => {
        vi.stubEnv('PUBLIC_API_URL', 'http://test.local');
        localStorage.clear();
        document.body.innerHTML = '';
        vi.resetModules();
        ({ refreshPostStats } = await import('./postStats'));
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('applies cached stats immediately on tiles', () => {
        buildTile('1');
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            data: [{ id: '1', views: 42, likes: 7 }],
        }));
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        refreshPostStats();

        expect(document.querySelector('.tile-view-count')?.textContent).toBe('42');
        expect(document.querySelector('.tile-like-count')?.textContent).toBe('7');
        // Fresh cache → no network call.
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refetches from /posts/stats when cache is stale', async () => {
        buildTile('1');
        const staleTs = Date.now() - 10 * 60 * 1000; // TTL is 5 min
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: staleTs,
            data: [{ id: '1', views: 1, likes: 1 }],
        }));
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: '1', views: 100, likes: 50 }],
        });
        vi.stubGlobal('fetch', fetchMock);

        refreshPostStats();
        expect(document.querySelector('.tile-view-count')?.textContent).toBe('1');

        await vi.waitFor(() => {
            expect(document.querySelector('.tile-view-count')?.textContent).toBe('100');
        });
        expect(document.querySelector('.tile-like-count')?.textContent).toBe('50');
        expect(String(fetchMock.mock.calls[0][0])).toBe('http://test.local/posts/stats');

        const written = JSON.parse(localStorage.getItem(CACHE_KEY)!);
        expect(written.data).toEqual([{ id: '1', views: 100, likes: 50 }]);
        expect(written.ts).toBeGreaterThan(staleTs);
    });

    it('fetches on cold start (no cache) and applies result', async () => {
        buildTile('5');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: '5', views: 9, likes: 4 }],
        }));

        refreshPostStats();

        await vi.waitFor(() => {
            expect(document.querySelector('.tile-view-count')?.textContent).toBe('9');
        });
        expect(document.querySelector('.tile-like-count')?.textContent).toBe('4');
    });

    it('preserves optimistic like count on tiles the user just interacted with', () => {
        buildTile('1', /* userInteracted */ true);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            data: [{ id: '1', views: 42, likes: 7 }],
        }));
        vi.stubGlobal('fetch', vi.fn());

        const countEl = document.querySelector('.tile-like-count')!;
        countEl.textContent = '999';

        refreshPostStats();

        expect(document.querySelector('.tile-view-count')?.textContent).toBe('42');
        expect(countEl.textContent).toBe('999');
    });

    it('swallows network failures silently', async () => {
        buildTile('1');
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

        refreshPostStats();
        await new Promise(r => setTimeout(r, 0));

        // No throw; cache untouched on failure.
        expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    });

    it('rejects a malformed cache and refetches', async () => {
        buildTile('1');
        localStorage.setItem(CACHE_KEY, '{not json');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: '1', views: 3, likes: 2 }],
        }));

        refreshPostStats();
        await vi.waitFor(() => {
            expect(document.querySelector('.tile-view-count')?.textContent).toBe('3');
        });
    });

    it('no-ops when PUBLIC_API_URL is not configured', () => {
        vi.unstubAllEnvs();
        vi.stubEnv('PUBLIC_API_URL', '');
        vi.resetModules();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        return import('./postStats').then(({ refreshPostStats: fn }) => {
            fn();
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
