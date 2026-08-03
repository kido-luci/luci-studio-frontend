import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedGetAll, fetchOne } from './apiClient';

// These two helpers decide whether a broken backend fails the build or silently
// ships an empty site, so the failFast / 404 / dedupe behaviour is load-bearing.
describe('apiClient', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('cachedGetAll', () => {
        it('returns the array from a successful response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [{ id: 'a' }],
            }));

            await expect(cachedGetAll<{ id: string }>('/posts')()).resolves.toEqual([{ id: 'a' }]);
        });

        it('normalises a non-array payload to an array', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => null }));

            await expect(cachedGetAll('/posts')()).resolves.toEqual([]);
        });

        it('fetches once no matter how many callers ask', async () => {
            const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
            vi.stubGlobal('fetch', fetchMock);
            const getAll = cachedGetAll('/posts');

            await Promise.all([getAll(), getAll(), getAll()]);
            await getAll();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('resolves to an empty array on a non-ok response when failFast is off', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(cachedGetAll('/posts')()).resolves.toEqual([]);
        });

        it('rejects on a non-ok response when failFast is on', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(cachedGetAll('/posts', { failFast: true })()).rejects.toThrow('500');
        });

        it('does not cache a failure, so a later call can still succeed', async () => {
            const fetchMock = vi.fn()
                .mockRejectedValueOnce(new Error('network down'))
                .mockResolvedValue({ ok: true, json: async () => [{ id: 'a' }] });
            vi.stubGlobal('fetch', fetchMock);
            const getAll = cachedGetAll<{ id: string }>('/posts');

            await expect(getAll()).resolves.toEqual([]);
            await expect(getAll()).resolves.toEqual([{ id: 'a' }]);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe('fetchOne', () => {
        it('returns the parsed body on success', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ id: 'a' }),
            }));

            await expect(fetchOne<{ id: string }>('/posts/a')).resolves.toEqual({ id: 'a' });
        });

        it('treats 404 as a known empty state, even with failFast on', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

            await expect(fetchOne('/posts/nope', { failFast: true })).resolves.toBeNull();
            expect(console.error).not.toHaveBeenCalled();
        });

        it('resolves null on other failures when failFast is off', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(fetchOne('/posts/a')).resolves.toBeNull();
        });

        it('rejects on other failures when failFast is on', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(fetchOne('/posts/a', { failFast: true })).rejects.toThrow('500');
        });
    });
});
