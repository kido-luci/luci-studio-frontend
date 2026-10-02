// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPostEngagement } from './postEngagement';
import { initPostLikes } from '../postLikes';

// The post page's view counter and its two like buttons (footer + floating
// pill). Views are counted once per session; likes share `liked_<id>` with the
// /blog tiles. Every request goes to a stubbed fetch.
const API = 'http://api.test';

function mountPost(id = 'p1') {
    document.body.innerHTML = `
        <div id="floating-like">
            <button id="floating-like-btn"><div id="floating-glow"></div><svg id="floating-like-icon" fill="none"></svg><span id="floating-like-count">5</span></button>
        </div>
        <main data-post-id="${id}" data-api-url="${API}">
            <header data-reveal></header>
            <span id="view-count">10</span>
            <span id="like-count-header">5</span>
            <button id="like-btn">
                <div id="like-ring"></div><div id="like-ring-border"></div>
                <svg id="like-icon" fill="none"></svg>
                <span id="like-count">5</span><span>likes</span>
            </button>
        </main>`;
    return {
        likeBtn: document.getElementById('like-btn')!,
        floatingBtn: document.getElementById('floating-like-btn')!,
        likeIcon: document.getElementById('like-icon')!,
        floatingIcon: document.getElementById('floating-like-icon')!,
    };
}

// Routes the stubbed fetch by URL. `like` decides the like/unlike response.
function stubApi(like: () => unknown = () => ({ ok: true, status: 200, json: async () => ({ likes: 6 }) })) {
    const fetchMock = vi.fn(async (url: string) => {
        if (url.includes('/posts/stats')) return { ok: true, status: 200, json: async () => [{ id: 'p1', views: 11, likes: 5 }] };
        if (url.endsWith('/view')) return { ok: true, status: 200, json: async () => ({ views: 11 }) };
        if (url.endsWith('/like') || url.endsWith('/unlike')) return like();
        throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

const calls = (fetchMock: ReturnType<typeof vi.fn>, suffix: string) =>
    fetchMock.mock.calls.filter(([url]) => String(url).endsWith(suffix));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('initPostEngagement', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('counts one view per session', async () => {
        const fetchMock = stubApi();
        localStorage.setItem('postStatsCache.v1', '{"ts":1,"data":[]}');
        mountPost();
        initPostEngagement();
        await flush();

        expect(calls(fetchMock, '/posts/p1/view')).toHaveLength(1);
        expect(sessionStorage.getItem('viewed_p1')).toBe('1');
        expect(document.getElementById('view-count')!.textContent).toBe('11');
        expect(localStorage.getItem('postStatsCache.v1')).toBeNull();

        // A reload in the same session only refreshes the counts.
        mountPost();
        initPostEngagement();
        await flush();
        expect(calls(fetchMock, '/posts/p1/view')).toHaveLength(1);
    });

    it('releases the session guard when the view request fails', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => (
            url.endsWith('/view') ? { ok: false, status: 500 } : { ok: true, status: 200, json: async () => [] }
        )));
        mountPost();
        initPostEngagement();
        await flush();

        expect(sessionStorage.getItem('viewed_p1')).toBeNull();
    });

    it('likes from either button and keeps both in step', async () => {
        const fetchMock = stubApi();
        const { likeBtn, floatingBtn, likeIcon, floatingIcon } = mountPost();
        initPostEngagement();
        await flush();
        localStorage.setItem('postStatsCache.v1', '{"ts":1,"data":[]}');

        floatingBtn.click();
        await flush();
        expect(calls(fetchMock, '/posts/p1/like')).toHaveLength(1);
        for (const id of ['like-count', 'floating-like-count', 'like-count-header']) {
            expect(document.getElementById(id)!.textContent).toBe('6');
        }
        expect(likeIcon.getAttribute('fill')).toBe('#f43f5e');
        expect(floatingIcon.getAttribute('fill')).toBe('#f43f5e');
        expect(localStorage.getItem('liked_p1')).toBe('1');
        expect(localStorage.getItem('postStatsCache.v1')).toBeNull();

        likeBtn.click();
        await flush();
        expect(calls(fetchMock, '/posts/p1/unlike')).toHaveLength(1);
        expect(likeIcon.getAttribute('fill')).toBe('none');
        expect(localStorage.getItem('liked_p1')).toBe('0');
    });

    it('ignores a second click while the first request is in flight', async () => {
        let resolve!: (v: unknown) => void;
        const fetchMock = stubApi(() => new Promise(r => { resolve = r; }));
        const { likeBtn, floatingBtn } = mountPost();
        initPostEngagement();
        await flush();

        likeBtn.click();
        floatingBtn.click();
        likeBtn.click();
        expect(calls(fetchMock, '/posts/p1/like')).toHaveLength(1);
        expect(likeBtn.getAttribute('aria-busy')).toBe('true');

        resolve({ ok: true, status: 200, json: async () => ({ likes: 6 }) });
        await flush();
        expect(likeBtn.hasAttribute('aria-busy')).toBe(false);
        expect(floatingBtn.hasAttribute('aria-busy')).toBe(false);
    });

    it('changes nothing when the like request fails', async () => {
        stubApi(() => ({ ok: false, status: 500 }));
        const { likeBtn, likeIcon } = mountPost();
        initPostEngagement();
        await flush();
        const likedBefore = localStorage.getItem('liked_p1');

        likeBtn.click();
        await flush();
        expect(document.getElementById('like-count')!.textContent).toBe('5');
        expect(likeIcon.getAttribute('fill')).toBe('none');
        expect(localStorage.getItem('liked_p1')).toBe(likedBefore);
        expect(likeBtn.hasAttribute('aria-busy')).toBe(false);
    });

    it('shares liked_<id> with the /blog tiles', async () => {
        stubApi();
        const { likeBtn } = mountPost();
        initPostEngagement();
        await flush();
        likeBtn.click();
        await flush();

        // A tile for the same post, rendered later, starts liked.
        document.body.innerHTML = `
            <main data-api-url="${API}">
                <span class="tile-like-area" data-id="p1"><svg class="tile-like-icon" fill="none"></svg><span class="tile-like-count">6</span></span>
            </main>`;
        initPostLikes();
        expect(document.querySelector('.tile-like-icon')!.getAttribute('fill')).toBe('#f43f5e');
    });

    it('starts liked when a /blog tile already liked the post', async () => {
        const fetchMock = stubApi(() => ({ ok: true, status: 200, json: async () => ({ likes: 4 }) }));
        localStorage.setItem('liked_p1', '1');
        const { likeBtn, likeIcon } = mountPost();
        initPostEngagement();
        await flush();

        expect(likeIcon.getAttribute('fill')).toBe('#f43f5e');
        likeBtn.click();
        await flush();
        expect(calls(fetchMock, '/posts/p1/unlike')).toHaveLength(1);
    });
});
