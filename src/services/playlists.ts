import type { Post } from './posts';
import { BASE_URL } from '../lib/apiClient';

const failFast = import.meta.env.PROD && import.meta.env.ALLOW_EMPTY_POSTS !== '1';

export interface Playlist {
    id: string;
    title: string;
    description: string;
    cover_image_url?: string;
    post_ids: string[];
    posts?: Post[];
    created_at: string;
    updated_at: string;
}

// Module-scoped cache of the in-flight getAll promise. Astro shares module
// state across all pages within a single build, so this dedupes the three
// build-time callers (/blog, /blog/series, /blog/series/[slug]) into
// one network round-trip. Reset on error so a transient failure doesn't
// poison subsequent retries.
let getAllPromise: Promise<Playlist[]> | null = null;

export const playlistService = {
    async getAll(): Promise<Playlist[]> {
        if (getAllPromise) return getAllPromise;
        getAllPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/playlists`);
                if (!response.ok) throw new Error(`GET /playlists failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error('Failed to fetch playlists:', error);
                getAllPromise = null;
                if (failFast) throw error;
                return [];
            }
        })();
        return getAllPromise;
    },

    async getByID(id: string | number): Promise<Playlist | null> {
        try {
            const response = await fetch(`${BASE_URL}/playlists/${id}`);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`GET /playlists/${id} failed with ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch playlist ${id}:`, error);
            if (failFast) throw error;
            return null;
        }
    }
};
