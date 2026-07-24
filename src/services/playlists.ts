import type { Post } from './posts';
import { cachedGetAll, fetchOne, FAIL_FAST } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

export interface Playlist {
    id: string;
    title: string;
    description: string;
    cover_image_url?: string;
    post_ids: string[];
    posts?: Post[];
    created_at: string;
    updated_at: string;
    translations?: LocaleOverlay | null;
}

export const playlistService = {
    // Build-time cached: /blog, /blog/series, /blog/series/[slug] share one
    // network round-trip. Fails the prod build on fetch errors.
    getAll: cachedGetAll<Playlist>('/playlists', { failFast: FAIL_FAST }),

    getByID: (id: string | number): Promise<Playlist | null> =>
        fetchOne<Playlist>(`/playlists/${id}`, { failFast: FAIL_FAST }),
};
