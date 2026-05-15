const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const failFast = import.meta.env.PROD && import.meta.env.ALLOW_EMPTY_POSTS !== '1';

export interface Post {
    id: number;
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

export const postService = {
    async getAll(): Promise<Post[]> {
        try {
            const response = await fetch(`${BASE_URL}/posts`);
            if (!response.ok) throw new Error(`GET /posts failed with ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data || []);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            if (failFast) throw error;
            return [];
        }
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
