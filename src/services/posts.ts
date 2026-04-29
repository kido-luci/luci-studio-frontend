const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export interface Post {
    id: number;
    title: string;
    subtitle?: string;
    content: string;
    topics?: string[];
    cover_image_url?: string;
    views: number;
    likes: number;
    created_at: string;
    updated_at: string;
}

export const postService = {
    async getAll(): Promise<Post[]> {
        try {
            const response = await fetch(`${BASE_URL}/posts`);
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : (data || []);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            return [];
        }
    },

    async getByID(id: string | number): Promise<Post | null> {
        try {
            const response = await fetch(`${BASE_URL}/posts/${id}`);
            if (!response.ok) return null;
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch post ${id}:`, error);
            return null;
        }
    }
};
