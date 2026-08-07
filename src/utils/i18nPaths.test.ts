import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../services/posts';

const getAllPosts = vi.fn();
const getPostByID = vi.fn();
const getAllPlaylists = vi.fn();
const getPlaylistByID = vi.fn();

vi.mock('../services/posts', () => ({
    postService: { getAll: () => getAllPosts(), getByID: (id: string) => getPostByID(id) },
}));
vi.mock('../services/playlists', () => ({
    playlistService: { getAll: () => getAllPlaylists(), getByID: (id: string) => getPlaylistByID(id) },
}));

const { postPaths, seriesPaths } = await import('./i18nPaths');

function post(id: string, over: Partial<Post> = {}): Post {
    return {
        id,
        title: `Post ${id}`,
        content: '',
        views: 0,
        likes: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...over,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    // The retry path sleeps between attempts; fake timers keep the tests instant.
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

// Run a promise to completion while auto-advancing the retry backoff timers.
async function settle<T>(p: Promise<T>): Promise<T> {
    const done = p.then(
        v => ({ ok: true as const, v }),
        e => ({ ok: false as const, e }),
    );
    await vi.runAllTimersAsync();
    const r = await done;
    if (!r.ok) throw r.e;
    return r.v;
}

describe('postPaths', () => {
    it('emits one path per post, with the {title-slug}-{shortId} slug', async () => {
        getAllPosts.mockResolvedValue([post('42', { title: 'Hello World' })]);
        getPostByID.mockImplementation((id: string) => Promise.resolve(post(id)));

        const paths = await settle(postPaths());
        expect(paths).toHaveLength(1);
        expect(paths[0].params.slug).toBe('hello-world-42');
        expect(paths[0].props.post.id).toBe('42');
    });

    it('passes the FULL post from getByID as props, not the list summary', async () => {
        getAllPosts.mockResolvedValue([post('1', { content: '' })]);
        getPostByID.mockResolvedValue(post('1', { content: '# full body' }));

        const [p] = await settle(postPaths());
        expect(p.props.post.content).toBe('# full body');
    });

    it('gives each post the 3 most recent OTHER posts as related', async () => {
        const all = [
            post('1', { created_at: '2026-01-01T00:00:00Z' }),
            post('2', { created_at: '2026-05-01T00:00:00Z' }),
            post('3', { created_at: '2026-03-01T00:00:00Z' }),
            post('4', { created_at: '2026-04-01T00:00:00Z' }),
            post('5', { created_at: '2026-02-01T00:00:00Z' }),
        ];
        getAllPosts.mockResolvedValue(all);
        getPostByID.mockImplementation((id: string) => Promise.resolve(post(id)));

        const paths = await settle(postPaths());
        const forPost2 = paths.find(p => p.props.post.id === '2')!;
        expect(forPost2.props.related.map(r => r.id)).toEqual(['4', '3', '5']);
        expect(forPost2.props.related.map(r => r.id)).not.toContain('2');
    });

    it('drops a post whose detail fetch resolves null', async () => {
        getAllPosts.mockResolvedValue([post('1'), post('2')]);
        getPostByID.mockImplementation((id: string) =>
            Promise.resolve(id === '1' ? null : post(id)));

        const paths = await settle(postPaths());
        expect(paths.map(p => p.props.post.id)).toEqual(['2']);
    });

    it('retries a failing detail fetch and keeps the post when a retry succeeds', async () => {
        getAllPosts.mockResolvedValue([post('7')]);
        getPostByID
            .mockRejectedValueOnce(new Error('cold start'))
            .mockResolvedValueOnce(post('7'));

        const paths = await settle(postPaths());
        expect(getPostByID).toHaveBeenCalledTimes(2);
        expect(paths).toHaveLength(1);
    });

    // A post missing from the build but present in the sitemap produces a 404, so
    // postPaths deliberately fails the build instead of silently dropping it.
    it('rejects when a post still fails after 3 attempts', async () => {
        getAllPosts.mockResolvedValue([post('7')]);
        getPostByID.mockRejectedValue(new Error('backend down'));

        await expect(settle(postPaths())).rejects.toThrow('backend down');
        expect(getPostByID).toHaveBeenCalledTimes(3);
    });

    it('returns an empty list when there are no posts', async () => {
        getAllPosts.mockResolvedValue([]);
        expect(await settle(postPaths())).toEqual([]);
    });
});

describe('seriesPaths', () => {
    const playlist = (id: string, title = `List ${id}`) => ({ id, title });

    it('emits one path per playlist with the shared slug builder', async () => {
        getAllPlaylists.mockResolvedValue([playlist('9', 'Deep Dives')]);
        getPlaylistByID.mockImplementation((id: string) => Promise.resolve(playlist(id)));

        const paths = await settle(seriesPaths());
        expect(paths).toHaveLength(1);
        expect(paths[0].params.slug).toBe('deep-dives-9');
        expect(paths[0].props.playlist.id).toBe('9');
    });

    // Unlike postPaths, a failing playlist is skipped rather than failing the build.
    it('skips a playlist that fails all 3 attempts, keeping the others', async () => {
        getAllPlaylists.mockResolvedValue([playlist('1'), playlist('2')]);
        getPlaylistByID.mockImplementation((id: string) =>
            id === '1' ? Promise.reject(new Error('nope')) : Promise.resolve(playlist(id)));

        const paths = await settle(seriesPaths());
        expect(paths.map(p => p.props.playlist.id)).toEqual(['2']);
    });

    it('drops a playlist whose fetch resolves null', async () => {
        getAllPlaylists.mockResolvedValue([playlist('1')]);
        getPlaylistByID.mockResolvedValue(null);

        expect(await settle(seriesPaths())).toEqual([]);
    });

    it('preserves input order even though fetches run concurrently', async () => {
        const lists = ['1', '2', '3', '4', '5', '6'].map(id => playlist(id));
        getAllPlaylists.mockResolvedValue(lists);
        // Resolve later ids first, so ordering can only come from the index slot.
        getPlaylistByID.mockImplementation((id: string) =>
            new Promise(r => setTimeout(() => r(playlist(id)), (10 - Number(id)) * 10)));

        const paths = await settle(seriesPaths());
        expect(paths.map(p => p.props.playlist.id)).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('returns an empty list when there are no playlists', async () => {
        getAllPlaylists.mockResolvedValue([]);
        expect(await settle(seriesPaths())).toEqual([]);
    });
});
