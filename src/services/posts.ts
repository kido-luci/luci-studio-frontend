import { cachedGetAll, fetchOne, FAIL_FAST } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

export interface Post {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    topics?: string[];
    cover_image_url?: string;
    views: number;
    likes: number;
    word_count?: number;
    created_at: string;
    updated_at: string;
    translations?: LocaleOverlay | null;
}

export const postService = {
    // Build-time cached: /blog, /blog/[slug] getStaticPaths, /blog/series/[slug],
    // etc. share one network round-trip. Fails the prod build on fetch errors.
    getAll: cachedGetAll<Post>('/posts', { failFast: FAIL_FAST }),

    getByID: (id: string | number): Promise<Post | null> =>
        fetchOne<Post>(`/posts/${id}`, { failFast: FAIL_FAST }),
};
