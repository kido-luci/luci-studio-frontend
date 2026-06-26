import { BASE_URL } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

const failFast = import.meta.env.PROD && import.meta.env.ALLOW_EMPTY_POSTS !== '1';

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
    async getAll(): Promise<GalleryItem[]> {
        try {
            const response = await fetch(`${BASE_URL}/gallery`);
            if (!response.ok) throw new Error(`GET /gallery failed with ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data || []);
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
            if (failFast) throw error;
            return [];
        }
    },

    async getByID(id: string | number): Promise<GalleryItem | null> {
        try {
            const response = await fetch(`${BASE_URL}/gallery/${id}`);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`GET /gallery/${id} failed with ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch gallery item ${id}:`, error);
            if (failFast) throw error;
            return null;
        }
    }
};
