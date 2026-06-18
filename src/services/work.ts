const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export interface WorkLink {
    label: string;
    url: string;
}

export interface WorkItem {
    id: string;
    title: string;
    category: 'paid' | 'indie';
    featured: boolean;
    period: string;
    role?: string;
    company?: string;
    location?: string;
    summary?: string;
    card_description?: string;
    achievements: string[];
    tech: string[];
    links: WorkLink[];
    card_image_url?: string;
    logo_url?: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

let getAllPromise: Promise<WorkItem[]> | null = null;

export const workService = {
    async getAll(): Promise<WorkItem[]> {
        if (getAllPromise) return getAllPromise;
        getAllPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/work`);
                if (!response.ok) throw new Error(`GET /work failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error('Failed to fetch work items:', error);
                getAllPromise = null;
                return [];
            }
        })();
        return getAllPromise;
    },
};
