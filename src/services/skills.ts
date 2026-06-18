const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export interface SkillCategory {
    id: string;
    name: string;
    accent_color: string;
    description?: string;
    items: string[];
    wide: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

let getAllPromise: Promise<SkillCategory[]> | null = null;

export const skillsService = {
    async getAll(): Promise<SkillCategory[]> {
        if (getAllPromise) return getAllPromise;
        getAllPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/skills`);
                if (!response.ok) throw new Error(`GET /skills failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error('Failed to fetch skills:', error);
                getAllPromise = null;
                return [];
            }
        })();
        return getAllPromise;
    },
};
