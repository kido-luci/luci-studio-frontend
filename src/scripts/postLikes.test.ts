// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPostLikes } from './postLikes';

// The tile like button on /blog and the home rail. The liked flag lives only in
// localStorage (`liked_<id>`, shared with the post page), so the button has to
// keep it, the count and the icon in step, and leave all three alone when the
// request fails. Every request goes to a stubbed fetch.
const API = 'http://api.test';

function mountTile(id = 'p1', likes = 3) {
    document.body.innerHTML = `
        <main data-api-url="${API}">
            <a href="/blog/x/">
                <span class="tile-like-area" data-id="${id}">
                    <svg class="tile-like-icon" fill="none" stroke="currentColor"></svg>
                    <span class="tile-like-count text-gray-500">${likes}</span>
                </span>
            </a>
        </main>`;
    const area = document.querySelector<HTMLElement>('.tile-like-area')!;
    return {
        area,
        icon: area.querySelector('.tile-like-icon')!,
        count: area.querySelector<HTMLElement>('.tile-like-count')!,
    };
}

function ok(body: unknown) {
    return { ok: true, status: 200, json: async () => body };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('initPostLikes', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('likes, then unlikes, keeping count, icon and liked_<id> in step', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(ok({ likes: 4 }))
            .mockResolvedValueOnce(ok({ likes: 3 }));
        vi.stubGlobal('fetch', fetchMock);
        localStorage.setItem('postStatsCache.v1', '{"ts":1,"data":[]}');
        const { area, icon, count } = mountTile();
        initPostLikes();

        area.click();
        await flush();
        expect(fetchMock).toHaveBeenLastCalledWith(`${API}/posts/p1/like`, expect.objectContaining({ method: 'POST' }));
        expect(count.textContent).toBe('4');
        expect(icon.getAttribute('fill')).toBe('#f43f5e');
        expect(localStorage.getItem('liked_p1')).toBe('1');
        expect(localStorage.getItem('postStatsCache.v1')).toBeNull();

        area.click();
        await flush();
        expect(fetchMock).toHaveBeenLastCalledWith(`${API}/posts/p1/unlike`, expect.objectContaining({ method: 'POST' }));
        expect(count.textContent).toBe('3');
        expect(icon.getAttribute('fill')).toBe('none');
        expect(localStorage.getItem('liked_p1')).toBe('0');
    });

    it('starts liked when liked_<id> is already set', async () => {
        const fetchMock = vi.fn().mockResolvedValue(ok({ likes: 2 }));
        vi.stubGlobal('fetch', fetchMock);
        localStorage.setItem('liked_p1', '1');
        const { area, icon } = mountTile();
        initPostLikes();

        expect(icon.getAttribute('fill')).toBe('#f43f5e');
        area.click();
        await flush();
        expect(fetchMock).toHaveBeenCalledWith(`${API}/posts/p1/unlike`, expect.anything());
    });

    it('ignores a second click while the first request is in flight', async () => {
        let resolve!: (v: unknown) => void;
        const fetchMock = vi.fn(() => new Promise(r => { resolve = r; }));
        vi.stubGlobal('fetch', fetchMock);
        const { area } = mountTile();
        initPostLikes();

        area.click();
        area.click();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(area.getAttribute('aria-busy')).toBe('true');

        resolve(ok({ likes: 4 }));
        await flush();
        expect(area.hasAttribute('aria-busy')).toBe(false);
    });

    it('changes nothing when the request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
        localStorage.setItem('postStatsCache.v1', '{"ts":1,"data":[]}');
        const { area, icon, count } = mountTile();
        initPostLikes();

        area.click();
        await flush();
        expect(count.textContent).toBe('3');
        expect(icon.getAttribute('fill')).toBe('none');
        expect(localStorage.getItem('liked_p1')).toBeNull();
        expect(localStorage.getItem('postStatsCache.v1')).not.toBeNull();
        expect(area.hasAttribute('aria-busy')).toBe(false);
    });

    it('keeps the click from following the card link', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        const { area } = mountTile();
        initPostLikes();

        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        area.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });
});
