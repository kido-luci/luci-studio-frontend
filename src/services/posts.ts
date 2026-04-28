// const BASE_URL = typeof window !== 'undefined' ? '/api' : (import.meta.env.PUBLIC_API_URL);
const BASE_URL = import.meta.env.PUBLIC_API_URL;
// const BASE_URL = "https://luci-web-blog-backend.fly.dev";

export interface Post {
    id: number;
    title: string;
    subtitle?: string;
    content: string;
    topics?: string[];
    cover_image_url?: string;
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
