import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { galleryService, type GalleryItem } from './gallery';

const sampleItem: GalleryItem = {
    id: 'gal-1',
    title: 'Sunset',
    cover_image_url: 'https://media.luci-studio.com/x.webp',
    views: 12,
    likes: 3,
    created_at: '2026-05-22T00:00:00Z',
    updated_at: '2026-05-22T00:00:00Z',
};

describe('galleryService', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAll', () => {
        it('returns the array on a successful response', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => [sampleItem],
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await galleryService.getAll();
            expect(result).toEqual([sampleItem]);
            expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/gallery\/public$/);
        });

        it('normalises a non-array success payload to []', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => null,
            }));
            expect(await galleryService.getAll()).toEqual([]);
        });

        it('returns [] when the response is not ok', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 502,
                json: async () => ({}),
            }));
            expect(await galleryService.getAll()).toEqual([]);
        });

        it('returns [] when fetch rejects', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
            expect(await galleryService.getAll()).toEqual([]);
        });
    });

    describe('getByID', () => {
        it('returns the item on success', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => sampleItem,
            }));
            expect(await galleryService.getByID('gal-1')).toEqual(sampleItem);
        });

        it('returns null silently on 404', async () => {
            const errorSpy = vi.spyOn(console, 'error');
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({}),
            }));
            expect(await galleryService.getByID('missing')).toBeNull();
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('returns null on other failures', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
            expect(await galleryService.getByID('any')).toBeNull();
        });
    });
});
