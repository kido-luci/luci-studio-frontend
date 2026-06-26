import { BASE_URL } from '../lib/apiClient';

const failFast = import.meta.env.PROD && import.meta.env.ALLOW_EMPTY_POSTS !== '1';

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
}

// Module-scoped cache of the in-flight getAll promise. Astro shares module
// state across all pages within a single build, so this dedupes build-time
// callers (/blog, /blog/[slug] getStaticPaths, /blog/series/[slug], etc.)
// into one network round-trip. Reset on error so a transient failure doesn't
// poison subsequent retries.
let getAllPromise: Promise<Post[]> | null = null;

export const postService = {
    async getAll(): Promise<Post[]> {
        if (getAllPromise) return getAllPromise;
        getAllPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/posts`);
                if (!response.ok) throw new Error(`GET /posts failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error('Failed to fetch posts:', error);
                getAllPromise = null;
                if (failFast) throw error;
                return [];
            }
        })();
        return getAllPromise;
    },

    async getByID(id: string | number): Promise<Post | null> {
        try {
            const response = await fetch(`${BASE_URL}/posts/${id}`);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`GET /posts/${id} failed with ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch post ${id}:`, error);
            if (failFast) throw error;
            return null;
        }
    }
};
