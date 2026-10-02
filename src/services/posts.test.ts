import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, postService as PostService } from './posts';

const samplePost: Post = {
    id: 'abc-123',
    title: 'Hello world',
    content: '# hi',
    views: 0,
    likes: 0,
    created_at: '2026-05-22T00:00:00Z',
    updated_at: '2026-05-22T00:00:00Z',
};

// posts.ts holds a module-scoped getAll cache. Reset modules between tests so
// each one starts with a fresh, uncached service.
let postService: typeof PostService;

describe('postService', () => {
    beforeEach(async () => {
        // Silence the expected console.error in failure paths.
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.resetModules();
        ({ postService } = await import('./posts'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('getAll', () => {
        it('returns the array on a successful response', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => [samplePost],
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await postService.getAll();
            expect(result).toEqual([samplePost]);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/posts$/);
        });

        it('normalises a non-array success payload to []', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => null,
            }));
            expect(await postService.getAll()).toEqual([]);
        });

        it('returns [] when the response is not ok', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({}),
            }));
            expect(await postService.getAll()).toEqual([]);
        });

        it('returns [] when fetch throws (network error)', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
            expect(await postService.getAll()).toEqual([]);
        });
    });

    describe('getByID', () => {
        it('returns the post on a successful response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => samplePost,
            }));
            expect(await postService.getByID('abc-123')).toEqual(samplePost);
        });

        it('returns null on a 404 without throwing', async () => {
            const errorSpy = vi.spyOn(console, 'error');
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({}),
            }));
            expect(await postService.getByID('missing')).toBeNull();
            // 404 is a known empty state, not an error — don't log it.
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('returns null on other non-ok statuses', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({}),
            }));
            expect(await postService.getByID('boom')).toBeNull();
        });

        it('returns null when fetch throws', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
            expect(await postService.getByID('any')).toBeNull();
        });

        // The en and vi routes both read every post during one build.
        it('fetches once across callers', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => samplePost,
            });
            vi.stubGlobal('fetch', fetchMock);

            await Promise.all([postService.getByID('abc-123'), postService.getByID('abc-123')]);
            expect(await postService.getByID('abc-123')).toEqual(samplePost);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('does not cache a failure, so a later call fetches again', async () => {
            const fetchMock = vi.fn()
                .mockRejectedValueOnce(new Error('network down'))
                .mockResolvedValue({ ok: true, status: 200, json: async () => samplePost });
            vi.stubGlobal('fetch', fetchMock);

            expect(await postService.getByID('abc-123')).toBeNull();
            expect(await postService.getByID('abc-123')).toEqual(samplePost);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('does not cache a 404, so a later call fetches again', async () => {
            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
                .mockResolvedValue({ ok: true, status: 200, json: async () => samplePost });
            vi.stubGlobal('fetch', fetchMock);

            expect(await postService.getByID('abc-123')).toBeNull();
            expect(await postService.getByID('abc-123')).toEqual(samplePost);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });
});
