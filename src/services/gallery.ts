import { cachedGetAll, fetchOne, FAIL_FAST } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

export interface GalleryItem {
    id: string;
    title: string;
    cover_image_url?: string;
    views: number;
    likes: number;
    created_at: string;
    updated_at: string;
    translations?: LocaleOverlay | null;
}

export const galleryService = {
    // Active pieces only — deactivated artwork stays out of the public build.
    getAll: cachedGetAll<GalleryItem>('/gallery/public', { failFast: FAIL_FAST }),

    getByID: (id: string | number): Promise<GalleryItem | null> =>
        fetchOne<GalleryItem>(`/gallery/${id}`, { failFast: FAIL_FAST }),
};
