import type { Post } from './posts';

const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
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

export const playlistService = {
    async getAll(): Promise<Playlist[]> {
        try {
            const response = await fetch(`${BASE_URL}/playlists`);
            if (!response.ok) throw new Error(`GET /playlists failed with ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data || []);
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
            if (failFast) throw error;
            return [];
        }
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
